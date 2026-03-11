


# Style guide

The goal is an immersive, high-tech personal presence — think digital identity as a sleek, living neural interface.

## Core Theme & Mood
- **Primary vibe**        : Sleek cyber-futuristic personal command node  
- **Emotional tone**      : Confident, mysterious, powerful, slightly cinematic  
- **Influences**          : Late-2020s digital artist / indie hacker / AI creator personal sites — Blade Runner 2049 meets clean brutalist tech minimalism  
- **Target feeling**      : "This person builds things that feel alive and advanced"

## Color Palette (prefer OKLCH or HSL for consistency across light/dark if needed)
- **Background (deep space black)**  
  - Main canvas        : oklch(4% 0 0)   or #0a0a0f  
  - Layered surfaces   : oklch(8% 0.02 240) → oklch(10% 0.03 240)  

- **Signature accent (cyan/teal emission)**  
  - Primary glow       : oklch(80% 0.15 200)   → #00d4ff  
  - Softer variant     : oklch(70% 0.13 200)   → #00b8d9  
  - Glow / rim light   : oklch(85% 0.18 200 / 0.4)  

- **Supporting accents**  
  - Positive / highlight   : oklch(75% 0.14 160)   → #00e68a (emerald)  
  - Attention / links      : oklch(75% 0.16 80)    → #ffaa00 (amber)  
  - Subtle contrast        : oklch(70% 0.12 260)   → #6699ff  

- **Text hierarchy**  
  - Primary text           : oklch(92% 0 0)        → #e9e9f0  
  - Secondary / body       : oklch(75% 0 0)        → #c0c0d0  
  - Muted / metadata       : oklch(60% 0.02 240)   → #8a8fa6  

- **Glass / translucent layers**  
  - Card / section bg      : oklch(12% 0.04 240 / 0.55)  
  - Overlay / modal        : oklch(15% 0.05 240 / 0.35) + backdrop-blur(12–16px)  

## Surface & Depth Language
- **Glassmorphism strength** : Medium to strong  
  - Surfaces              : semi-transparent dark glass + faint emissive border  
  - Border treatment      : 1px solid oklch(70% 0.12 200 / 0.18)  
  - Inner depth           : inset 0 1px 4px oklch(0% 0 0 / 0.45)  
  - Active / focus glow   : 0 0 18px 3px oklch(80% 0.15 200 / 0.28)  

- **Corner radius scale**  
  - Small UI (buttons, tags) : 10–12px  
  - Cards / project tiles    : 18–24px  
  - Full sections / hero     : 28–40px  

- **Shadow & elevation**  
  - Resting elements         : 0 10px 28px oklch(0% 0 0 / 0.38)  
  - Hover / interactive      : 0 16px 40px oklch(80% 0.12 200 / 0.32)  
  - Layered depth            : 2–4 stacked shadows with decreasing blur & opacity  

## Typography System
- **Primary typeface**     : Geist, Manrope, or Inter (variable fonts)  
- **Secondary / display**  : Space Grotesk or similar geometric sans  
- **Mono / technical**     : JetBrains Mono, Fira Code, or Recursive Mono  
- **Weight usage**  
  - Hero / name / titles   : 700–900  
  - Project names          : 600–800  
  - Body text              : 400–500  
  - Small metadata         : 400–450  

- **Size scale**  
  - Hero name / tagline    : 4.5–7rem (clamp)  
  - Section headings       : 2.5–4rem  
  - Project titles         : 1.75–2.5rem  
  - Body copy              : 1.1–1.25rem  
  - Captions / dates       : 0.875–1rem  

## Layout & Spatial Composition
- **Overall structure**   : Full-bleed hero → modular project grid → asymmetric scrolling sections  
- **Hero section**        : Massive centered or offset name + short manifesto + subtle animated accent glow  
- **Project showcase**    : Large cards in masonry or 2–3 column grid, generous spacing (32–48px gutters)  
- **Navigation**          : Minimal fixed top or floating glass sidebar, appears on scroll or hover  
- **Footer**              : Slim, almost invisible until hover, with social links as glowing icons  

## Micro-Interactions & Details That Elevate It
- Subtle breathing glow on signature accent elements (opacity 0.9 → 1.0 cycle)  
- Project cards lift + glass opacity increase + border glow on hover  
- Cursor / pointer trails faint cyan particle or glow trail (optional but very on-brand)  
- Section transitions use smooth parallax or reveal-on-scroll with emissive edges  
- Active nav item has persistent soft underline glow  
- Background can have extremely subtle animated noise / scanline / starfield (very low opacity)  
- Loading / transition states use shimmering accent-gradient skeletons  

Apply these rules consistently across every element.  
The site should feel like stepping into your personal digital cockpit — minimal noise, maximum presence, unmistakably futuristic and intentional.