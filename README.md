# Concentric Mobile

A concentric ring clock for iPhone, as a home screen web app. Plain HTML, CSS
and JavaScript: no libraries, no build step.

Three faces, each its own page and its own home screen app:

- **Panel** (`panel.html`): today's date over two widget-sized tiles, the
  month and day, month and year progress as concentric rings, with a round
  dial read at 12 o'clock filling the bottom half.
- **Clock** (`clock.html`): just the dial, edge to edge.
- **Horizon** (`horizon.html`): a large hour over two arcs, minutes above
  seconds.

The seconds ring sweeps every frame; the minute ring rolls to each new minute.

## Install on iPhone

1. Open a face in Safari.
2. Tap Share, then **Add to Home Screen**.
3. Open it from the Home Screen. It runs full screen, works offline after the
   first visit, and keeps the screen awake while it's open.
4. Tap the clock to show the page switcher.

Add each face you want separately; each one opens straight to itself.

iOS doesn't let web apps (or any app) set a live wallpaper, so this runs as an
app you open, for a desk stand or a charging dock.

## Run locally

```sh
python3 -m http.server 5180
```

Then open http://localhost:5180. The pages also open straight from disk, minus
offline support.

## Files

- `js/concentric.js`: the ring builder, timing and date helpers, wake lock,
  page switcher and service worker registration, shared by every page.
- `js/panel.js`, `js/clock.js`, `js/horizon.js`: one per face, laying it out.
- `css/base.css` plus one stylesheet per page.
- `sw.js`: offline cache. App files come from the network when online, so
  updates show up on the next launch.
- `*.webmanifest`: one per face, so each installs as its own app.
