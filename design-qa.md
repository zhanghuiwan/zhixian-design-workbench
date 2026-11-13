# Grouped settings correction · 2026-11-13

final result: passed

Source visual intent: user clarified that related settings share a single rounded container, as in grouped settings lists. Original palette/typography/assets/task cards/navigation remain the visual baseline. The previous single-item-card interpretation is superseded.

Comparison evidence: qa/grouped-review/comparison.jpg pairs previous individual cards with corrected shared category containers for study and profile. Both before and after were opened together. Each 360×800 logical frame was captured in cloud Chrome at 80% and cropped to the same 288×640 pixels, then placed side by side. No density mismatch or phone/browser chrome in the comparison.

Findings and history:
- [P1, fixed] Previous version rounded each individual row. Fix: learning has vocabulary and reading groups; profile has appearance, assistant and account groups. Titles sit outside. Shared surfaceMuted background and 20-radius group frame, flat transparent rows, inset separators.
- Post-fix full-view comparison confirms connected silhouettes and no gaps/cards between related rows. Original identity remains. Dark versions and profile scroll tail visually inspected; account/email/logout are available above fixed navigation. No outstanding P0/P1/P2.

Required surfaces:
- Typography: original Noto Sans SC, weights, sizes and labels retained.
- Layout: shared round group bounds, zero-radius rows, inset separators. Learning fits above unchanged floating tasks. Long profile scroll retained.
- Colors: all original 27 variables unchanged; existing light/dark surfaceMuted and line tokens reused.
- Assets: original character, SVGs, task and navigation component references retained. No raster UI or substitute icons.
- Copy: only group labels/component descriptions updated. No start-learning CTA returned; original sample dates retained intentionally.

Focused inspection: group joins, separator alignment and individual rows were legible at paired 288-pixel views, and structural checks additionally verify flat rows and two learning groups. Browser showed no application console errors.

Validation: node scripts/check.cjs covers unique IDs, original inventory, variable/assets, actual group master propagation, zero-radius transparent rows and review scrolling. JS syntax, save tests and static packaging pass. Original three page trees and variables deep-equal previous commit. Six review screens and eight reusable components now appear in the original workbench.

Limits: design editor, not actual native App. Native keyboard, system safe area, dynamic type and live app behavior are future acceptance work. App/Figma unchanged. Previous QA retained at qa/integrated-review/design-qa-v1.md.
