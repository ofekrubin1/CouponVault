import { Ticket, FolderArchive, Settings } from 'lucide-react';

/** Bottom-bar tabs and their page headers. Add a tab here + a case in AppShell. */
export const TABS = [
  { key: 'home', icon: Ticket, label: 'קופונים', eyebrow: 'הארנק המשפחתי' },
  { key: 'archive', icon: FolderArchive, label: 'ארכיון', eyebrow: 'ארכיון', title: 'מומשו ופג תוקפם' },
  { key: 'settings', icon: Settings, label: 'הגדרות', eyebrow: 'הגדרות', title: 'ניהול' },
];

export const tabMeta = (key) => TABS.find((t) => t.key === key) || TABS[0];
