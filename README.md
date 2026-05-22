# money-saver

**Spin Before You Spend** — a single-page website with a spinning wheel of better
uses of your money. About to make an impulse buy? Spin the wheel and let it
remind you what you'd rather put that money toward.

## Run it

No build step. Just open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Features

- Canvas-rendered spinning wheel with smooth ease-out animation.
- Add and remove your own options — saved in `localStorage`.
- "Reset to defaults" restores the starter list.
- Responsive layout, works on phone or desktop.

## Files

- `index.html` — page structure
- `styles.css` — styles
- `script.js` — wheel rendering, spin logic, and options management
