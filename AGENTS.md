# Repository Guidelines

## Project Structure & Module Organization
- **Source**: `src/` with `App.tsx`, `main.tsx`, `components/`, `components/ui/`, `styles/`, and `guidelines/Guidelines.md`.
- **Entry**: `index.html` + `src/main.tsx`; Vite config in `vite.config.ts` (alias `@` -> `src`).
- **Components**: Feature components in `src/components/*.tsx`; UI primitives in `src/components/ui/*.tsx`.
- **Assets/Styles**: Global styles in `src/index.css` (Tailwind v4 build). Build output at `build/`.

## Build, Test, and Development Commands
- **Install**: `npm i` — install dependencies.
- **Develop**: `npm run dev` — start Vite at `http://localhost:3000` (auto‑open).
- **Build**: `npm run build` — production build to `build/`.
- **Preview**: `npx vite preview --port 3000` — serve the built app locally.

## Coding Style & Naming Conventions
- **Language**: TypeScript + React; prefer functional components and hooks.
- **Indentation**: 2 spaces; avoid unused vars; prefer named exports.
- **Filenames**: PascalCase for feature components (e.g., `ParentDashboard.tsx`); kebab‑case for UI primitives in `components/ui` (e.g., `button.tsx`).
- **Imports**: Use `@/…` for internal modules (Vite alias).
- **Styling**: Tailwind utility classes in JSX; keep class lists readable and consistent with design tokens.

## Testing Guidelines
- No test runner is configured yet. If adding tests:
  - Use Vitest + React Testing Library.
  - Place tests as `*.test.tsx` next to components or under `src/__tests__/`.
  - Add scripts: `"test": "vitest"`, `"test:run": "vitest run"`.
  - Cover core logic and interactive states; include accessibility checks where possible.

## Commit & Pull Request Guidelines
- **Commits**: Short, imperative, and scoped (e.g., `Add progress bar to header`).
- **Branches**: Issue branches are auto‑created (`feature/{issue-number}-{title}`) via `.github/issue-branch.yml`.
- **PRs**: Follow `.github/pull_request_template.md` and include:
  - Linked issues (e.g., `Closes #123`).
  - Clear summary and rationale.
  - UI screenshots/GIFs and verification steps.
  - Ensure `npm run dev` and `npm run build` succeed locally; no console errors.

## Security & Configuration Tips
- Do not commit secrets. For runtime config, use Vite env vars with `VITE_` prefix (e.g., `.env.local`).
- Validate external image sources and third-party packages.
- Recommended Node 18+; dev server port is `3000` (configurable in `vite.config.ts`).

## 交流约定
- 回答用户问题时优先使用中文表述，并在必要时附上简要解释，确保沟通清晰易懂。
