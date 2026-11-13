# Visual exploration QA · 2026-11-13

final result: passed

## Scope and visual truth

- Three independent proposed directions, each extended into home, study and profile. Existing design source is unchanged. This is a direction exploration, not a pixel-identical clone or an App release.
- Source visual truth: `explorations/references/{editorial,sky,dusk}.jpg`, each normalized from the generated image to the intended 390 × 844 logical canvas. The original product was visually inspected before the concepts were generated.
- Browser-rendered implementation: cloud Chrome, local preview, 390 × 844 iframe CSS viewport at scale 1. Review-page screenshots are 1348 × 1345. Each study capture was cropped at the measured iframe bounds to 390 × 844.
- Same state: first-load learning page, 120/800, new 0/10, review 0/9; respective default light/light/dark palettes. No OS chrome is part of the content.
- Full-view comparison evidence: `qa/explorations/editorial-comparison.jpg`, `sky-comparison.jpg`, `dusk-comparison.jpg`; each shows source on the left and implementation on the right in the same comparison image at the same 390 × 844 size.
- Narrow view: 320 × 720 CSS iframe at 80% review scale; screenshots show all three pages per direction. These were reviewed for layout, not mistaken for smaller font definitions.

## Required fidelity surfaces

- Typography: Noto Sans SC body, a real Noto Serif CJK SC Bold subset for A/C display headings, Georgia numerals. B retains sans typography. Appropriate body optical weight and readable line-height. Deliberate implementation adaptations: functional text is 14–16 logical pixels, compared with some oversized generated lettering; no attempt to reproduce raster artifacts. The primary composition and hierarchy are retained.
- Spacing/layout: A maintains a flat divider-based reading order; B maintains rounded wordbook, task blocks and grouped resources; C maintains the large progress value, primary action, compact task band and 2-column resource grid. Persistent navigation has reserved bottom content padding. Long profile pages scroll to the account controls. Source mock detail changes are intentional: consistent source-product icons, wordbook switch in A, streamlined date text and no decorative texture.
- Colors/tokens: independent CSS custom properties in `explorations/screen.css`. White/ink/vermilion, mist blue/cornflower/navy, aubergine/peach. Default palettes match their direction; both alternate appearance states are available for review. State is expressed through both labels and clear selected surfaces/underlines.
- Images/icons: reuse original transparent companion poses, without repainting or distorting identity. Reuse real repository SVG icons through masks rather than approximated vectors, emoji or full-page screenshots. Full views confirm clean character edges and no missing images. Icons intentionally use product assets rather than reproduce invented generated icons.
- Copy/content: current original functionality retained. Data is fictional preview data. Date anchor 2026-11-13, real Friday; trailing 7-day range 11/7–11/13 with correct weekdays. No claims of a live model connection. Preset chat reply is a local demonstration.
- Focused comparison: the 390-pixel source/implementation pairs show the entire screen at readable size; headings, wordbook progress, task and CTA, resource grid/list and navigation are all directly legible. Separate magnified region images were unnecessary.

## Comparison history and fixes

1. Initial 390 × 844 visual comparison: all three study directions had no actionable P0/P1/P2 fidelity issues. The documented typography and icon adaptations preserve product readability and source asset continuity.
2. Narrow review found [P2] companion caption overlapping the recommended-topic label in the dusk home screen. Evidence: `qa/explorations/dusk-narrow.jpg`.
3. Fix: preserve intrinsic height in `.companion-scene` with non-shrinking flex basis and padding; reduce the character and heading size below 360 pixels. The screen remains scrollable on short viewports.
4. Post-fix visual verification: `qa/explorations/dusk-narrow-fixed.jpg`; caption and topic no longer overlap. Also inspected `editorial-narrow.jpg` and `sky-narrow.jpg` for all corresponding pages. No actionable P0/P1/P2 remains.

## Browser interaction validation

- A/B/C direction tabs, 80%/100% scale, 320/390 dimensions and same-page comparison render as expected. Final overview: `qa/explorations/compare.jpg`.
- Recommended topic fills the composer; sending shows the preset response.
- Start learning opens a contained dialog; reveal displays meaning/example; remember updates new-count to 1/10 with feedback.
- Profile companion switch updates `aria-checked`; light/dark controls update appearance and selected state.
- Profile scroll reaches logout. At 320 × 720, the last resource item can be scrolled into view and opens its dialog above persistent navigation.
- Dialogs have names, close controls, Escape support, a local focus cycle and focus restoration. Navigation and active states expose labels.
- Console checked: no application errors observed. Unrelated browser-extension metadata warnings were present and excluded from app-error claims.

## Checks and limits

- Passed `node scripts/check.cjs`, `node --check app.js`, `node --check renderer.js`, checks for both new JS files, `python3 scripts/test_server.py`, and static site packaging.
- Original `index.html`, `app.js`, `renderer.js`, `workbench.css`, `design.json`, `design-data.js`, `source/` and existing assets remain identical to baseline.
- Real native keyboard, platform safe areas, device text scaling, real model/learning persistence and native performance remain future App acceptance work. No claim of full accessibility certification.
- Follow-up P3: after the user selects a direction, tune the final display/body balance on a physical device. This does not block visual review.

## Implementation checklist

- [x] Three materially different learning compositions and nine main-page combinations.
- [x] Editable HTML/CSS/JS, source assets and independent theme tokens.
- [x] Same-page comparison and viewport-size controls.
- [x] Main local demo interactions and long-page scrolling.
- [x] Screenshot-grounded full-view and narrow-view QA.
- [x] Original source retained, changelog and App handoff updated.
