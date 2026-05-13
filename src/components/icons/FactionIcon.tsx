import type { SVGProps } from 'react';
import type { FactionId } from '@/types/faction';
import { AtreidesIcon } from './factions/AtreidesIcon';
import { HarkonnenIcon } from './factions/HarkonnenIcon';
import { EmperorIcon } from './factions/EmperorIcon';
import { FremenIcon } from './factions/FremenIcon';
import { GuildIcon } from './factions/GuildIcon';
import { BeneGesseritIcon } from './factions/BeneGesseritIcon';

interface FactionIconProps extends Omit<SVGProps<SVGSVGElement>, 'id'> {
  faction: FactionId;
  size?: number;
}

const map = {
  atreides: AtreidesIcon,
  harkonnen: HarkonnenIcon,
  emperor: EmperorIcon,
  fremen: FremenIcon,
  guild: GuildIcon,
  bene_gesserit: BeneGesseritIcon,
} as const;

export const FactionIcon = ({ faction, size = 20, ...rest }: FactionIconProps) => {
  const Icon = map[faction];
  return <Icon width={size} height={size} {...rest} />;
};

export {
  AtreidesIcon,
  HarkonnenIcon,
  EmperorIcon,
  FremenIcon,
  GuildIcon,
  BeneGesseritIcon,
};
