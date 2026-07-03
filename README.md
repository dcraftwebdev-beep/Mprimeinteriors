# WoodNest

A hero landing page for a boutique cabin-rental brand, built with React + Vite and CSS Modules.

## Stack

- React 19
- Vite
- CSS Modules (`*.module.css`) — no global CSS frameworks
- Plain SVG for the hero illustration (no external image dependency)

## Project structure

```
woodnest/
├── index.html
├── package.json
├── vite.config.js
├── public/                  # static assets served as-is
└── src/
    ├── main.jsx              # React entry point
    ├── App.jsx                # root component
    ├── index.css              # global resets + design tokens
    ├── assets/
    │   └── hero-forest.svg    # layered misty-pine-forest hero illustration
    └── components/
        ├── Navbar/
        │   ├── Navbar.jsx
        │   └── Navbar.module.css
        ├── Hero/
        │   ├── Hero.jsx
        │   └── Hero.module.css
        └── BookingCard/
            ├── BookingCard.jsx
            └── BookingCard.module.css
```

## Getting started

```bash
npm install
npm run dev       # start local dev server
npm run build     # production build to /dist
npm run preview   # preview the production build
```

## Notes

- Every component has its CSS colocated in a `.module.css` file, so class names
  are automatically scoped and won't leak or collide across components.
- The hero background is a hand-built layered SVG (forest silhouettes, fog bands,
  glowing cabin windows) rather than a raster photo, so the project has zero
  external image dependencies and stays lightweight.
- Fonts are loaded from Google Fonts (`Fraunces` for display type, `Manrope` for body)
  via `@import` in `index.css`.
