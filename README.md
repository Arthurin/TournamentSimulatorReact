# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

##

La gestion du repos laisse à désirer : un joueur peut être 2 fois au repos et d'autres 0 fois.
TODO: faire un bouton de confirmation lorsqu'on génère les matchs pour éviter le misclick. Ce bouton disparait une fois les matchs générés.
"Etes vous sûr.e ? Il y a eu 0/5 matchs de complété"

FAIL src/tests/matchmaking.test.js > generateMatches() > évite de rejouer avec le même partenaire
AssertionError: expected [ 'j1', 'j2' ] to be undefined

- Expected:
  undefined

* Received:
  [
  "j1",
  "j2",
  ]
