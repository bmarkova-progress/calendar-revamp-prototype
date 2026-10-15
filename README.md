# Calendar prototype

A standalone local copy of the Figma Make calendar prototype, exported from [`bmarkova-progress/PrototypeCalendarApp`](https://github.com/bmarkova-progress/PrototypeCalendarApp).

The prototype demonstrates calendar interaction patterns: selecting dates, navigating months, choosing months and years, optional week numbers, and resizing a responsive calendar.

## Run locally

```bash
npm install
npm run dev
```

Vite prints the local URL, normally `http://localhost:5173`.

## Production check

```bash
npm run build
npm run preview
```

## Local adaptation

The exported Make source is preserved in `src/App.tsx`, `src/main.tsx`, and `src/index.css`. Its Figma-specific Vite plugins and Tailwind import were removed because they are not required for this app’s styles or runtime outside Figma Make.
