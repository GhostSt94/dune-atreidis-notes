# Dune Atreides — Treachery Card Tracker & Strategy Assistant for the Dune Board Game

> Open-source companion app for the classic **Dune board game** (Avalon Hill / Gale Force Nine / Avalon Hill Games). Track spice, leaders, Treachery cards, traitors and bidding rounds across a real-life game session. Designed for players of the Atreides faction, but useful for any house at the table.

[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-d4a437)](https://github.com/GhostSt94/dune-atreidis-notes/pulls)

---

## What is this?

A lightweight, offline-first **Dune board game tracker** that runs entirely in your browser. No backend, no account, no cloud sync — your game state lives in `localStorage` and can be exported as JSON.

Built specifically around the strategic needs of an Atreides player (prescient advantage, traitor knowledge, alliance reads), but usable for any of the six standard houses: **Atreides, Harkonnen, Emperor, Fremen, Spacing Guild, Bene Gesserit**.

## Features

- **Per-faction tracker** with spice meter, leaders (alive/fallen), Treachery cards in hand, and traitors.
- **Treachery cards catalog** with 43+ cards — Weapons (projectile + poison), Defenses (Shield, Snooper), Specials (Karama, Family Atomics, Truthtrance, Thumper, Harvester, Stone Burner, Lasgun, Cone of Silence…) and Worthless cards. Themed playing-card UI with type-colored medallions and inline subtype labels.
- **Bidding-phase recorder** (floating action button): pick a card, choose the winning faction and the price, and the app applies the cascade — winner spice debited, Emperor credited (or vanishes to the bank if the Emperor wins or is absent).
- **Traitor tracker** per faction with leader catalog and Harkonnen always-active rule baked in.
- **Eliminated-cards discard** with one-tap restore to any faction.
- **Notes** with categories (Treachery, Leaders, Plans, Alliances…), priorities and pinning.
- **Single-game mode**: keep one active game at a time, start a fresh one from Settings with a confirmation modal.
- **Mobile-first** layout with a bottom navigation bar — works great on a phone at the table.
- **Bilingual UI**: English and French (FR), switchable from Settings.
- **Export / Import JSON** versioned backups.
- **Local-only** — no telemetry, no tracking, no server.

## Tech stack

| Layer | Choice |
|---|---|
| Build | **Vite 5** + **React 18** + **TypeScript 5** (strict mode) |
| Styling | **TailwindCSS 3** with custom Atreides theme (deep blue, silver, gold) |
| State | **Zustand 4** + `persist` middleware (localStorage) |
| Routing | **React Router 6** |
| Animations | **Framer Motion 11** |
| Forms | **React Hook Form** + **Zod** |
| Icons | **lucide-react** |
| Tests | **Vitest** + **React Testing Library** |

## Quick start

```bash
git clone https://github.com/GhostSt94/dune-atreidis-notes.git
cd dune-atreidis-notes
npm install
npm run dev               # http://localhost:5173
```

Useful scripts:

```bash
npm run dev               # Vite dev server (HMR)
npm run dev -- --host     # Expose on LAN — open from your phone
npm run build             # tsc --noEmit + vite build
npm run typecheck         # TypeScript only
npm run lint              # ESLint
npm run test              # Vitest unit tests
```

## Deployment

The app is a static SPA — deploy the `dist/` folder anywhere. A `vercel.json` is included with the SPA rewrite (`/(.*)` → `/index.html`) so React Router routes resolve on hard reload.

**One-click deploy**: Vercel, Netlify, Cloudflare Pages, GitHub Pages — all work out of the box.

## Project structure

```
src/
├── components/
│   ├── layout/      # AppShell, MobileNav (bottom nav for mobile-first)
│   ├── ui/          # Button, Card, Modal, Toggle, Input, Badge, EmptyState…
│   └── icons/       # FactionIcon and Atreides/Harkonnen/Emperor/Fremen/Guild/Bene Gesserit assets
├── data/
│   ├── cards.ts     # 43+ Treachery cards (weapons, defenses, specials, worthless)
│   ├── factions.ts  # The 6 standard houses with colors, starting spice, mottos
│   ├── leaders.ts   # Named leaders with portraits and values
│   └── phases.ts    # Game phase sequence
├── pages/
│   ├── CardsPage.tsx     # Tracker — the main view
│   ├── NotesPage.tsx     # Note-taking
│   ├── SettingsPage.tsx  # Profile, language, new game, backup
│   └── NewGamePage.tsx   # Faction selection on game start
├── store/           # Zustand stores (game, cards, notes, factions, traitors, profile, settings)
├── i18n/            # English + French translations
└── styles/          # Tailwind layer extensions and theme tokens
```

## About the Dune board game

The **Dune board game** is a classic 1979 strategy game by Eon, republished by Avalon Hill (Gale Force Nine) in 2019. Each of the 2–6 players takes the role of a **Great House** competing for control of the planet **Arrakis** and its precious **spice melange**.

This tracker is a fan-made tool — it does not replace the rulebook, the physical board, the dice or the cards. It is a **digital notepad** to keep score of spice, leaders alive and fallen, Treachery cards in each opponent's hand, suspected traitors and ongoing alliances.

### Keywords / search terms

> Dune board game tracker · Dune Avalon Hill companion app · Dune Gale Force Nine helper · Treachery card tracker · Atreides strategy assistant · Dune board game helper · spice tracker · faction tracker · Dune board game tools · Dune 2019 reprint · open source board game companion

## Bilingual / Multilingue

The UI is available in **English** and **French** (switch from Settings). All Treachery cards, leaders, factions and tooltips are translated.

L'interface est disponible en **anglais** et en **français** (changement dans les Paramètres). Toutes les cartes de Traîtrise, les leaders, les factions et les info-bulles sont traduites.

## Contributing

Issues and pull requests welcome. The codebase aims for strict TypeScript, zero ESLint warnings and a clean Vite build. Run `npm run typecheck && npm run build` before opening a PR.

## License & disclaimer

This is an **unofficial fan project** for personal and recreational use only. **Dune** is a trademark of **Herbert Properties LLC** and its licensees. The board game is published by **Avalon Hill / Gale Force Nine / Wizards of the Coast**. This app is not affiliated with, endorsed by, or sponsored by any of those entities.

No card art, board art or copyrighted text from the published game is included in this repository.
