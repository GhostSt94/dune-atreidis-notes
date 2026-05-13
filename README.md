# Atreides Command — Dune Strategic Assistant

Assistant stratégique pour la faction Atreides dans le jeu de société **Dune** (Avalon Hill / Gale Force Nine). Application web pensée pour accompagner une partie réelle autour d'un plateau physique.

## Fonctionnalités

- **Dashboard de partie** avec phase tracker, tour, alertes, factions, IA.
- **Gestion des 6 factions** : troupes, épice, leaders, alliances, notes privées, historique.
- **Système de notes** catégorisées (traîtrise, leaders, plans ennemis, batailles, alliances, infos, mentat, économie) avec priorités et épinglage.
- **Tracker de cartes de traîtrise** en trois colonnes (connues / suspectées / éliminées), exploitant l'avantage prescient Atreides.
- **Tracker de batailles** avec formulaire complet (RHF + Zod) et historique.
- **Prédictions Bene Gesserit** avec niveau de confiance et résolution.
- **Carte stratégique SVG** d'Arrakis : contrôle, présence par faction, épice, conflits, brouillard de guerre.
- **Journal de partie** timeline auto-générée.
- **Moteur IA heuristique 100% local** : scoring de menace, estimation des mains, risques d'alliance, probabilités de victoire, suggestions Mentat.
- **Sauvegarde locale + Export/Import JSON** versionné.
- **Mode rapide mobile** (bottom nav).
- **Dark mode unique** thème Atreides (bleu nuit, argent, or).

## Stack

| Couche | Choix |
|---|---|
| Build | Vite 5 + React 18 + TypeScript 5 (strict) |
| Styling | TailwindCSS 3 + CSS variables |
| State | Zustand 4 + middleware `persist` (LocalStorage) |
| Routing | React Router 6 |
| Animations | Framer Motion 11 |
| Forms | React Hook Form + Zod |
| Icons | Lucide React |
| Tests | Vitest + React Testing Library |

## Démarrage

```powershell
npm install
npm run dev          # http://localhost:5173
npm run typecheck
npm run lint
npm run test
npm run build
```

## Architecture

```
src/
├── ai/             # Moteur d'analyse heuristique
├── components/
│   ├── layout/     # AppShell, Sidebar, Topbar, MobileNav
│   ├── ui/         # Primitives stylées (Button, Card, Modal, Tabs, etc.)
│   └── widgets/    # Panneaux du dashboard (PhaseTracker, AIInsights, …)
├── data/           # Catalogues statiques (factions, leaders, territoires, cartes, phases)
├── hooks/          # useAnalysis, useAlerts, useAutosave, useMediaQuery, …
├── lib/            # storage, id, date, exportImport, cn
├── pages/          # Login, GamesList, NewGame, GameView, Factions, Notes, Cards,
│                   #  Battles, Map, Journal, Analysis, Predictions, History, Settings
├── store/          # Stores Zustand persistés par domaine
├── styles/         # index.css + theme.ts
└── types/          # Types TypeScript (faction, game, note, card, battle, …)
```

## Roadmap v2 (différée)

- Backend Node/Express + MongoDB + WebSocket (sync multijoueur).
- Authentification réelle (JWT).
- Intégration LLM Claude API pour analyses en langage naturel.
- PWA installable et offline manifest.
- i18n EN/FR.

## License

Usage privé. Dune est une marque déposée de Herbert Properties LLC et de ses ayants droit. Ce projet est un outil non officiel à des fins ludiques.
