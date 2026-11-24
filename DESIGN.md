---
version: alpha
name: Kalodeal
description: A clear, approachable Cyprus classifieds marketplace.
colors:
  primary: "oklch(0.546 0.215 263)"
  primary-foreground: "oklch(0.985 0 0)"
  secondary: "oklch(0.546 0.215 263)"
  secondary-foreground: "oklch(0.985 0 0)"
  accent: "oklch(0.849 0.207 129)"
  accent-foreground: "oklch(0.205 0 0)"
  background: "oklch(0.984 0.003 248)"
  foreground: "oklch(0.145 0 0)"
  card: "oklch(1 0 0)"
  card-foreground: "oklch(0.145 0 0)"
  popover: "oklch(1 0 0)"
  popover-foreground: "oklch(0.145 0 0)"
  muted: "oklch(0.97 0.004 248)"
  muted-foreground: "oklch(0.556 0 0)"
  destructive: "oklch(0.577 0.245 27.325)"
  border: "oklch(0.922 0.004 248)"
  input: "oklch(0.922 0.004 248)"
  ring: "oklch(0.546 0.215 263)"
typography:
  display:
    fontFamily: "Geist, Arial, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 600
    lineHeight: 1.111111
  headline:
    fontFamily: "Geist, Arial, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 600
    lineHeight: 1.2
  title:
    fontFamily: "Geist, Arial, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.555556
  body:
    fontFamily: "Geist, Arial, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.428571
  control:
    fontFamily: "Geist, Arial, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.428571
  input:
    fontFamily: "Geist, Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Geist, Arial, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.333333
rounded:
  sm: "0.375rem"
  md: "0.5rem"
  lg: "0.625rem"
  xl: "0.875rem"
  2xl: "1.125rem"
  3xl: "1.375rem"
  4xl: "1.625rem"
spacing:
  "1": "0.25rem"
  "2": "0.5rem"
  "3": "0.75rem"
  "4": "1rem"
  "5": "1.25rem"
  "6": "1.5rem"
  "8": "2rem"
  "10": "2.5rem"
  "12": "3rem"
  "16": "4rem"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    typography: "{typography.control}"
    rounded: "{rounded.lg}"
    padding: "0 0.625rem"
    height: "2rem"
  button-outline:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    typography: "{typography.control}"
    rounded: "{rounded.lg}"
    padding: "0 0.625rem"
    height: "2rem"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    typography: "{typography.control}"
    rounded: "{rounded.lg}"
    padding: "0 0.625rem"
    height: "2rem"
  input:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    typography: "{typography.input}"
    rounded: "{rounded.lg}"
    padding: "0.25rem 0.625rem"
    height: "2rem"
  badge:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    typography: "{typography.label}"
    rounded: "{rounded.4xl}"
    padding: "0.125rem 0.5rem"
    height: "1.25rem"
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.card-foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.xl}"
    padding: "1rem"
  listing-card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.card-foreground}"
    rounded: "{rounded.2xl}"
  primary-nav:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
---

# Design System: Kalodeal

## Overview

Kalodeal should feel like a trustworthy, approachable place to find and advertise things in Cyprus. Keep browsing easy to scan, make the next action predictable, and give listing photos room to carry the personality of the marketplace. Use the existing blue and lime wordmark, cool neutral canvas and clear type hierarchy.

Give each page a clear purpose. Discovery prioritizes category, location, price and a useful result set. Listing detail makes the item and seller easy to understand. Account pages keep status and next actions visible. Pricing makes allowances and eligibility easy to compare.

**Creative North Star**

Clear local discovery and contact.

**Key Characteristics**

- Cool canvas and white surfaces
- Blue actions and purposeful lime accents
- Restrained elevation and clear mobile hierarchy

Product use cases and scope are in [PRODUCT.md](PRODUCT.md).

## Colors

