---
name: Precision Living System
colors:
  surface: '#f8f9ff'
  surface-dim: '#ccdbf2'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eef4ff'
  surface-container: '#e5efff'
  surface-container-high: '#dbe9ff'
  surface-container-highest: '#d4e4fa'
  on-surface: '#0d1c2d'
  on-surface-variant: '#464555'
  inverse-surface: '#233143'
  inverse-on-surface: '#e9f1ff'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4d44e3'
  primary: '#3525cd'
  on-primary: '#ffffff'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#c3c0ff'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#00533d'
  on-tertiary: '#ffffff'
  tertiary-container: '#006e51'
  on-tertiary-container: '#74f2c3'
  error: '#EF4444'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#7bf9ca'
  tertiary-fixed-dim: '#5cdcaf'
  on-tertiary-fixed: '#002116'
  on-tertiary-fixed-variant: '#00513b'
  background: '#f8f9ff'
  on-background: '#0d1c2d'
  surface-variant: '#d4e4fa'
  surface-main: '#FFFFFF'
  surface-subtle: '#F8FAFC'
  border-low: '#E2E8F0'
  text-primary: '#0F172A'
  text-secondary: '#475569'
  success: '#45C89C'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '500'
    lineHeight: 12px
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 48px
  max-width: 1280px
---

## Brand & Style
The design system is engineered for utility, efficiency, and clarity, catering to a user base that values data density over decorative flair. It adopts a **Corporate / Modern** aesthetic with a heavy lean toward **Functional Minimalism**. 

The visual narrative is "Developer-Grade": every element exists for a functional purpose. The interface prioritizes information architecture and rapid scanning, utilizing a systematic approach to hierarchy that feels more like a sophisticated IDE or dashboard than a typical real estate consumer app. High-density layouts, clear borders, and a monochromatic foundation ensure that the primary action colors remain meaningful and directive.

## Colors
This design system utilizes a structured palette built on high-contrast neutrals and a singular, high-energy action color. 

- **Primary (Indigo):** Reserved strictly for primary actions, active states, and interactive focus.
- **Secondary (Deep Slate):** Used for primary headings and heavy structural elements to anchor the page.
- **Tertiary (Mint):** Derived from the reference material, this serves as a semantic "Success" or "Available" indicator, crucial for status management.
- **Neutrals:** A range of cool-toned grays are used to define boundaries. `#F8FAFC` is the standard background for grouping elements, while `#E2E8F0` provides a crisp, low-contrast border for high-density tables and cards.

## Typography
Typography is the primary driver of hierarchy. **Inter** is used for all standard UI elements to ensure maximum legibility and a neutral, professional tone. 

A secondary monospaced font, **JetBrains Mono**, is introduced for "Label" roles. This font should be used for metadata, status badges, price units, and ID strings (e.g., Room IDs, Transaction Hashes). This distinction reinforces the "developer-grade" aesthetic and helps users quickly differentiate between descriptive text and raw data points. 

Font weights are used sparingly but decisively: Bold (700) for page titles, Semibold (600) for component titles, and Regular (400) for all body and instructional text.

## Layout & Spacing
The layout follows a strict **Fixed Grid** model on desktop and a **Fluid Grid** on mobile. The system is built on a 4px baseline grid.

- **Desktop:** 12-column layout with a 16px gutter. Content is centered with a max-width of 1280px.
- **Tablets:** 8-column layout with 16px gutters and 24px side margins.
- **Mobile:** 4-column layout with 8px gutters and 16px side margins.

Spacing between related items (label and input) should use `sm` (8px). Spacing between sections should use `xl` (32px). Data tables should utilize "tight" vertical padding (8px) to maximize the number of rows visible on a single screen.

## Elevation & Depth
In line with a functional, systematic approach, this design system avoids heavy shadows and traditional skeuomorphism. Instead, it utilizes **Tonal Layers** and **Low-contrast Outlines**.

- **Level 0 (Background):** `#F8FAFC` for the main application background.
- **Level 1 (Surfaces):** `#FFFFFF` for cards, tables, and input areas, defined by a 1px border of `#E2E8F0`.
- **Level 2 (Interaction):** When a card or element is hovered, the border color shifts to `#94A3B8`.
- **Level 3 (Focus):** When an element is active or focused, it receives a 2px solid border of the primary Indigo `#4F46E5`.

Depth is conveyed through stacking rather than shadowing. Modals and overlays should use a subtle, 15% opacity Deep Slate tint for the backdrop to keep the focus purely on the active task.

## Shapes
The shape language is **Soft (0.25rem)**. This provides a clean, modern feel without the "friendliness" of fully rounded corners. 

- **Small Components:** Buttons, inputs, and badges use a 4px (`0.25rem`) radius.
- **Large Components:** Listing cards and data containers use an 8px (`0.5rem`) radius.
- **Status Pills:** Status indicators (e.g., "Available", "Paid") may use a full pill-shape (999px) to distinguish them from interactive buttons.

## Components

### Buttons & Inputs
- **Primary Action:** Solid Indigo (`#4F46E5`) with White text. No gradients.
- **Secondary Action:** White background with a `#E2E8F0` border and Deep Slate text.
- **Inputs:** Standardized 40px height. Use `#F8FAFC` as a subtle fill for disabled states. Error states use a red border and a small icon for accessibility.

### Cards (Listings)
Cards must be structured for data-first viewing. Top section: Image with a status badge overlay (JetBrains Mono). Middle: Title and Location. Bottom: A "Data Grid" layout showing Rent, Deposit, and Availability in a 3-column split with vertical dividers.

### Data Tables (Billing)
High-density tables are essential. Rows should be alternating or separated by `#E2E8F0` lines. Use mono fonts for all currency and date columns. The header should be capitalized, using the `label-sm` style.

### Status Badges
Status badges use low-saturation background tints of their semantic colors (e.g., light green background with dark green text) to ensure they are visible but do not distract from primary action buttons.

### Management Tools
Include a "Quick Stats" component: a row of small, bordered boxes displaying key metrics (e.g., "Occupancy: 94%") to give managers an immediate overview of their portfolio.