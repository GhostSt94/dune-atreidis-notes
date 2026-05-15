import { useRef } from 'react';
import { Download, Upload, RotateCcw, User, ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Toggle } from '@/components/ui/Toggle';
import { Button } from '@/components/ui/Button';
import {
  useSettingsStore,
  useProfileStore,
  useGameStore,
  useFactionStore,
  useNotesStore,
  useCardsStore,
  useBattlesStore,
  usePredictionsStore,
  useMapStore,
  useJournalStore,
} from '@/store';
import { downloadJson, readJsonFile, EXPORT_VERSION, type GameExport } from '@/lib/exportImport';
import { storage } from '@/lib/storage';
import { useNavigate } from 'react-router-dom';

export const SettingsPage = () => {
  const fog = useSettingsStore((s) => s.fogOfWar);
  const toggleFog = useSettingsStore((s) => s.toggleFog);
  const autosave = useSettingsStore((s) => s.autosaveToast);
  const toggleAutosave = useSettingsStore((s) => s.toggleAutosaveToast);
  const density = useSettingsStore((s) => s.density);
  const setDensity = useSettingsStore((s) => s.setDensity);
  const mobile = useSettingsStore((s) => s.mobileQuickAccess);
  const toggleMobile = useSettingsStore((s) => s.toggleMobileQuickAccess);
  const useValue10 = useSettingsStore((s) => s.useValue10Leaders);
  const toggleValue10 = useSettingsStore((s) => s.toggleValue10Leaders);
  const profile = useProfileStore((s) => s.profile);
  const clearProfile = useProfileStore((s) => s.clearProfile);

  const games = useGameStore((s) => s.games);
  const factionsByGame = useFactionStore((s) => s.byGame);
  const notes = useNotesStore((s) => s.notes);
  const cards = useCardsStore((s) => s.entries);
  const battles = useBattlesStore((s) => s.battles);
  const predictions = usePredictionsStore((s) => s.predictions);
  const mapByGame = useMapStore((s) => s.byGame);
  const events = useJournalStore((s) => s.events);

  const fileRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const exportAll = () => {
    const exports = Object.values(games).map<GameExport>((g) => ({
      version: EXPORT_VERSION,
      exportedAt: Date.now(),
      game: g,
      factions: Object.values(factionsByGame[g.id] ?? {}),
      notes: notes.filter((n) => n.gameId === g.id),
      cards: cards.filter((c) => c.gameId === g.id),
      battles: battles.filter((b) => b.gameId === g.id),
      predictions: predictions.filter((p) => p.gameId === g.id),
      territoryControls: Object.values(mapByGame[g.id] ?? {}),
      journal: events.filter((e) => e.gameId === g.id),
    }));
    downloadJson({ version: EXPORT_VERSION, games: exports }, 'dune-atreides-backup.json');
  };

  const handleImport = async (file: File) => {
    try {
      const data = await readJsonFile(file);
      useGameStore.setState((s) => ({ games: { ...s.games, [data.game.id]: data.game } }));
      useFactionStore.setState((s) => ({
        byGame: {
          ...s.byGame,
          [data.game.id]: Object.fromEntries(data.factions.map((f) => [f.id, f])) as never,
        },
      }));
      useNotesStore.setState((s) => ({ notes: [...data.notes, ...s.notes] }));
      useCardsStore.setState((s) => ({ entries: [...data.cards, ...s.entries] }));
      useBattlesStore.setState((s) => ({ battles: [...data.battles, ...s.battles] }));
      usePredictionsStore.setState((s) => ({
        predictions: [...data.predictions, ...s.predictions],
      }));
      useMapStore.setState((s) => ({
        byGame: {
          ...s.byGame,
          [data.game.id]: Object.fromEntries(
            data.territoryControls.map((t) => [t.territoryId, t]),
          ),
        },
      }));
      useJournalStore.setState((s) => ({ events: [...data.journal, ...s.events] }));
      alert('Import réussi.');
    } catch (e) {
      alert(`Erreur d'import : ${(e as Error).message}`);
    }
  };

  const resetAll = () => {
    if (
      !confirm(
        'Effacer toutes les données (parties, notes, paramètres, profil) ? Cette action est irréversible.',
      )
    )
      return;
    storage.clearAll();
    location.reload();
  };

  return (
    <div className="px-4 lg:px-6 py-6 max-w-3xl mx-auto space-y-4">
      <div>
        <button
          onClick={() => {
            if (window.history.length > 1) navigate(-1);
            else navigate('/games');
          }}
          className="inline-flex items-center gap-1.5 text-xs uppercase font-display tracking-wider text-atreides-silverMuted hover:text-atreides-gold transition-colors mb-3"
        >
          <ArrowLeft size={14} /> Retour
        </button>
        <h1 className="font-display text-xl uppercase tracking-widest text-atreides-gold">
          Paramètres
        </h1>
      </div>

      <Card title="Profil">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-atreides-blue flex items-center justify-center border border-atreides-gold/40">
            <User size={18} className="text-atreides-gold" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-atreides-silver">
              {profile ? `${profile.housePrefix} ${profile.pseudo}` : 'Aucun profil'}
            </p>
            <p className="text-[11px] text-atreides-silverMuted font-mono">Profil local</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              clearProfile();
              navigate('/');
            }}
          >
            Changer
          </Button>
        </div>
      </Card>

      <Card title="Affichage">
        <div className="space-y-3">
          <Toggle
            checked={fog}
            onChange={toggleFog}
            label="Brouillard de guerre"
            description="Masque les territoires sans présence ni contrôle connu."
          />
          <Toggle
            checked={autosave}
            onChange={toggleAutosave}
            label="Indicateur d'autosauvegarde"
            description="Affiche une notification visuelle quand l'état est persisté."
          />
          <Toggle
            checked={mobile}
            onChange={toggleMobile}
            label="Mode rapide mobile"
            description="Bottom nav et accès rapide depuis l'écran de partie."
          />
          <div className="flex items-center gap-3 pt-2">
            <span className="text-sm text-atreides-silver">Densité</span>
            <Button
              size="sm"
              variant={density === 'comfortable' ? 'gold' : 'ghost'}
              onClick={() => setDensity('comfortable')}
            >
              Confortable
            </Button>
            <Button
              size="sm"
              variant={density === 'compact' ? 'gold' : 'ghost'}
              onClick={() => setDensity('compact')}
            >
              Compact
            </Button>
          </div>
        </div>
      </Card>

      <Card title="Règles du jeu" subtitle="S'applique aux nouvelles parties">
        <Toggle
          checked={useValue10}
          onChange={toggleValue10}
          label="Inclure les leaders valeur 10"
          description="Active Paul Muad'Dib, Baron Harkonnen, Shaddam IV, Mohiam, Liet Kynes et Edric dans le pool de leaders + traîtres. Désactivé par défaut (jeu standard)."
        />
      </Card>

      <Card title="Sauvegarde">
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" leftIcon={<Download size={14} />} onClick={exportAll}>
            Exporter tout
          </Button>
          <Button
            variant="primary"
            leftIcon={<Upload size={14} />}
            onClick={() => fileRef.current?.click()}
          >
            Importer un fichier
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImport(f);
              e.target.value = '';
            }}
          />
          <Button variant="danger" leftIcon={<RotateCcw size={14} />} onClick={resetAll}>
            Tout réinitialiser
          </Button>
        </div>
        <p className="text-[11px] text-atreides-silverMuted font-mono mt-3">
          Les données restent stockées localement dans votre navigateur. Format d&apos;export JSON
          version {EXPORT_VERSION}.
        </p>
      </Card>
    </div>
  );
};
