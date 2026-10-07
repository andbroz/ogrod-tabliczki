# Ogród Tabliczki

A garden game that helps children aged 7–9 learn the multiplication table up to 100 (*tabliczka mnożenia*). The interface is in Polish and designed for children who are still learning to read: icons, digits and colours do most of the talking.

**Play:** https://andbroz.github.io/tabliczka-mnozenia-game/

## How it works

- The home screen is a 10 × 10 garden. Every multiplication fact is a plant that grows 🌱 seed → 🌿 sprout → 🌸 flower. 7 × 8 and 8 × 7 share one plant.
- **Graj** starts a round of 10 problems. New facts are answered by tapping one of three answers; facts the child already knows a bit are typed on a number pad.
- Two correct answers in a row grow a flower; a mistake moves the plant back one step and shows a picture of dots that explains the answer.
- New garden beds (×5 and ×10, then ×3 and ×4, then ×6–×9) open automatically as the child progresses. "Anything × 0 = 0" is practised as a quick rule.
- No timers, no lives, no leaderboards.

## Privacy and offline use

- Progress is stored only in the browser on the device (`localStorage`). There are no accounts, no server and no analytics.
- After the first visit the game works offline and can be added to the home screen of a tablet or phone.
- A parent can reset the garden with the ⚙ button (type `USUŃ` to confirm).

## Development

Requires Node.js 24.

| Task | Command |
|---|---|
| Install | `npm ci` |
| Dev server (http://localhost:4200) | `npm start` |
| Unit tests | `npx ng test --watch=false` |
| Tests with coverage | `npx ng test --watch=false --coverage` |
| Lint | `npx ng lint` |
| Production build | `npm run build` |

The service worker is only active in production builds. To try offline mode locally, build and serve `dist/tabliczka-mnozenia-game/browser` with a static server (e.g. `npx http-server`), load the page once, then go offline.

## Deployment

Every push to `main` runs lint and tests, builds with the repository base href, and publishes to GitHub Pages ([.github/workflows/deploy.yml](.github/workflows/deploy.yml)).

## Project documents

- [docs/ideas/ogrod-tabliczki.md](docs/ideas/ogrod-tabliczki.md): the idea and what's deliberately not included
- [SPEC.md](SPEC.md): the specification and game rules
- [tasks/plan.md](tasks/plan.md): the implementation plan
