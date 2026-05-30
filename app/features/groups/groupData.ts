import type { Group, Member } from "./types";

export const members: Member[] = [
  { initials: "AB", name: "Abebe B.", phone: "+251 91 234 5678", scans: 18 },
  { initials: "SK", name: "Selam K.", phone: "+251 98 765 4321", scans: 11 },
  { initials: "MT", name: "Miki T.", phone: "+251 92 112 9044", scans: 7 },
];

export const initialGroups: Group[] = [
  {
    balance: 2450,
    id: 1,
    isOwner: true,
    members,
    name: "Resto-A Group",
    providerMix: [
      { label: "Telebirr", value: 58 },
      { label: "CBE", value: 31 },
      { label: "M-Pesa", value: 11 },
    ],
    revenueToday: 12500,
    successRate: 98,
    todayScans: 36,
  },
  {
    balance: 0,
    id: 2,
    isOwner: false,
    members: [{ initials: "EL", name: "Ethio Lounge", phone: "+251 90 000 1122", scans: 4 }],
    name: "Ethio Lounge Team",
    providerMix: [
      { label: "Telebirr", value: 72 },
      { label: "CBE", value: 28 },
    ],
    revenueToday: 1800,
    successRate: 94,
    todayScans: 4,
  },
];
