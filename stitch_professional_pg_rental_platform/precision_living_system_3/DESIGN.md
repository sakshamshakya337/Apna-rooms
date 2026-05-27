---
name: Precision Living System
colors:
  surface: '#fdf7ff'
  surface-dim: '#ded8e0'
  surface-bright: '#fdf7ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f8f2fa'
  surface-container: '#f2ecf4'
  surface-container-high: '#ece6ee'
  surface-container-highest: '#e6e0e9'
  on-surface: '#1d1b20'
  on-surface-variant: '#494551'
  inverse-surface: '#322f35'
  inverse-on-surface: '#f5eff7'
  outline: '#7a7582'
  outline-variant: '#cbc4d2'
  surface-tint: '#6750a4'
  primary: '#4f378a'
  on-primary: '#ffffff'
  primary-container: '#6750a4'
  on-primary-container: '#e0d2ff'
  inverse-primary: '#cfbcff'
  secondary: '#63597c'
  on-secondary: '#ffffff'
  secondary-container: '#e1d4fd'
  on-secondary-container: '#645a7d'
  tertiary: '#765b00'
  on-tertiary: '#ffffff'
  tertiary-container: '#c9a74d'
  on-tertiary-container: '#503d00'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e9ddff'
  primary-fixed-dim: '#cfbcff'
  on-primary-fixed: '#22005d'
  on-primary-fixed-variant: '#4f378a'
  secondary-fixed: '#e9ddff'
  secondary-fixed-dim: '#cdc0e9'
  on-secondary-fixed: '#1f1635'
  on-secondary-fixed-variant: '#4b4263'
  tertiary-fixed: '#ffdf93'
  tertiary-fixed-dim: '#e7c365'
  on-tertiary-fixed: '#241a00'
  on-tertiary-fixed-variant: '#594400'
  background: '#fdf7ff'
  on-background: '#1d1b20'
  surface-variant: '#e6e0e9'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  title-lg:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  title-md:
    fontFamily: Inter
    fontSize: 16px
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
  label-lg:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
  label-md:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  margin: 24px
---

## Brand & Style

The design system is engineered for professional, high-performance environments where data density and technical clarity are paramount. The brand personality is authoritative and meticulous, evoking a sense of reliability through structured layouts and crisp visual execution.

The visual style is **Corporate / Modern** with a lean toward **Minimalism**, emphasizing utility over decoration. It utilizes high-contrast surfaces and rigid structural alignment to facilitate rapid data processing for power users.

**Logo Assets:**
- **Light Mode:** Use `apna_light.jpg`.
- **Dark Mode:** Use `apna_dark.jpg`.

## Colors

The palette is optimized for long-term screen usage and technical legibility.

### Light Mode
Uses a **Slate (#475569)** and **Indigo (#4F46E5)** primary pairing. Surfaces are kept stark white or very light gray to ensure maximum contrast with text and data points. Borders are crisp and clearly defined to separate functional zones.

### Dark Mode
Centered around a **Deep Navy (#0b1326)** base with **Dark Slate** surface containers. Highlights utilize **Inverse-Primary** tones (softening the indigo to a lighter violet-blue) to maintain accessibility. Interactive elements often use subtle outlined variants rather than heavy solid fills to prevent visual fatigue.

## Typography

This design system uses **Inter** exclusively to leverage its exceptional legibility in data-heavy interfaces. The type scale is systematic, prioritizing vertical rhythm and clear hierarchy.

- **Headlines:** Reserved for page titles and major dashboard sections.
- **Titles:** Used for card headers and modal titles.
- **Body:** The workhorse for all primary content; `body-md` is the standard for data entries.
- **Labels:** Used for metadata, status badges, and table headers. Capitalization is used sparingly for headers to improve scannability.

## Layout & Spacing

A **rigid 4px/8px grid system** governs the entire layout. Every element’s position and size must be a multiple of 4px.

- **Grid:** A 12-column fluid grid is used for desktop layouts, transitioning to a 4-column grid for mobile.
- **Density:** High density is preferred. Whitespace is purposeful and used to group related information rather than isolate it.
- **Sidebars:** Navigation is handled via a fixed left-hand sidebar (240px width) that can collapse to an icon-only rail (64px).
- **Reflow:** On tablet/mobile, sidebars move to a bottom-sheet or hamburger menu, and grid columns stack vertically.

## Elevation & Depth

Visual hierarchy is established through **Tonal Layers** rather than heavy shadows.

- **Level 0 (Base):** The primary background color.
- **Level 1 (Cards/Sections):** A slightly lighter (light mode) or darker (dark mode) surface color.
- **Outlines:** Low-contrast outlines (1px) are used on all containers to provide structural definition. 
- **Active States:** Subtle ambient shadows (4px blur, 10% opacity) are used only for floating elements like dropdowns or tooltips to indicate they sit above the primary workflow.

## Shapes

The design system employs a disciplined shape language. **ROUND_FOUR (0.25rem)** is the global standard for all containers, buttons, and input fields. This slight rounding maintains a professional, technical appearance while avoiding the harshness of absolute sharp corners.

- **Buttons/Inputs:** 4px radius.
- **Large Containers/Cards:** 8px radius (`rounded-lg`).
- **Status Badges:** Fully pill-shaped to distinguish them from interactive buttons.

## Components

### Tables
The core of the system. Use a high-density layout with 8px cell padding. Row hovering must be distinct (using surface-level shifts). Headers should be `label-lg` with subtle separators.

### Status Badges
- **Urgent:** Red background, white text (Light); Soft red border, red text (Dark).
- **Medium:** Amber/Yellow.
- **Low:** Slate/Gray.
- **Registered:** Blue/Indigo.
- **Resolved:** Green.

### Navigation Sidebar
Dark themed by default in both modes to frame the content. Active states use a solid 4px left-border accent in the primary indigo color.

### Input Fields
Strictly rectangular with a 4px radius. In Light Mode, use a light gray fill with a darker border on focus. In Dark Mode, use a transparent fill with a prominent border stroke.

### High-Density Grids
Utilized for KPI dashboards. Cards should have minimal internal padding (16px) to maximize the "at-a-glance" data volume.