| Role | Use |
| --- | --- |
| Primary | Blue for prominent actions, links, prices and focus. Pair a filled action with `primary-foreground`. |
| Secondary | The existing semantic alias uses the same blue as primary. Use outline or ghost variants for quieter actions when hierarchy requires it. |
| Accent | Lime for sparing emphasis and paired states with `accent-foreground`. The `tertiary` variables currently match this pair. |
| Background and surfaces | Cool page background, white card and popover surfaces, muted surfaces for secondary regions. Pair each surface with its corresponding foreground. |
| Border, input and ring | Neutral boundaries for structure and blue for visible interaction focus. Ensure critical control boundaries are distinguishable. |
| Destructive and statuses | Use the destructive role for harmful actions and errors. Use existing status labels, icons and local semantic treatments for success, warning or review state. |

The frontmatter records the light interface values. `globals.css` also defines dark, chart and sidebar values. The wordmark embeds its own blue `#0B55F7`, ink `#17243C` and lime `#A9F023`. Preserve the asset itself. [Theme source](src/app/globals.css) · [Wordmark](public/logo.svg)

Target WCAG AA contrast on actual foreground and background combinations, including hover, focus, invalid and selected states. Use at least 4.5:1 for regular text and 3:1 for large text and applicable UI boundaries or state indicators. Pair color cues with labels or affordances. Validate every use of muted text, accent and translucent overlays. Existing issues are listed below.

## Typography

Geist is the shared sans and heading family, loaded through Next.js font loading in the shared document. The code currently aliases mono to the same family. Font family values in the frontmatter are descriptive, and actual glyph coverage follows the generated stack. Check Greek and English at the same widths. [Site document](src/shared/ui/site-document.tsx)

- Use 30–36 px semibold for prominent route headings such as selling and pricing. Use roughly 20–30 px for compact route headings and 16–18 px for card titles and emphasized values.
- Use 14 px for compact body and controls, 16 px where flow or mobile input needs it, and 12 px for secondary metadata. The shared input uses 16 px below `md` and 14 px from `md`.
- Let price, currency, rent period and price-on-request states stay legible. Most listing cards show an 18 px semibold price. Listing detail gives the price about 30 px.
- Keep headings in logical order and labels descriptive. Preserve visible labels and review line wrapping, truncation and mixed-language text with realistic content.

## Layout

Use the Tailwind 4 spacing unit of 4 px. The shared centered `container` uses 16 px inline gutters. Favor 8–16 px inside compact controls or rows, 16–24 px for panels, and larger 32–64 px gaps between page sections where appropriate. Container variants and route max widths control long lines. [Theme source](src/app/globals.css)

| Breakpoint | Width | Existing use |
| --- | ---: | --- |
| `sm` | 640 px | Home results become two columns, some account panels split |
| `md` | 768 px | Header account shortcuts, category grid and pricing layout gains columns |
| `lg` | 1024 px | Sticky results filter rail and detail or editor asides, four pricing columns |
| `xl` | 1280 px | Desktop primary nav, three home result columns and split messaging |
| `2xl` | 1536 px | Four home result columns and wider header spacing |

Start with the narrow layout and keep document order aligned with reading and keyboard order. Check sticky controls, long labels, overflowing prices and safe-area edges. Use the combined header and actionable areas to retain listing and filter context when space is limited.

## Elevation & Depth

Use tonal layers and borders on the canvas, cards and compact controls. Shared cards use a subtle foreground ring at 10% opacity. Listing cards use `shadow-xs`, and anchored popups use rings with light shadow. Reserve stronger `shadow-lg` for transient layers such as sheets and toasts. Use backdrop dimming for modal context and keep overlapping layers legible. [Card](src/components/ui/card.tsx) · [Sheet](src/components/ui/sheet.tsx) · [Toast](src/components/ui/toast.tsx)

## Shapes

The base radius is 10 px. Use `rounded-lg` for controls, `rounded-xl` for shared cards and `rounded-2xl` for listing cards. Keep pills and circles for status tags, avatars or icon controls where the shape communicates their role. Use semantic border and ring classes. Clip images to their containing surface and retain an obvious focus treatment.

Use Lucide icons at the existing control scale, usually 16–24 px. Give icon-only controls an accessible name. For listing media, use actual seller photos with sensible fallbacks for missing or failed images. Cards crop to a 4:3 frame. Detail galleries use a 4:3 contained presentation so the entire photo remains visible. Preserve responsive image sizing, loading behavior, useful alt text and gallery controls. [Listing card](src/entities/listing/ui/listing-card.tsx) · [Listing gallery](src/entities/listing/ui/listing-gallery.tsx)

