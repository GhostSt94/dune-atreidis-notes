export const now = (): number => Date.now();

export const formatDate = (ts: number): string => {
  const d = new Date(ts);
  return d.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
};

export const formatTime = (ts: number): string => {
  const d = new Date(ts);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};

export const formatDateTime = (ts: number): string => `${formatDate(ts)} ${formatTime(ts)}`;

export const relativeTime = (ts: number): string => {
  const diff = Date.now() - ts;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'à l\'instant';
  const min = Math.floor(sec / 60);
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const days = Math.floor(h / 24);
  return `il y a ${days} j`;
};
