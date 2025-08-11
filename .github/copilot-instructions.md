# Copilot Instructions for wrap-wizard-finder

## Project Overview
This is a Vite + React + TypeScript web app using Tailwind CSS and shadcn-ui. The project structure is modular, with UI components in `src/components/ui`, page-level components in `src/pages`, and layout elements in `src/components/layout`.

## Key Architectural Patterns
- **Component Organization:**
  - UI primitives (buttons, dialogs, etc.) are in `src/components/ui/`.
  - Page components (e.g., `Build.tsx`, `Catalog.tsx`) are in `src/pages/`.
  - Layout components (`SiteHeader`, `SiteFooter`) are in `src/components/layout/`.
  - Home page sections (e.g., `Hero`, `CategoryGrid`) are in `src/components/home/`.
- **Styling:**
  - Tailwind CSS is used for utility-first styling. See `tailwind.config.ts` for customizations.
  - Component styles may also use `App.css` and `index.css`.
- **State & Hooks:**
  - Custom hooks are in `src/hooks/` (e.g., `use-mobile.tsx`, `use-toast.ts`).
- **Utilities:**
  - Shared utility functions are in `src/lib/utils.ts`.

## Developer Workflows
- **Install dependencies:**
  - `npm i`
- **Start development server:**
  - `npm run dev` (hot reload, instant preview)
- **Build for production:**
  - `npm run build`
- **Preview production build:**
  - `npm run preview`
- **Linting:**
  - Uses ESLint (`eslint.config.js`). Run `npx eslint .` to check code quality.
- **No test framework detected.**

## Conventions & Patterns
- **File Naming:**
  - Components use PascalCase (`ProductCard.tsx`, `SiteHeader.tsx`).
  - Hooks use `use-` prefix (`use-mobile.tsx`).
- **Props & Types:**
  - TypeScript is used throughout. Prefer explicit prop types and interfaces.
- **Component Exports:**
  - Most components use named exports.
- **No global state management detected (e.g., Redux, Zustand).**
- **No API/service layer detected.**

## External Integrations
- **Lovable Platform:**
  - Project can be edited and deployed via [Lovable](https://lovable.dev/projects/fcf0e752-bf7e-4470-bc33-267e42e5d550).
  - Changes made in Lovable are auto-committed to this repo.
- **shadcn-ui:**
  - UI primitives are sourced from shadcn-ui and may follow its conventions.

## Examples
- To add a new UI primitive, place it in `src/components/ui/` and follow the pattern in existing files (e.g., `button.tsx`).
- To create a new page, add a file to `src/pages/` and import needed components from `src/components/`.

## References
- `README.md` for setup and deployment.
- `tailwind.config.ts` for styling conventions.
- `eslint.config.js` for linting rules.

---
**If any conventions or workflows are unclear, ask the user for clarification or examples.**