## Components

### Controls and feedback

| Component | Pattern |
| --- | --- |
| Buttons | Reuse Button variants. Default uses solid blue, outline and ghost support secondary actions, and destructive styling signals risk. Preserve disabled, pending, focus and pressed states. Add a sufficient interactive area for touch at the point of use. |
| Inputs and forms | Compose Input, Field, Label, Textarea and existing select or combobox primitives. Keep labels, requirements and error descriptions close to the field. Preserve dirty input across recoverable failures. |
| Search and filters | Keep keyword, category, district and dependent area clear. Preserve URL state, removable active filters, results feedback, sorting and a clear reset. Keep the mobile sheet's Apply action reachable. |
| Listing and category cards | Keep image, category, title, price and location in predictable positions. Place the favorite action separately from the listing link. Make category cards simple, navigable choices with recognizable icons and labels. |
| Header and footer | Reuse the shared logo, route links, locale switcher and account/sell actions. Desktop primary navigation appears at `xl`. The mobile menu uses a right sheet below `xl`. Keep footer groups usable without repeating account actions. |
| Selects, comboboxes and dropdowns | Use Base UI primitives and inherit origin, keyboard handling, width and max-height behavior. Show current selection and provide a clear way to close or reset the control. |
| Dialogs, drawers and tooltips | Use AlertDialog for consequential confirmations and Sheet for navigation or filter panels. Keep titles, dismissal, modal focus and focus return. Use tooltips for supplemental guidance and preserve accessible names and touch access. |
| Badges and chips | Use concise text for states, entitlement or active filters. Use an actionable control for removable chips. Preserve state meaning across contrast and color settings. |
| Notifications and toasts | Reuse the shared Toaster for brief feedback. Keep blocking errors and lasting success states in context with the next action. Verify status announcements. |
| Pricing cards | Keep comparison rows in a consistent order, show the price and billing period together, and align calls to action. Describe current, pending and unavailable states in text. |
| Skeletons and loading | Match the final layout geometry and use the existing loading labels or status region. Avoid freezing unrelated controls. Use motion-safe indicators and preserve static cues. |
| Empty, error and success states | Explain the state and useful next action. Use contextual reset for no results, a listing or conversation path for empty account views, retry for recoverable failures, and confirmation for successful submission. Avoid exposing private or internal error details. |

Reuse [UI primitives](src/components/ui), shared [loading status](src/shared/ui/loading-status.tsx), [search UI](src/features/listing-search/ui), and [route error](src/app/error.tsx).

### Marketplace surfaces

| Implemented surface | Pattern to preserve |
| --- | --- |
| Homepage and category index | Homepage order is category grid, search controls, then filters and results. The homepage category grid uses 2, 3, 4 and 6 columns as space grows. The category index presents the hierarchy. A feed component exists in source outside the live homepage composition. |
| Search results | Home grids use 1, 2, 3 and 4 columns. A sticky 17 rem left filter rail starts at `lg`, with a right sheet below it. Keep sorting, active filters, count and reset near the results. |
| Listing detail | Group price, status and seller contacts clearly. The 4:3 gallery shares the layout with a sticky 360 px aside from `lg`. Keep legal, visibility and report paths accurate to the actual flow. |
| Property and vehicles | Shared listing, form and search patterns adapt to typed category attributes. Use suitable units, rental periods, make/model dependencies and field groupings. Separate property and vehicle detail templates are outside current implementation. |
| New listing and owner edits | Use grouped sections for details, category fields, location, price and photos. Keep allowance, review implications and publish or save action visible. The sidebar appears at `lg`. |
| Personal and business profiles | Keep private settings distinct from the public seller page. Public pages use privacy-safe identity labels and show eligible active listings. Business profiles can add approved branding and company details. |
| Favorites and messaging | Keep favorites easy to scan with listing status and availability. Conversation list and detail use a split view from `xl`. Preserve listing context, unread and sending indicators, and participant report access. |
| Subscription | Public plans use 1, 2 and 4 columns. Account subscription shows current benefits, usage and the appropriate billing action. Reflect eligibility from the server. |
| Mobile navigation | Keep the logo, account and locale affordances readable. The menu sheet groups primary and account links. Ensure closing it returns focus to the trigger. |

