# Design QA — Venta rápida

- Source visual truth: user-provided POS reference image in the current conversation (1450 × 1086 px).
- Implementation screenshots: `output/playwright/pos-redesign-final.png` and `output/playwright/pos-redesign-filled.png` (1450 × 1080 px, CSS viewport 1450 × 1080, device scale factor 1).
- Responsive evidence: `output/playwright/pos-redesign-mobile-closed.png` (390 × 844 px, device scale factor 1).
- State: authenticated administrator, Venta rápida, empty cart plus one-item interaction state.
- Density normalization: source and desktop implementation were both inspected at approximately 1 CSS pixel per image pixel; the six-pixel height difference is outside the app content comparison.

**Full-view comparison evidence**

- The implementation now matches the source's major frame: 240 px fixed dark sidebar, 96 px top header, horizontal category bar, five-column catalog track, and 280 px persistent current-account panel.
- Dark navy surfaces, blue selected/primary states, amber quick-sale accent, outlined navigation icons, card borders, radii, and spacing hierarchy align with the source direction.
- The generated beer-mug emblem replaces the previous emoji and is rendered as a real raster asset.

**Focused region comparison evidence**

- Header/search: 430 px bordered search control and right-side status/account controls were inspected at full resolution.
- Catalog: card height, image slot, product title, price, and circular add action were inspected at full resolution.
- Current account: empty state and one-item state were both captured; add, quantity controls, remove, totals, and payment enablement render correctly.

**Findings**

- [P1] Catalog content and product photography do not yet match the reference.
  - Location: product grid and category row.
  - Evidence: the reference contains a full operational menu with photographed products; the local database currently returns three test products (`Cerveza Corona` and two `E2E` records), all without `imageUrl`.
  - Impact: the layout now matches, but the screen still looks sparse and product cards show the existing no-image state.
  - Fix: load the real categories/products and their image URLs through the existing catalog administration flow. Do not hard-code reference products into the frontend.

- [P2] The source includes a branch selector that the current product model does not expose in this screen.
  - Location: top-right header.
  - Evidence: source shows administrator, branch, and online controls; implementation has administrator and online controls only.
  - Impact: one header control is visually absent.
  - Fix: add it only when branch selection is backed by the real session/settings model; a decorative fake selector would be misleading.

**Required fidelity surfaces**

- Fonts and typography: Arial/Segoe UI system stack, weights, sizes, hierarchy, truncation, and line height are consistent and readable; exact source font metadata is unavailable.
- Spacing and layout rhythm: desktop proportions and grid tracks now align; mobile retains two catalog columns and a drawer sidebar.
- Colors and visual tokens: navy backgrounds, slate borders, blue primary/selected states, amber accent, red destructive state, and contrast align with the source.
- Image quality and asset fidelity: brand emblem is a real high-resolution asset; product photography remains blocked by missing catalog `imageUrl` data.
- Copy/content: operational labels are real app copy; reference-only menu products and branch copy were not fabricated.

**Interaction and browser verification**

- Tested category controls, adding `Cerveza Corona`, quantity/remove controls, total changing from $0.00 to $45.00, payment button enablement, and removal back to the original empty state.
- Tested desktop 1450 × 1080 and mobile 390 × 844 layouts.
- A fresh authenticated browser tab reported 0 console errors and 0 warnings after the API restart.
- Build, lint, and Vitest completed successfully (the project currently has no test files).

**Responsive fit verification — 2026-08-02**

- `output/playwright/responsive-after-1366x768.png`: full desktop sidebar shows all 12 navigation items, promotional block, user, and logout without sidebar scrolling or overlap; the current-account actions remain inside the viewport.
- `output/playwright/responsive-desktop-1280x720.png`: compact-height desktop retains every persistent control inside the 720 px viewport.
- `output/playwright/responsive-desktop-1280x600-filled.png`: minimum tested desktop height retains the complete navigation and a populated cart, totals, payment, and cancellation controls inside the viewport.
- `output/playwright/responsive-final-tablet.png`: 1024 × 768 tablet uses the 72 px accessible icon rail; catalog and current account remain side by side with no page overflow.
- `output/playwright/responsive-tablet-768x1024.png`: portrait tablet retains the same three operational areas inside the viewport.
- Product columns now derive from available container width with `auto-fit/minmax`; height compaction is applied at 900 px and 700 px without JavaScript viewport listeners.
- A fresh authenticated browser tab at 1024 × 768 reported 0 console errors and 0 warnings.

**Comparison history**

1. Initial capture `output/playwright/current-pos.png`: P1 frame mismatch (short header, compact brand, duplicate search, three-column cards, 360 px flat cart).
2. First revision `output/playwright/pos-redesign-pass1.png`: fixed the frame, branding, search duplication, five-column grid, card proportions, and cart width/treatment.
3. Interaction capture `output/playwright/pos-redesign-filled.png`: verified the populated cart state and action hierarchy; test item was removed afterward.
4. Final capture `output/playwright/pos-redesign-final.png`: structural P0/P1/P2 code issues resolved; remaining P1/P2 findings require real catalog/branch data rather than additional presentation code.
5. Responsive captures listed above: resolved sidebar overlap, hidden persistent controls, rigid product columns, and short-screen cart clipping across desktop and tablet viewports.

**Implementation checklist**

- Populate the real menu catalog and image URLs.
- Decide whether this deployment actually supports branch switching; wire the header only if it does.

**Follow-up polish**

- Re-run same-state visual comparison after real product photography is loaded.

final result: blocked
