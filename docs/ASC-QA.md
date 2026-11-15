# ASC: accessibility audit and design review

Covers every ASC screen and state in v4.0: ASC Contacts, the Home card, a contact's four steps (with the returning-caller and quick-lookup helpers, MCI results, no match, new client, confirm, anonymous, identified, interaction cards, reminders, follow-up, on-site steps, wrap-up errors, closed), Previous Interactions, Urgent Routing and the client's ASC tab. Audited 11/13/2026.

## Accessibility audit: ASC
**Standard:** WCAG 2.2 AA | **Method:** an automated scan of each state (contrast, control edges, names, labels, ARIA references, duplicate IDs, heading order, target size, focus visibility and obscuring while tabbing every control, reflow at 320px, text spacing), keyboard-only runs, and a review of the code for each criterion the scan can't check. Screen-reader testing with NVDA and VoiceOver is still to do with real users.

### Summary
**Issues found:** 14 | **Critical:** 1 | **Major:** 6 | **Minor:** 7 | **Open:** 0

### Findings

#### Perceivable
| # | Issue | WCAG Criterion | Severity | Fix |
|---|-------|---------------|----------|-----|
| 1 | Urgent Routing text on the top bar was 4.35:1 | 1.4.3 Contrast | 🟡 Major | Darker red, `#8A2A20` (6.3:1) |
| 2 | Rows-per-page menu edge was 1.3:1 (CoLab-wide) | 1.4.11 Non-text contrast | 🟢 Minor | Edge uses Stone |
| 3 | Selected crisis destination shown by color and border alone | 1.4.1 Use of color | 🟢 Minor | Adds a check icon |
| 4 | Contact steps pushed the page sideways at 320px (screen-reader text escaped the scrolling tab strip) | 1.4.10 Reflow | 🟡 Major | Contained; on phones the steps wrap instead of scrolling |
| 5 | Helper forms and ASC tab cards skipped from h2 to h4 | 1.3.1 Info and relationships | 🟢 Minor | h3 |

#### Operable
| # | Issue | WCAG Criterion | Severity | Fix |
|---|-------|---------------|----------|-----|
| 6 | Focus could leave an open dialog and land on the page behind it (CoLab-wide) | 2.4.11 Focus not obscured, 2.4.3 Focus order | 🔴 Critical | Tab pulls focus back into the dialog |
| 7 | Focus fell to the page when a block was replaced: Close Contact, Continue Anonymously, Enroll, Create New Client, removing a need or interaction, adding a need from screening, signing consent | 2.4.3 Focus order | 🟡 Major | Focus moves to the new block's heading or stays on the same button |
| 8 | Closing a helper or a composer lost focus | 2.4.3 Focus order | 🟡 Major | Focus returns to the button that opened it |
| 9 | Urgent Routing opened on the notes box | 2.4.3 Focus order | 🟢 Minor | Opens on the chosen destination |

#### Understandable
| # | Issue | WCAG Criterion | Severity | Fix |
|---|-------|---------------|----------|-----|
| 10 | New client errors were one message with no field marked | 3.3.1 Error identification | 🟡 Major | Each missing field is marked invalid, described by the message, and the first gets focus |
| 11 | Re-typing on Identify what was typed on Intake | 3.3.7 Redundant entry | 🟢 Minor | A match picked on Intake carries to Identify; a failed search fills the new-client form |

#### Robust
| # | Issue | WCAG Criterion | Severity | Fix |
|---|-------|---------------|----------|-----|
| 12 | "Saving…" announced on every keystroke | 4.1.3 Status messages | 🟡 Major | Only a failed save is announced; the indicator is visual |
| 13 | Collapsed history entries pointed `aria-controls` at panels that weren't there | 4.1.2 Name, role, value | 🟢 Minor | Set only while open |
| 14 | Running call timer would interrupt screen readers | 4.1.3 Status messages | 🟢 Minor | Hidden from them; the start time is read instead |