Public reviews, standalone vertical templates and a public video player are absent from the current surfaces. See [PRODUCT.md](PRODUCT.md) for current scope and open decisions.

### Motion and interaction

The current components use short utility transitions. Alert dialogs and dropdowns use about 100 ms for fade and scale. Sheet backdrop and panel use 150 ms and 200 ms respectively. Listing photo transitions use a 150 ms fade. Shared skeletons disable pulse under reduced-motion preference. [Alert dialog](src/components/ui/alert-dialog.tsx) · [Sheet](src/components/ui/sheet.tsx) · [Skeleton](src/components/ui/skeleton.tsx)

For new or revised interactions, use the following guidance from [Emil Kowalski's skills](.agents/skills/emil-design-eng/SKILL.md). These recommendations extend the documented baseline and define no application-wide CSS tokens.

- Animate feedback, continuity or a real state change. Keep rapid navigation, keyboard focus, typing, sorting and repeated toggles immediate. Skip decorative page entrances and motion on each result.
- Use roughly 100–150 ms for subtle feedback and 150–250 ms for deliberate overlays. Prefer a short exit that clears the next interaction. Use `cubic-bezier(0.23, 1, 0.32, 1)` as a reference for responsive enter and exit easing, `cubic-bezier(0.77, 0, 0.175, 1)` for intentional on-screen movement, and `cubic-bezier(0.32, 0.72, 0, 1)` for suited drawer motion.
- Let menus and popovers originate from their trigger and keep centered dialogs anchored at the center. Use small transforms with opacity. Sheets move from their edge, and coordinated elements should change together or follow a clear order.
- On hover-capable devices, use restrained color or border feedback. Provide an immediate press state for touch and a visible keyboard focus indicator. Tooltips, favorites and pending actions should respond promptly. Motion should be interruptible on repeated input.
- Respect `prefers-reduced-motion`. Remove displacement, scaling and looping decoration when reduced motion is requested. Preserve feedback with text, borders, color or a brief opacity change where appropriate.
- Prefer transform and opacity and name the properties being animated. Avoid layout-triggering properties and costly filters on busy lists. Preserve native scrolling on touch surfaces and verify gesture behavior on real hardware when possible.

## Do's and Don'ts

- Use semantic tokens, shared components and meaningful titles. Let imagery and real content set the visual density.
- Use enough space for interaction targets and visible focus. Keep key price, location and eligibility information readable with zoom and long localized copy.
- Keep optional gradients, translucency, shadows, pills, decoration and motion tied to a clear purpose. Avoid repeated nested cards, decorative badges and generic dashboards in browsing flows.

### Existing inconsistencies to review

- The prerendered Greek category shell mixes serif Greek and sans-serif Latin. The current Geist package output lacks a Greek face. Geist also backs the mono alias.
- Approximate light-mode contrast is 4.95:1 for primary foreground on the primary fill and 11.87:1 for the paired accent. Muted text on muted is about 4.34:1, bare lime on the page is about 1.44:1, and the dark primary pair is about 3.20:1. Review combinations and focus or input boundaries before adopting them. Dark tokens exist without an exposed theme switcher.
- Some overlay, toast and spinner styles lack reduced-motion guards. Some component transitions use `transition-all`. Shared skeleton and image-preview behavior provide existing reduced-motion examples.
- Listing detail places its seller and price aside before the gallery in the DOM while moving the gallery earlier visually. Review focus and reading order on both layouts.
- The under-development route uses gradients and translucent surfaces. The footer has a literal gray border, and some error views use raw text colors. The runtime copy also varies between Kalodeal and KaloDeal. Treat these as local differences.
- The visual review used desktop and mobile Chromium captures of prerendered public shells. Live results, protected areas and backend-dependent transitions were reviewed in source.
