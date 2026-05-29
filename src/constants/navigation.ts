import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

export type NavIcon = ComponentProps<typeof Ionicons>['name'];

export type NavItem = {
  label: string;
  href:
    | '/dashboard'
    | '/triages'
    | '/queues'
    | '/patients'
    | '/consultations'
    | '/follow-ups'
    | '/branches'
    | '/accounts';
  icon: NavIcon;
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

export const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Overview',
    items: [{ label: 'Dashboard', href: '/dashboard', icon: 'grid-outline' }],
  },
  {
    title: 'Clinical',
    items: [
      { label: 'Triages', href: '/triages', icon: 'medkit-outline' },
      { label: 'Queues', href: '/queues', icon: 'list-outline' },
      { label: 'Patients', href: '/patients', icon: 'people-outline' },
      { label: 'Consultations', href: '/consultations', icon: 'document-text-outline' },
      { label: 'FollowUps', href: '/follow-ups', icon: 'calendar-outline' },
    ],
  },
  {
    title: 'Organization',
    items: [
      { label: 'Branches', href: '/branches', icon: 'business-outline' },
      { label: 'Accounts', href: '/accounts', icon: 'person-circle-outline' },
    ],
  },
];

export const MAIN_NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap(section => section.items);
