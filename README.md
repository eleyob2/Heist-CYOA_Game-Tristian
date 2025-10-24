# Heist — Create Your Own Adventure

A small browser-based branching adventure inspired by stealth heist stories. Built with plain HTML, CSS, and JavaScript.

Getting started

- Requirements: A modern browser and Node.js if you want to use the built-in start script.
- To run locally (PowerShell):
Option A — open directly in a browser (no Node required):

1. Open `index.html` in your browser (double-click or right-click Open With -> Browser).

Option B — serve with a local static server (optional, requires Node/npm):

```powershell
npm install --no-audit --no-fund # optional
npm run start
# then open http://localhost:8080 in your browser
```

Gameplay

- Read each scene and choose an action. Use number keys 1-9 to pick choices quickly.
- Inventory and status are shown on the left.
- Save/Load uses localStorage.

Files

- `index.html` — main shell
- `src/styles.css` — styles
- `src/app.js` — game engine
- `scenes/scenes.json` — scene data

License: MIT

STUFF 
so we were dared/chalanged to incorporate the following things to our game: Time Bomb: 
A timer appears and
something on the site will
explode if not clicked in
time.

AI overlord:
A box appears that claims
it is now in control and
gives random commands.

hidden team bio:
Create a hidden snippet of
text or a small image that
reveals something funny or
interesting about the
development team when a
specific sequence of actions
is performed (e.g., clicking a
logo a certain number of
times, pressing keys in a
particular order). DONOT add it yet, just do you think you can do it?