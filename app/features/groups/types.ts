export type Member = {
  initials: string;
  name: string;
  phone: string;
  scans: number;
};

export type Group = {
  balance: number;
  id: number;
  isOwner: boolean;
  members: Member[];
  name: string;
  providerMix: Array<{ label: string; value: number }>;
  revenueToday: number;
  successRate: number;
  todayScans: number;
};
