---
name: Precision Living System
colors:
  surface: '#0b1326'
  surface-dim: '#0b1326'
  surface-bright: '#31394d'
  surface-container-lowest: '#060e20'
  surface-container-low: '#131b2e'
  surface-container: '#171f33'
  surface-container-high: '#222a3d'
  surface-container-highest: '#2d3449'
  on-surface: '#dae2fd'
  on-surface-variant: '#c7c4d7'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#908fa0'
  outline-variant: '#464554'
  surface-tint: '#c0c1ff'
  primary: '#c0c1ff'
  on-primary: '#1000a9'
  primary-container: '#8083ff'
  on-primary-container: '#0d0096'
  inverse-primary: '#494bd6'
  secondary: '#89ceff'
  on-secondary: '#00344d'
  secondary-container: '#00a2e6'
  on-secondary-container: '#00344e'
  tertiary: '#ffb783'
  on-tertiary: '#4f2500'
  tertiary-container: '#d97721'
  on-tertiary-container: '#452000'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e1e0ff'
  primary-fixed-dim: '#c0c1ff'
  on-primary-fixed: '#07006c'
  on-primary-fixed-variant: '#2f2ebe'
  secondary-fixed: '#c9e6ff'
  secondary-fixed-dim: '#89ceff'
  on-secondary-fixed: '#001e2f'
  on-secondary-fixed-variant: '#004c6e'
  tertiary-fixed: '#ffdcc5'
  tertiary-fixed-dim: '#ffb783'
  on-tertiary-fixed: '#301400'
  on-tertiary-fixed-variant: '#703700'
  background: '#0b1326'
  on-background: '#dae2fd'
  surface-variant: '#2d3449'
typography:
  headline-xl:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1280px
  gutter: 24px
  margin-desktop: 64px
  margin-mobile: 20px
---

## Brand & Style

This design system is engineered for the modern real estate and hospitality sector, targeting professionals and urban dwellers seeking streamlined housing solutions. The brand personality is **reliable, efficient, and sophisticated**, balancing high-tech precision with the comfort of home.

The visual style follows a **Corporate / Modern** aesthetic with **Minimalist** tendencies. It leverages a structured grid, high-quality typography, and a refined dark mode to evoke a sense of premium service and effortless utility. The interface should feel spacious yet information-dense, providing clarity through intentional whitespace and sharp, purposeful elements.

## Colors

The palette is anchored by a deep **Slate Navy (#0f172a)**, providing a sophisticated backdrop for dark mode. The primary Indigo is uplifted to a more vibrant **#6366f1** for high-contrast accessibility against dark surfaces.

- **Primary:** Vibrant Indigo for actions and primary branding.
- **Secondary:** Sky Blue for accents, icons, and status indicators.
- **Neutral:** A range of slates (from #0f172a to #94a3b8) to manage hierarchy and depth.
- **Theme Toggle:** Uses a high-visibility amber for the "sun" state and deep indigo for the "moon" state, housed in an elevated surface container.

## Typography

The typography system utilizes **Hanken Grotesk** for headlines to convey a sharp, contemporary tech feel. **Inter** handles the bulk of the body content for maximum readability across various screen densities. **JetBrains Mono** is introduced for labels and metadata to reinforce the "precision" aspect of the design system.

- Use **headline-xl** for hero sections on desktop.
- Ensure all body text uses the **#f8fafc** (off-white) variant for primary content and **#94a3b8** (light gray) for secondary descriptions to maintain AA contrast ratios.

## Layout & Spacing

The system employs a **12-column fluid grid** for desktop and a **4-column grid** for mobile. A strict 8px spacing power-of-two scale is used to define all gutters, margins, and padding.

- **Desktop (1440px+):** 64px side margins, 24px gutters.
- **Tablet (768px - 1024px):** 40px side margins, 20px gutters.
- **Mobile (below 768px):** 20px side margins, 16px gutters.

The layout philosophy emphasizes vertical rhythm; spacing between sections should scale from 48px on mobile to 96px on desktop to maintain the minimalist feel.

## Elevation & Depth

In dark mode, depth is conveyed through **Tonal Layers** rather than heavy shadows. As elements "rise" closer to the user, their surface color becomes lighter:

1. **Level 0 (Base):** #0f172a (Deep Slate)
2. **Level 1 (Cards/Containers):** #1e293b (Slate 800)
3. **Level 2 (Popovers/Modals):** #334155 (Slate 700)

**Ambient Shadows** are used sparingly on Level 2 elements, utilizing a 20% opacity black with a 16px blur to provide a subtle "lift" without breaking the flat, modern aesthetic. Low-contrast outlines (#334155) are preferred for card boundaries.

## Shapes

The shape language is **Soft (Level 1)**. This ensures the UI remains professional and structured while feeling approachable.

- **Standard Buttons & Inputs:** 0.25rem (4px) corner radius.
- **Cards & Large Containers:** 0.5rem (8px) corner radius.
- **Feature Tags & Chips:** 0.75rem (12px) for a more distinct, pill-like appearance.

## Components

### Buttons
Primary buttons use the vibrant indigo gradient. In dark mode, ensure the text color is white. Secondary buttons use a ghost style with a 1px border of #334155.

### Cards
Cards should have no background on the base level, defined instead by a 1px border (#1e293b). On hover, they transition to a solid #1e293b background to provide tactile feedback.

### Input Fields
Inputs use a dark background (#1e293b) with a subtle bottom border. Focus states are indicated by a 2px primary indigo outline.

### Theme Toggle
A rounded toggle positioned in the top-right navigation. 
- **Light State:** Shows the light-mode logo and a sun icon.
- **Dark State:** Shows the dark-mode logo and a moon icon.

### Lists
List items are separated by thin horizontal lines (#1e293b) with 16px vertical padding to maintain a clean, airy feel.