### Color contrast check
| Element | Foreground | Background | Ratio | Required | Pass? |
|---------|-----------|------------|-------|----------|-------|
| Body text | `#121221` | `#FFFFFF` | 18.5:1 | 4.5:1 | ✅ |
| Answer button | `#3D3D4B` | `#FFFFFF` | 10.7:1 | 4.5:1 | ✅ |
| Answer button, chosen | `#FFFFFF` | `#262673` | 13.1:1 | 4.5:1 | ✅ |
| Concern answer, chosen | `#5C3D0B` | `#FBEBD3` | 8.4:1 | 4.5:1 | ✅ |
| Answer button edge | `#3D3D4B` | `#FFFFFF` | 10.7:1 | 3:1 | ✅ |
| Safety text | `#5C1F18` | `#FFF6F5` | 11.9:1 | 4.5:1 | ✅ |
| Urgent Routing | `#8A2A20` | `#DBDBF0` | 6.3:1 | 4.5:1 | ✅ |
| Ready for state reporting | `#0B6B58` | `#FFFFFF` | 6.4:1 | 4.5:1 | ✅ |
| Missing fields | `#7A4F0F` | `#FFFFFF` | 7.1:1 | 4.5:1 | ✅ |
| Urgency tag, Urgent | `#5C3D0B` | `#FBEBD3` | 8.4:1 | 4.5:1 | ✅ |
| Input edge | `#6C7084` | `#FFFFFF` | 4.9:1 | 3:1 | ✅ |

Every text element in every audited state passes; the scan checks them all, not only these.

### Keyboard navigation
| Element | Tab order | Enter/Space | Escape | Arrow keys |
|---------|-----------|-------------|--------|------------|
| Steps | Top to bottom, after the header | Opens the step; focus stays on the tab | — | — |
| Answer buttons | In reading order | Chooses; again clears (except where one answer is required) | — | — |
| Helpers (Returning Caller, They Gave Their Name) | After the step title | Opens inline; focus moves into it | — | — |
| Interaction quick-add | After the cards | Adds a card; focus goes to its Minutes | — | — |
| Dialogs | Trapped inside | Activates | Closes; focus returns to the opener | Native in selects |
| Close Contact | Last | Validates; focus goes to the first need without an outcome | — | — |

### Screen reader
| Element | Announced as | Issue |
|---------|-------------|-------|
| Steps | "Contact steps" navigation; "Identify, current step"; "(done)" after finished steps | None |
| Answer buttons | Button, pressed or not pressed, in a group named by its question | None |
| Interaction fields | Each labeled, with "Required"; the resource field adds "for interaction N" | None |
| Units | Output named "Units, 15 minutes each" | None |
| Save state | Silent while saving; "Your last change was not saved" as an alert on failure | None |
| Toasts | Polite status, with Undo | None |

### WCAG 2.2 criteria not listed above
2.4.11 Focus not obscured: nothing sticky covers focus (checked by tabbing every control). 2.5.7 Dragging: none used. 2.5.8 Target size: every control is at least 24×24. 3.2.6 Consistent help: Report Issue sits in the same place on every screen. 3.3.8 Accessible authentication: not applicable. 2.2.1 Timing: the call timer is information only; nothing expires.

## Design review

Checked against the ACDHS design system and CoLab (ClientView), Nielsen Norman Group's ten heuristics, and contact-center tool practice. Every recommendation below is in v4.0.

### ACDHS design system and CoLab
- **Same frame as ClientView:** top bar, left rail, white card with tabs, notes and action items panel. No separate blue call bar: the live call sits in the top bar where ClientView shows the client.
- **Type:** Roboto. View titles at 22px regular (H1 style), section labels 15px bold (label style), body 14px, metadata 12–13px, as on the client profile.
- **Tokens only:** surfaces Smoke and Ash, content Black, Slate and Stone, actions Blue and Dark Blue, signals through the contrast-safe variants already in `styles.css`. Amber marks a concern; red is reserved for safety, crisis and errors.
- **Components reused:** tabs, segmented controls, choice buttons, `Field`, notices, info cards, tables, timelines, dialogs, toasts, the notes panel. Button labels in Title Case, as CoLab's are.
- **Color signal discipline:** chosen answers carry a check icon as well as a fill; links and buttons look interactive; static values never use action blue.

