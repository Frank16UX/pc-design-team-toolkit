---
name: granola-meeting-extractor
description: >-
  Pull the signal out of a Granola meeting and hand back a tight briefing: a
  TLDR, action items (with owners, and the user's own tasks called out
  separately), plus every timeline and deadline mentioned. Use this whenever the
  user shares a Granola meeting link (notes.granola.ai or any URL/text
  containing a meeting UUID) or names a Granola meeting and asks what to do
  next, what they owe, what was decided, what the takeaways were, or asks for a
  summary, recap, follow-ups, "my action items", or deadlines from a Granola
  call. Trigger even when the user does not say the word "Granola" but clearly
  points at a meeting in their Granola notes, and even when they only ask for
  one piece (just the TLDR, or just their tasks). Reach for this over a generic
  summary because it knows how to find the user inside the transcript and
  separate their commitments from everyone else's.
---

# Granola meeting extractor

The job here is to turn one Granola meeting into a briefing the user can act on
in under a minute. People leave meetings unsure of two things: what they
personally signed up for, and when things are due. Everything below is built to
answer those two questions reliably, with a short TLDR on top for context.

Granola gives you two complementary sources for a meeting: the AI summary and
private notes (via `get_meetings`), and the verbatim transcript (via
`get_meeting_transcript`). The summary is a fast scaffold but it misses or
softens commitments; the transcript is where promises actually get made ("I'll
send that over by Thursday"). Use both, and trust the transcript when they
disagree.

## Step 1 — Get the meeting ID

Granola meeting IDs are UUIDs, like `5df0f906-97b1-4702-9bba-96a93f919001`. The
user usually pastes a link (for example `https://notes.granola.ai/d/<uuid>`),
but the path format varies and does not matter. Pull the first UUID-shaped
string out of whatever they give you with this pattern:

```
[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}
```

If there is no UUID in the text (some public share links use a slug instead),
do not guess. Call `list_meetings` and match on the title and/or date the user
mentioned. If several meetings could match, show the candidates with their dates
and ask which one. Getting the right meeting matters more than saving a question.

## Step 2 — Figure out who "me" is

This is the part a generic summarizer gets wrong, so do it deliberately.

Call `get_account_info` to get the connected account email (for this user it is
`franklinperez@ravn.co`). Then build an "identity set" for that person, because
the same human shows up under several labels in one meeting. Granola lists
participants like:

```
Frank Perez (note creator) from Ravn <franklinperez@ravn.co>,
Perez, Frank <fperez@pamperedchef.com>, ...
```

Notice the user appears twice there: once under their real email, once under a
client-domain alias with a flipped "Last, First" name. Both are them. So your
identity set should include: the account email, any participant entry whose name
clearly refers to the same person (first name, "First Last", and "Last, First"
orderings), and the "(note creator)" entry, which is almost always the user.
When the transcript attributes a line or a task to any of these, count it as the
user's.

If you genuinely cannot tell whether a task is the user's or a different person
with a similar name, put it under the user's list but tag it `(confirm)` rather
than dropping it. A missed personal commitment is worse than one the user has to
glance at.

## Step 3 — Fetch the content

Call `get_meetings` with the single ID for the summary, notes, attendees, and
metadata. Call `get_meeting_transcript` with the same ID for the verbatim text.
Read the transcript for commitments and dates, not just the summary. If the
transcript is very long, the summary plus a targeted scan for owner names and
date words ("by", "before", "EOD", "next week", weekday names, month names)
gets you most of the way.

## Step 4 — Ask how they want it delivered

Before writing the briefing, ask one quick question: inline in chat, saved as a
markdown file, or both. Keep it to that single question. If the user already
said in their request (for example "save it" or "just tell me here"), skip the
question and honor it. If they want a file, write it to the outputs folder named
like `<meeting-title>-briefing.md` and then present it.

## Step 5 — Write the briefing

Use this structure. Lead with the user's tasks region high up, because that is
what they came for.

```
# [Meeting title] ([date])

## TLDR
3 to 5 sentences (or tight bullets) covering why the meeting happened, the
main decisions, and where things landed. Someone who missed the call should
understand the state of play from this alone.

## Your action items
- [ ] [What Frank owes], due [date or "no date given"]
Only the things the user is on the hook for. If none, say "Nothing assigned to
you in this meeting." plainly rather than padding.

## Other action items
- [Owner name]: [their task], due [date or "no date given"]
Group by owner if one person has several. Skip if there were none.

## Timelines & deadlines
- [Date]: [what is due or happening then]
Every dated commitment, milestone, or scheduled follow-up, the user's and
everyone else's, in chronological order. Resolve relative dates ("next Friday",
"EOD tomorrow") against the meeting date and show the actual date, with the
original phrasing in parentheses if it helps, e.g. "July 3 (they said 'end of
next week')".
```

Drop a section entirely if it is empty, except "Your action items", which should
always be present even if only to confirm the user owes nothing.

## How to pick out action items

An action item is a concrete commitment to do something, not a topic that was
discussed. "We talked about the onboarding flow" is not an action item; "Diana
will mock up the onboarding flow" is. Look for an owner plus a verb plus a
deliverable. Watch for soft ownership ("someone should...", "we need to...")
and either attribute it if the transcript later pins it on a person, or list it
under "Other action items" as `[Unassigned]` so it does not vanish.

Attribute by name using the transcript. If the summary says "follow up on
pricing" with no owner but the transcript shows the user saying "yeah I'll take
the pricing follow-up", that is one of the user's items. This cross-check is the
main reason to read the transcript and not just the summary.

## Timelines and deadlines

Capture anything time-bound: due dates on tasks, scheduled next meetings,
launch or review dates, "let's revisit in two weeks". Always convert relative
references to a real calendar date using the meeting date as the anchor, since
the user will read this days later when "tomorrow" is meaningless. If a deadline
is vague ("sometime next sprint"), keep it but say so rather than inventing
precision.

## Voice and formatting

Write like a sharp colleague firing off a recap, not a report generator. Plain,
direct sentences. Do not use em dashes (—) anywhere; if you need a pause or an
aside, use a comma, a colon, parentheses, or a period. This keeps the output
reading as human-written. Keep names as they appear in the meeting so the user
recognizes who is who. No filler, no "in conclusion", no restating the template
headers as prose.

## Edge cases worth handling

- Solo notes (the user is the only participant): there are no "other" action
  items, so just give the TLDR, the user's items, and any dates. Do not
  fabricate other owners.
- Transcript missing or empty: work from the summary and notes, and say up front
  that you are working without a verbatim transcript so the user knows the
  attribution is best-effort.
- Meeting not found for the given ID: report that plainly and offer to list
  recent meetings so they can pick the right one, rather than guessing.
- The user asks for only one piece ("just my tasks", "what are the deadlines"):
  give that section well rather than dumping the whole template.
