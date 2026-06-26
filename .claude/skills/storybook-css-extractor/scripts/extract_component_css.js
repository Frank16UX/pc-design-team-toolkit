/**
 * Storybook CSS Extractor
 * -----------------------
 * Extracts everything needed for a downstream QA skill (e.g. pc-storybook-qa) to
 * audit a Storybook component against a reference implementation.
 *
 * Returns: DOM structure, logical→hashed class map, every CSS rule that targets
 * the component (verbatim, including states the page isn't currently displaying),
 * computed styles for each sub-element, and metadata about how it was extracted.
 *
 * Does NOT do comparisons or token mapping — that's the next skill's job.
 *
 * Usage (in DevTools console or via Chrome connector javascript_tool):
 *   await extractStorybookComponentCSS('accordion')
 *
 * Returns a Promise<object>. The fetch step makes this async.
 *
 * Why both cssRules and fetch():
 * - cssRules gives parsed rules (handy for selector matching) but normalizes
 *   whitespace and may be CORS-blocked.
 * - fetch() on the stylesheet URL gives the raw text — more authentic, captures
 *   @media/@supports blocks reliably, works for CORS-blocked sheets via direct GET.
 * Both passes contribute; rules are deduped by selector text.
 */
async function extractStorybookComponentCSS(componentName) {
  if (!componentName || typeof componentName !== 'string') {
    return { error: 'componentName (string) is required' };
  }

  const lower = componentName.toLowerCase();

  // Resolve the document we should inspect. Storybook iframe takes precedence.
  let doc = document;
  let iframeURL = null;
  let inIframe = false;
  const iframe = document.querySelector(
    'iframe#storybook-preview-iframe, iframe[id*="storybook"]'
  );
  if (iframe) {
    try {
      if (iframe.contentDocument) {
        doc = iframe.contentDocument;
        iframeURL = iframe.src || iframe.contentWindow.location.href;
        inIframe = true;
      }
    } catch (e) {
      // Cross-origin iframe — caller will need to run inside the iframe context.
    }
  }

  const win = doc.defaultView || window;

  const result = {
    componentName,
    sourceURL: location.href,
    iframeURL,
    inIframe,
    originStylesheets: [],
    domStructure: '',
    classMap: [],
    rules: [],
    rulesText: '',  // concatenated CSS rules ready to write to a .css file
    ruleCount: 0,
    computedStyles: [],
    warnings: []
  };

  // ─── 1. Find candidate elements and build the class map ───────────────────
  // Use case-insensitive matching since CSS-Module hashes often capitalize the
  // logical name (e.g. Accordion-module__accordion___xxxxx).
  const candidateSelectors = [
    `[class*="${lower}" i]`,
    `[data-component="${lower}" i]`,
    `[data-testid*="${lower}" i]`
  ];
  const seen = new Set();
  const elements = [];
  for (const sel of candidateSelectors) {
    try {
      doc.querySelectorAll(sel).forEach(el => {
        if (!seen.has(el)) {
          seen.add(el);
          elements.push(el);
        }
      });
    } catch (e) { /* invalid selector — skip */ }
  }

  // Build a map of unique logical class names → hashed class names.
  // CSS-Modules pattern: `Prefix-module__logical___hash` or `prefix__logical--hash`.
  const classRegistry = new Map(); // logical → hashed
  const classRegex = /([A-Za-z][\w-]*-module__|[\w-]+__)([\w-]+)(___[\w-]+|--[\w-]+)?/g;
  for (const el of elements) {
    const cls = typeof el.className === 'string' ? el.className : (el.getAttribute('class') || '');
    for (const fullClass of cls.split(/\s+/).filter(Boolean)) {
      const m = fullClass.match(/^([A-Za-z][\w-]*?-module__)([\w-]+?)(___[\w-]+)?$/);
      if (m) {
        const logical = m[2];
        if (!classRegistry.has(logical)) classRegistry.set(logical, fullClass);
      } else if (fullClass.toLowerCase().includes(lower)) {
        // Non-CSS-Modules class that still mentions the component
        if (!classRegistry.has(fullClass)) classRegistry.set(fullClass, fullClass);
      }
    }
  }
  for (const [logical, hashed] of classRegistry) {
    result.classMap.push({ logical, hashed });
  }

  // ─── 2. Capture DOM structure of the first/largest matching element ───────
  if (elements.length > 0) {
    // Find the outermost matching element to get the most useful tree.
    let root = elements[0];
    for (const el of elements) {
      if (root.contains(el)) continue;
      if (el.contains(root)) root = el;
    }
    // Snapshot a trimmed outerHTML — strip script/style children, condense whitespace.
    const clone = root.cloneNode(true);
    clone.querySelectorAll('script, style').forEach(n => n.remove());
    let html = clone.outerHTML;
    // Truncate if absurdly long.
    if (html.length > 8000) html = html.slice(0, 8000) + '\n... (truncated)';
    result.domStructure = html;
  }

  // ─── 3. Walk cssRules to identify which sheets contain matching rules ────
  const matchedRulesBySheet = new Map(); // sheet href → array of {selector, cssText}
  const allMatchedRules = []; // for dedup

  for (const sheet of doc.styleSheets) {
    let rules;
    try {
      rules = sheet.cssRules || sheet.rules;
    } catch (e) {
      result.warnings.push(`Skipped stylesheet via cssRules (CORS): ${sheet.href || '(inline)'}`);
      continue;
    }
    if (!rules) continue;

    const localMatches = [];
    const visit = (rule, mediaContext) => {
      if (rule.selectorText && rule.selectorText.toLowerCase().includes(lower)) {
        localMatches.push({
          selector: rule.selectorText,
          cssText: rule.cssText,
          media: mediaContext || null
        });
      }
      if (rule.cssRules) {
        const newCtx = rule.conditionText || (rule.media && rule.media.mediaText) || mediaContext;
        for (const inner of rule.cssRules) visit(inner, newCtx);
      }
    };
    for (const rule of rules) visit(rule, null);

    if (localMatches.length > 0) {
      const href = sheet.href || '(inline)';
      matchedRulesBySheet.set(href, localMatches);
      if (sheet.href && !result.originStylesheets.includes(sheet.href)) {
        result.originStylesheets.push(sheet.href);
      }
      for (const r of localMatches) allMatchedRules.push(r);
    }
  }

  // ─── 4. Fetch matched stylesheets directly to get verbatim text ───────────
  // Why: cssRules normalizes whitespace. The raw text is more useful for the
  // downstream QA report. Also catches rules in CORS-blocked sheets if they're
  // same-origin (most are, since Storybook builds bundle CSS into the same origin).
  for (const href of result.originStylesheets) {
    try {
      const resp = await fetch(href, { credentials: 'omit' });
      if (!resp.ok) {
        result.warnings.push(`fetch ${href} → HTTP ${resp.status}`);
        continue;
      }
      const text = await resp.text();
      // Find all rules whose selector mentions the component name (case-insensitive).
      // This regex captures `selector { body }` blocks at the top level.
      const ruleRegex = /([^{}/]+)\{([^{}]*)\}/g;
      let match;
      while ((match = ruleRegex.exec(text)) !== null) {
        const selector = match[1].trim();
        const body = match[2].trim();
        if (!selector) continue;
        if (selector.toLowerCase().includes(lower)) {
          const cssText = `${selector}{${body}}`;
          // Dedup by selector — prefer the raw-text version over cssRules version.
          const existing = allMatchedRules.findIndex(r => r.selector === selector);
          if (existing >= 0) {
            allMatchedRules[existing] = { selector, cssText, sourceHref: href, media: null };
          } else {
            allMatchedRules.push({ selector, cssText, sourceHref: href, media: null });
          }
        }
      }
    } catch (e) {
      result.warnings.push(`fetch ${href} failed: ${e.message}`);
    }
  }

  result.rules = allMatchedRules;
  result.ruleCount = allMatchedRules.length;
  // Concatenate rules into a single CSS string ready to drop into a .css file.
  // Pretty-print minified rules with a line break before each `{` and after each `;`
  // so the file is readable when opened directly. The rule semantics are identical.
  const prettify = (cssText) => cssText
    .replace(/\s*\{\s*/g, '{\n  ')
    .replace(/;\s*/g, ';\n  ')
    .replace(/\s*\}\s*/g, '\n}');
  result.rulesText = allMatchedRules
    .map(r => prettify(r.cssText))
    .join('\n\n');

  // ─── 5. Sample computed styles for one representative of each logical class ──
  // The aim is one sample per sub-element type (header, title, content, etc.),
  // not 25 redundant samples of the same element.
  const KEY_PROPERTIES = [
    'display', 'box-sizing', 'position',
    'width', 'min-width', 'max-width', 'height', 'min-height', 'max-height',
    'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
    'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
    'gap', 'row-gap', 'column-gap',
    'border', 'border-top', 'border-right', 'border-bottom', 'border-left',
    'border-radius', 'border-color',
    'background-color', 'color',
    'font-family', 'font-size', 'font-weight', 'line-height', 'letter-spacing',
    'text-decoration', 'text-transform', 'opacity',
    'box-shadow', 'outline', 'outline-offset',
    'flex-direction', 'align-items', 'justify-content', 'flex-shrink',
    'cursor', 'user-select'
  ];

  const samplesByLogical = new Map();
  for (const el of elements) {
    const cls = typeof el.className === 'string' ? el.className : (el.getAttribute('class') || '');
    for (const fullClass of cls.split(/\s+/).filter(Boolean)) {
      const m = fullClass.match(/^([A-Za-z][\w-]*?-module__)([\w-]+?)(___[\w-]+)?$/);
      const logical = m ? m[2] : (fullClass.toLowerCase().includes(lower) ? fullClass : null);
      if (!logical) continue;
      if (samplesByLogical.has(logical)) continue;
      samplesByLogical.set(logical, { el, fullClass });
    }
  }

  for (const [logical, { el, fullClass }] of samplesByLogical) {
    const computed = win.getComputedStyle(el);
    const sample = {};
    for (const prop of KEY_PROPERTIES) {
      const value = computed.getPropertyValue(prop);
      if (value && value !== 'normal' && value !== 'auto') {
        sample[prop] = value.trim();
      }
    }
    result.computedStyles.push({
      logical,
      selector: '.' + fullClass,
      tag: el.tagName,
      sample
    });
  }

  return result;
}

// Auto-invoke if a global componentName is set (useful when called from
// javascript_tool which evaluates the script and returns the last expression).
if (typeof __SBX_COMPONENT_NAME__ !== 'undefined') {
  extractStorybookComponentCSS(__SBX_COMPONENT_NAME__);
}
