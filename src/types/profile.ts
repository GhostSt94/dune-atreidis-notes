export interface Profile {
  id: string;
  pseudo: string;
  housePrefix: 'Duke' | 'Count' | 'Baron' | 'Lord' | 'Lady';
  createdAt: number;
}
