import type { FactionId } from './faction';

export type AlertSeverity = 'info' | 'warning' | 'danger' | 'critical';
export type AlertSource = 'ai' | 'rule' | 'manual';

export interface Alert {
  id: string;
  gameId: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  source: AlertSource;
  factionsInvolved: FactionId[];
  dismissed: boolean;
  createdAt: number;
}
