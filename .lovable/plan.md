## Goal
Load your uploaded "Lens_28.05.26_15.24" build into this project so you can edit it directly and see it in the preview.

## What's in the upload
A complete Vite + React app (not the TanStack Start template currently here):
- `src/` with `App.tsx`, `main.tsx`, `pages/`, `dashboards/`, `components/`, `store/`, `hooks/`, `lib/`, `config/`, `data/`, `assets/`
- Root configs: `index.html`, `vite.config.ts`, `tailwind.config.ts`, `postcss.config.js`, `tsconfig*.json`, `eslint.config.js`, `components.json`, `package.json` + `bun.lock`
- `public/`, `import_templates/`, and docs (`README.md`, `INTEGRATION.md`, `functional_dashboards.md`, `system_master_list.md`, etc.)
- `.lovable/` project metadata
- Excluded from copy: `node_modules/`, `dist/`, `bun.lockb`, `package-lock.json`, `.git` (none present, but guarded), `scratch/`

## Plan
1. Wipe the current TanStack Start scaffold in `/dev-server` (keep `.git` and any sandbox-managed dotfiles intact).
2. Copy every file/folder from the uploaded archive into the project root, excluding `node_modules`, `dist`, `bun.lockb`, `package-lock.json`, and any `.git` metadata.
3. Run `bun install` to install dependencies from the new `package.json` / `bun.lock`.
4. Restart the dev server and load the preview so you can confirm it renders.

## Notes
- The new app uses standard Vite + React Router (not TanStack Start), so all current routes/files under `src/routes/` will be removed in favor of `src/App.tsx` + `src/pages/`.
- Any API keys/secrets your developers had configured server-side are not in the zip; if the app calls external APIs via env vars, we may need to add them as secrets after the first preview load.
- Approve this plan and I'll execute the swap and bring up the preview.