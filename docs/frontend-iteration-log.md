# Leafy AI v0.2 front-end iteration log

This log records three design-only passes made in the isolated
`leafy_ai_sample_v0.2-frontend-3pass` copy. The original v0.2 project remains
unchanged. API routes, domain models, persistence, authentication, safety
policy and simulator behaviour are outside the scope of these passes.

## Baseline reflection — v0.2.3

The existing command centre had a clear product concept and a distinctive
light laboratory direction, but the source still carried the complete dark
theme beneath several generations of light-theme overrides. This made the
rendered system hard to reason about and allowed type, colour and spacing to
drift between views.

The initial browser review found:

- many labels and supporting values rendered at 6–9px;
- low-priority copy and borders with insufficient separation from the page;
- inconsistent card, control and status treatments across the six views;
- a usable but very long mobile command-centre page;
- a large empty lane in AI Decisions when a status bucket had no actions;
- several mobile controls below the preferred 44px touch target.

The baseline passed TypeScript, ESLint and all eight unit tests.

### Visual evidence

- [Baseline desktop, v0.2.3](frontend-iteration-screenshots/baseline-desktop-v0.2.3.jpg)
- [Baseline mobile, v0.2.3](frontend-iteration-screenshots/baseline-mobile-v0.2.3.jpg)

## Pass 1 — v0.2.4: readability and visual system

### Reflection

The first pass treats readability and source clarity as prerequisites for later
layout work. It intentionally preserves the existing content, information
architecture, brand palette and media.

### Changes

- Replaced the dark-theme-plus-overrides stylesheet with one consolidated
  light-laboratory design system.
- Centralised colour, surface, border, shadow, radius and typography tokens.
- Raised body and supporting text sizes: body copy is 11–14px and critical
  labels are at least 10px.
- Standardised cards, status badges, buttons, inputs, charts and modal surfaces.
- Preserved the existing motion assets and static poster fallbacks.

### Validation

TypeScript, ESLint and all eight unit tests passed. Browser checks covered all
six views at 1280×720 plus the command centre at 390×844. No view had horizontal
overflow and only the small notification counter remained below 10px.

The consolidated system substantially improved scanability. The follow-up
review identified four issues for the next pass: icon-only tablet navigation
lost its accessible label, the mobile command-centre remained long, an empty
decision lane had no explanatory state, and some secondary mobile controls were
still under 44px.

### Visual evidence

- [Pass 1 desktop, v0.2.4](frontend-iteration-screenshots/pass1-desktop-v0.2.4.jpg)
- [Pass 1 mobile, v0.2.4](frontend-iteration-screenshots/pass1-mobile-v0.2.4.jpg)

### Carry-forward

Responsive density, empty decision buckets, mobile touch targets and interaction
states remain the focus of passes 2 and 3.

## Pass 2 — v0.2.5: layout and responsive behaviour

### Reflection

The first pass made the visual language coherent, so the second pass can focus
on how that system behaves when information is missing or space becomes narrow.

### Changes

- Added an explicit, compact empty state for decision-status lanes with no
  actions.
- Added durable accessible names to desktop, tablet and mobile navigation,
  including the icon-only tablet rail.
- Kept two sensor columns at 390px and moved the single-column fallback to
  360px, reducing page length without hiding information.
- Reduced mobile hero ornament height while preserving the farm score, safety
  statement and three operational metrics.
- Raised mobile secondary controls, filter chips and close controls to a 44px
  minimum touch target.
- Kept the mobile More menu above the bottom navigation and safe-area inset.

### Validation

TypeScript, ESLint and all eight unit tests passed. Browser checks covered the
820px command centre and navigation, plus the 390×844 command centre, AI
Decisions, Safety & Alerts and expanded More menu.

- No tested view had horizontal overflow.
- The 390px command-centre height fell from about 3361px to 2997px.
- The 390px sensor grid remained readable at two columns.
- No visible mobile button was smaller than 44px.
- The More menu stayed fully inside the viewport and closed after navigation.
- The 820px icon rail exposed all six navigation names and the current page.

### Visual evidence

- [Pass 2 mobile, v0.2.5](frontend-iteration-screenshots/pass2-mobile-v0.2.5.jpg)

### Carry-forward

The final pass will verify dialog semantics, keyboard focus, active-state
announcements, contrast, motion restraint and cross-view consistency.

## Pass 3 — v0.2.6: consistency and accessibility polish

### Reflection

After the responsive pass, the remaining work is less about layout and more
about making the interface communicate reliably through keyboard, assistive
technology and non-colour cues.

### Changes

- Added labelled dialog semantics to the plan editor, override confirmation and
  decision drawer.
- Added Escape-close behaviour to the mobile More menu, decision drawer, plan
  editor and override confirmation without submitting any action.
- Added initial focus inside dialogs and retained strong `:focus-visible`
  treatment across interactive controls.
- Added accessible sensor summaries, live-state labels, automation status and
  `aria-current` navigation state.
- Darkened the quiet-text token for stronger contrast and removed the last
  intentional sub-10px mobile label.
- Standardised primary, compact, close, filter and top-bar controls at a 44px
  minimum target.
- Preserved existing motion assets while retaining reduced-motion poster
  fallbacks.

### Validation

TypeScript, ESLint, all eight unit tests and the local production build passed.
The build retained the existing page and five API routes without changing their
interfaces.

The final browser review covered:

- all six views at 1280×720;
- Command Center, AI Decisions and Safety & Alerts at 820×1180;
- the same three priority views at 390×844;
- the mobile More menu, plan editor, override confirmation and decision drawer.

Every tested view had zero horizontal overflow, zero rendered text below 10px
and zero visible button targets below 44×44px. The More menu and all three
dialog surfaces closed on Escape. Initial focus entered the correct close
button, input or textarea, and no form or simulator action was submitted during
visual QA.

### Visual evidence

- [Final desktop, v0.2.6](frontend-iteration-screenshots/final-desktop-v0.2.6.jpg)
- [Final mobile, v0.2.6](frontend-iteration-screenshots/final-mobile-v0.2.6.jpg)

## Final outcome

The three passes retain the same product functions and safety boundary while
making the interface easier to scan, more compact on mobile, more consistent
across all six views and more dependable for keyboard and assistive-technology
users. The isolated copy remains local: no Sites version was saved and no
production deployment was changed.
