# MoshRadix

Mohamed Shamil's personal digital workshop — a Next.js site showcasing open-source projects,
work-in-progress builds, and field notes from tinkering with Electron, home automation, and
offline-first software.

Version: `0.1.1`

## What this is

MoshRadix is a personal portfolio and blog. It demonstrates a modern stack including Next.js 16,
React 19, TypeScript, Tailwind CSS, and Radix UI primitives.

### What's inside

- App shell and pages in `app/`
- UI components under `components/` (hero, header, footer, projects grid, workbench, lab notes, etc.)
- Styling with Tailwind CSS and global styles in `styles/` and `app/globals.css`
- TypeScript-first codebase

## Getting started

Prerequisites

- Node.js 18 or newer
- pnpm (recommended) — install from <https://pnpm.io/>

Quick start

```bash
# install dependencies
pnpm install

# run development server
pnpm dev
```

Available scripts

- `pnpm dev` — runs `next dev` (development server)
- `pnpm build` — runs `next build` (production build)
- `pnpm start` — runs `next start` (serve built app)
- `pnpm lint` — run `eslint .`

Building for production

```bash
pnpm build
pnpm start
```

## Project layout

- `app/` — Next.js App Router pages and layout
- `components/` — UI components and feature pieces
- `lib/` — utilities, seed data, and database helpers
- `public/` — static assets
- `styles/` — global styles and Tailwind CSS entry

## Maintainer

Mohamed Shamil ([@MoshRadix](https://github.com/MoshRadix) on GitHub)
