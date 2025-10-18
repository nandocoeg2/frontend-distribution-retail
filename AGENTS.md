# Repository Guidelines

## Project Structure & Module Organization
The Electron main process lives in `src/main.js`, with preload messaging in `src/preload.js` and the renderer bootstrapped by `src/renderer.js` and `src/App.jsx`. Feature pages are located in `src/pages`, while reusable UI layers (atoms, molecules, organisms) and domain widgets (for packing, invoices, etc.) sit under `src/components`. Shared hooks go in `src/hooks`, service clients and API helpers belong in `src/services`, and cross-cutting utilities live in `src/utils`. Webpack, Forge, Tailwind, and PostCSS configuration files reside at the repository root; transient build output is emitted to `.webpack/` during development and to `out/` when packaging.

## Build, Test, and Development Commands
- `npm start`: Launches Electron Forge with webpack hot reload for the renderer; use this for day-to-day development.
- `npm run package`: Produces platform-specific bundles in `out/` for smoke-testing without generating installers.
- `npm run make`: Runs the makers defined in `forge.config.js` to create distributable installers; validate the artifacts before sharing.
- `npm run publish`: Executes the Forge publish pipeline after release approval.
- `npm run lint`: Currently echoes a placeholder; until linting is configured, run `npx tsc --noEmit` to type-check the project prior to committing.

## Coding Style & Naming Conventions
Adopt two-space indentation, trailing semicolons, and single quotes to match the existing JSX style. Name React components with PascalCase in `.jsx` files, prefix reusable hooks with `use` in camelCase (e.g., `useAuth`), and export service modules in camelCase from `src/services`. Favor functional components with hooks, keep Tailwind utility classes declarative, and colocate feature-specific helpers within their component or page folder. Avoid introducing global CSS unless a token truly spans multiple domains; centralize shared variables in `src/index.css`.

## Testing Guidelines
Automated testing is not yet wired in, so document manual verification steps in pull requests until a runner is adopted. When adding coverage, co-locate specs in a `__tests__` directory or leverage `src/components/test` for harness components, naming files `ComponentName.test.jsx`. Use `@testing-library/react` (or similar) for renderer tests and mock the bridges exposed via `contextBridge` in `src/preload.js`. Regardless of tooling, exercise critical flows—authentication, packing updates, reporting exports—through `npm start` before requesting review.

## Commit & Pull Request Guidelines
Follow the Conventional Commits format already in history (`feat:`, `fix:`, `chore:`) with concise, present-tense summaries such as `feat: improve packing status sync`. Group related changes per commit and describe migrations or breaking adjustments in the body. Pull requests should outline the problem, solution, testing evidence, and any deployment considerations; attach screenshots or recordings for UI changes and reference issue IDs when available. Rebase onto the latest main branch, confirm local checks (package/make as appropriate), and sanity-check generated installers prior to final review.