### Nielsen Norman Group heuristics
| Heuristic | What ASC does | Changed in review |
|---|---|---|
| 1. Visibility of system status | Running timer, save state, steps tick off when done, gaps listed at the foot of Intake and Interactions, "Ready for state reporting" per interaction | Save state stays visible without being announced |
| 2. Match with the real world | Coordinator language ("Who's calling", "You might say", "Every need ends somewhere"); units and dates explained where they appear | — |
| 3. User control and freedom | Steps in any order while the contact is open; Not the right person; Back to Search | Undo on removing a need, interaction, note or action item |
| 4. Consistency and standards | CoLab components and casing throughout | Title Case on the contact type and search type controls |
| 5. Error prevention | Required fields marked; Close Contact checks outcomes; follow-ups only after permission; urgent routing needs an explicit button | — |
| 6. Recognition rather than recall | Match card pinned on Intake; on-file answers as confirmations; Previous Interactions one click away | The needs from Intake now show at the top of Interactions |
| 7. Flexibility and efficiency | Quick-add resources, new cards focus Minutes, quick lookup without leaving Intake | Minutes focus immediately, so fast typists don't lose keystrokes |
| 8. Aesthetic and minimalist design | One question per row, sections separated by hairlines, detail in expandable history | — |
| 9. Help users recover from errors | Specific messages next to the problem, focus moved to it, Fix Now links on the reporting check | Per-field errors on the new client form |
| 10. Help and documentation | Hints under each section, the talking point on Identify | — |

### Contact-center practice
- **One workspace:** intake, MCI search, documentation, notes, action items and history in one place, so no switching between apps.
- **Don't make people repeat themselves:** returning callers by reference number; on-file answers become one-tap confirmations; earlier contacts link on enrollment.
- **Conversation order, not database order:** safety first, then who and why, screening, needs; identifying details only once they choose to share.
- **Follow-up with permission and preferred contact** (Inform USA standards 4.1 and 4.6).
- **Design for interruptions:** everything saves as it's typed and survives a reload; urgent routing is one click from anywhere.

## QA pass 2 (v4.0.1, 11/15/2026)
Live walk-through of the production site in Chrome at 1066×807, then failure and edge cases in the test browser at 1440, 1066 and 390 wide, then a code review of the ASC module.

| # | Found | Severity | WCAG / heuristic | Fixed |
|---|---|---|---|---|
| D1 | Returning Caller and They Gave Their Name opened without moving focus into them | Major | 2.4.3 Focus order | First field takes focus; Cancel returns it |
| D2 | Add to This Contact refocused the button behind the history dialog | Major | 2.4.3 | Closes quietly before the dialog opens |
| D3 | Choosing a match left focus on a removed button | Major | 2.4.3 | Focus moves to the match card |
| D4 | Focusing some controls scrolled the whole app shell (all of CoLab) | Critical | 2.4.11 Focus not obscured | Scroll areas contain their screen-reader text |
| D5 | Closed contacts stayed editable | Major | Heuristic 5, error prevention | Read-only view and a server rule |
| D6 | Minutes could exceed the contact's length with no warning | Minor | Heuristic 5 | Soft warning on Interactions and Wrap Up |
| D7 | A failed save threw away what was typed | Critical | 3.3.4 / heuristic 9 | Kept on screen with Try Again |
| D8 | ASC Contacts scrolled sideways on a laptop | Minor | 1.4.10 Reflow | Six columns |
| D9 | The ASC tab was cut off on a laptop | Minor | Heuristic 6 | Tighter tab spacing under 1280px |
| R1 | The server accepted any shape or length for needs and interactions | Major | Code review | Fields picked, trimmed and capped |

### Still open (decisions, not defects)
- How a closed contact gets corrected (supervisor reopen, or an addendum).
- County holidays in the 7-day follow-up, the state's unit rounding rule, and real service and place-of-service codes.
- Screen-reader sessions with coordinators who use NVDA or JAWS.
- Where ASC lives long-term. The CoLab menu is a way in for now.
