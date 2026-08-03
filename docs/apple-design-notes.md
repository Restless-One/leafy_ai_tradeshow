# Leafy AI Apple Design Study v0.2

This folder is an isolated front-end redesign based on `leafy_ai_sample_v0.2-frontend-3pass`.
The original folders remain unchanged.

## Design intent

The interface should feel calm, direct and predictable. Apple design principles are
translated into the existing farm operations product rather than copied literally:

- **Purpose and simplicity:** preserve every existing workflow while reducing ornamental
  noise and making the current farm state the first visual priority.
- **Materials and depth:** use one translucent navigation layer, solid legible data
  surfaces and heavier modal materials. Avoid stacking glass on glass.
- **Response:** controls acknowledge pointer-down immediately through small scale and
  luminance changes. No artificial delay is introduced.
- **Spatial consistency:** the decision drawer enters and exits from the right; mobile
  navigation menus remain anchored above their source control.
- **Typography:** system fonts, optical sizing, size-specific tracking and relative line
  heights provide a platform-native reading rhythm.
- **Accessibility:** visible focus, non-colour status labels, 44px targets and explicit
  reduced-motion, reduced-transparency and increased-contrast modes are retained.

## Scope boundary

Only front-end presentation files, package identity and documentation are changed.
Routes, API payloads, data structures, database code, authentication, safety policy and
simulator behaviour remain identical to the v0.2.6 source.

## Validation

- TypeScript, ESLint, eight existing unit tests and the production build pass.
- All six pages were checked at 1280px; Command Center, AI Decisions and Safety
  were additionally checked at 820px and 390×844.
- Final desktop, tablet and mobile checks found no horizontal overflow, visible
  text below 10px or active control below 44px.
- The decision drawer, mobile More menu and safety confirmation sheet retain
  keyboard focus, accessible names and Escape dismissal.
- Navigation returns each destination to the top using an interruptible native
  scroll, with an immediate fallback when reduced motion is requested.
- Existing mutation forms were opened and closed for layout inspection without
  submitting changes to local demonstration data.

## Evidence

- [`final-desktop-1280x720.jpg`](apple-design-screenshots/final-desktop-1280x720.jpg)
- [`final-mobile-390x844.jpg`](apple-design-screenshots/final-mobile-390x844.jpg)
