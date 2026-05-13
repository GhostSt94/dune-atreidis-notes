import type { Leader, FactionId } from '@/types/faction';

type LeaderSeed = Omit<Leader, 'id' | 'alive'>;

const seed: Record<FactionId, LeaderSeed[]> = {
  atreides: [
    { name: 'Dr. Yueh', factionId: 'atreides', value: 1, portrait: '/leaders/atreides/dr-yueh.jpg' },
    { name: 'Duncan Idaho', factionId: 'atreides', value: 2, portrait: '/leaders/atreides/duncan-idaho.jpg' },
    { name: 'Gurney Halleck', factionId: 'atreides', value: 4, portrait: '/leaders/atreides/gurney-halleck.jpg' },
    { name: 'Thufir Hawat', factionId: 'atreides', value: 5, portrait: '/leaders/atreides/thufir-hawat.jpg' },
    { name: 'Lady Jessica', factionId: 'atreides', value: 5, portrait: '/leaders/atreides/lady-jessica.jpg' },
    { name: "Paul Muad'Dib", factionId: 'atreides', value: 10, portrait: '/leaders/atreides/paul-muaddib.jpg' },
  ],
  harkonnen: [
    { name: 'Umman Kudu', factionId: 'harkonnen', value: 1, portrait: '/leaders/harkonnen/umman-kudu.jpg' },
    { name: 'Captain Iakin Nefud', factionId: 'harkonnen', value: 3, portrait: '/leaders/harkonnen/captain-iakin-nefud.jpg' },
    { name: 'Piter de Vries', factionId: 'harkonnen', value: 3, portrait: '/leaders/harkonnen/piter-de-vries.jpg' },
    { name: 'Beast Rabban', factionId: 'harkonnen', value: 4, portrait: '/leaders/harkonnen/beast-rabban.jpg' },
    { name: 'Feyd-Rautha', factionId: 'harkonnen', value: 6, portrait: '/leaders/harkonnen/feyd-rautha.jpg' },
    { name: 'Baron Harkonnen', factionId: 'harkonnen', value: 10, portrait: '/leaders/harkonnen/baron-harkonnen.jpg' },
  ],
  emperor: [
    { name: 'Bashar', factionId: 'emperor', value: 2, portrait: '/leaders/emperor/bashar.jpg' },
    { name: 'Burseg', factionId: 'emperor', value: 3, portrait: '/leaders/emperor/burseg.jpg' },
    { name: 'Caid', factionId: 'emperor', value: 5, portrait: '/leaders/emperor/caid.jpg' },
    { name: 'Captain Aramsham', factionId: 'emperor', value: 5, portrait: '/leaders/emperor/captain-aramsham.jpg' },
    { name: 'Hasimir Fenring', factionId: 'emperor', value: 6, portrait: '/leaders/emperor/hasimir-fenring.jpg' },
    { name: 'Emperor Shaddam IV', factionId: 'emperor', value: 10, portrait: '/leaders/emperor/emperor-shaddam-iv.jpg' },
  ],
  fremen: [
    { name: 'Jamis', factionId: 'fremen', value: 2, portrait: '/leaders/fremen/jamis.jpg' },
    { name: 'Shadout Mapes', factionId: 'fremen', value: 3, portrait: '/leaders/fremen/shadout-mapes.jpg' },
    { name: 'Otheym', factionId: 'fremen', value: 5, portrait: '/leaders/fremen/otheym.jpg' },
    { name: 'Chani', factionId: 'fremen', value: 6, portrait: '/leaders/fremen/chani.jpg' },
    { name: 'Stilgar', factionId: 'fremen', value: 7, portrait: '/leaders/fremen/stilgar.jpg' },
    { name: 'Liet Kynes', factionId: 'fremen', value: 10, portrait: '/leaders/fremen/liet-kynes.jpg' },
  ],
  guild: [
    { name: 'Guild Rep', factionId: 'guild', value: 1, portrait: '/leaders/guild/guild-rep.jpg' },
    { name: 'Guild Ambassador', factionId: 'guild', value: 3, portrait: '/leaders/guild/guild-ambassador.jpg' },
    { name: 'Esmar Tuek', factionId: 'guild', value: 3, portrait: '/leaders/guild/esmar-tuek.jpg' },
    { name: 'Staban Tuek', factionId: 'guild', value: 5, portrait: '/leaders/guild/staban-tuek.jpg' },
    { name: 'Master Bewt', factionId: 'guild', value: 6, portrait: '/leaders/guild/master-bewt.jpg' },
    { name: 'Edric', factionId: 'guild', value: 10, portrait: '/leaders/guild/edric.jpg' },
  ],
  bene_gesserit: [
    { name: 'Alia', factionId: 'bene_gesserit', value: 5, portrait: '/leaders/bene_gesserit/alia.jpg' },
    { name: 'Wanna Marcus', factionId: 'bene_gesserit', value: 5, portrait: '/leaders/bene_gesserit/wanna-marcus.jpg' },
    { name: 'Princess Irulan', factionId: 'bene_gesserit', value: 5, portrait: '/leaders/bene_gesserit/princess-irulan.jpg' },
    { name: 'Margot Lady Fenring', factionId: 'bene_gesserit', value: 5, portrait: '/leaders/bene_gesserit/margot-lady-fenring.jpg' },
    { name: 'Mother Ramallo', factionId: 'bene_gesserit', value: 5, portrait: '/leaders/bene_gesserit/mother-ramallo.jpg' },
    { name: 'Mother Mohiam', factionId: 'bene_gesserit', value: 10, portrait: '/leaders/bene_gesserit/mother-mohiam.jpg' },
  ],
};

export const buildLeadersFor = (faction: FactionId, makeId: () => string): Leader[] =>
  seed[faction].map((l) => ({ ...l, id: makeId(), alive: true }));

export const LEADER_SEED = seed;

export const findLeaderSeed = (
  factionId: FactionId,
  name: string,
): LeaderSeed | undefined => seed[factionId].find((l) => l.name === name);
