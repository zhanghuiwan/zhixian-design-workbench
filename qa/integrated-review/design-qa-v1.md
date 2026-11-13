# Integrated review QA · 2026-11-13

final result: passed

## Visual truth and intended scope

User-selected references: original main frames 3:4 / 3:35 / 3:120 and dark counterparts, plus B's rounded menu treatment in explorations/references/sky.jpg. Only the menu shape is adopted; B's blue palette and typography are excluded. Original home, navigation, new/review glass task cards, typography, colors and illustrations are retained. Start-learning CTA is removed only in the new review learning frames.

Full-view comparison: qa/integrated-review/original-review-comparison.jpg. Each row pairs original (left) and new review (right): home, study, profile. Both images were opened and inspected in this combined input. Original and implementation use 360 × 800 CSS canvases captured at the same 80% workbench scale, cropped to 288 × 640 pixels; no device or browser chrome. Home matches; study/profile differences are the requested changes.

Browser implementation overview: qa/integrated-review/overview.jpg, 1365 × 936 cloud Chrome, zoom 65%. Dark study/profile: qa/integrated-review/dark-pages.jpg, same 80% frame scale. Scroll-tail evidence: qa/integrated-review/profile-scrolled.jpg. Previous exploration QA retained at qa/explorations/design-qa.md.

## Required fidelity surfaces

- Fonts: original local Noto Sans SC family, sizes, weights, line-height and content. New single/double menus use 52/60 logical pixel heights with existing 14/12 text styles.
- Layout: original 360 × 800 canvas. CTA removal closes vacant space. Four learning menus fit above original task cards. Profile controls use 20-radius menus and true vertical scrolling; 12-pixel gap separates scroll content from fixed navigation.
- Colors: no variable additions or modifications. New menu surfaces bind to existing surfaceMuted / 深色/surfaceMuted; original background, green, ink, muted, navigation alpha/highlights and shadows remain. No blue-theme tokens introduced.
- Assets: original transparent companion and same-source SVGs, with real original navigation/task component references. No screenshot UI, generated substitutes or handcrafted icons.
- Copy: original sample content and dates deliberately retained. User text “新学和我的” interpreted in context as “新学和复习”, announced before implementation. Both task cards and original 我的 navigation retained. No start-learning label remains in the new learning frames.
- Focused verification: at 288 pixels per frame the paired controls remain legible. DOM property checks additionally confirm exact menu radius and master propagation; source comparison confirms exact original tokens and trees.

## Browser and data validation

- Left navigation #review includes three light/dark main pages and three light/dark new reusable components. Original 页面 / 组件 counts remain 35 / 12.
- Inspector editing: menu master radius 20 → 24, apply, verified learning instance 24; undo, verified 20. No browser test edit written to repository data.
- Long profile scroll reaches learning preferences, model, email and logout. scrollTop 385, scrollHeight 1111, clientHeight 726; fixed navigation remains separate.
- Original task-card 2:56 and navigation 2:80 instances retained. New menu instances refer to real new masters. Unique IDs, resource existence, variable and original/new master propagation passed.
- Original three page trees (2010 nodes including roots), all 27 variables and original saved overrides deep-compare equal to previous commit. Immutable source SHA-256 check passed.
- Application console checked: no errors observed.

## Comparison history

1. First full-view comparison confirmed palette/identity preservation and requested menu treatment. No actionable P0/P1/P2 visual issue.
2. Dark and scrolling checks confirmed all settings can be exposed above fixed navigation. No actionable P0/P1/P2 remains.
3. Non-visual metadata corrections preserve original source IDs and point original-design links to valid frames. Browser export includes the new navigation icon. Accepted visual layout remains unchanged.

## Checks and limits

Passed node scripts/check.cjs, app/renderer syntax, isolated save-service tests, bundle generation and static packaging. Regression checks cover new master propagation and opt-in review scrolling while preserving original clipping.

Editable design workbench only; no actual App or Figma edits. Native keyboard, safe areas, dynamic text and live business behavior remain future App acceptance work. Full accessibility compliance is not claimed.

## Checklist

- [x] Original palette, components and assets retained.
- [x] Scoped rounded menus and CTA removal in review frames.
- [x] Three main pages and dark counterparts integrated in original workbench.
- [x] Reusable components, inspector editing, master propagation and undo.
- [x] Original data equality, unique IDs, assets, scrolling and packaging.
- [x] Paired visual evidence inspected; no outstanding P0/P1/P2 findings.
