import type { ElementType } from 'react';

export type Role = 'admin' | 'superadmin' | 'manager' | 'editor';

interface BaseNavItem {
  id: number;
  title: string;
  icon?: ElementType;
  role: Role | Role[];
}

// Interface for items with direct paths
export interface NavLinkItem extends BaseNavItem {
  path: string;
  subNav?: never; // Ensure subNav doesn't exist in this type
}

// Interface for dropdown menu items
export interface NavGroupItem extends BaseNavItem {
  path?: never; // Ensure path doesn't exist in this type
  subNav: NavSubItem[];
}

// Combined type
export type NavItem = NavLinkItem | NavGroupItem;

export interface NavSubItem {
  id: number;
  title: string;
    icon?: ElementType;
  path: string;
  role: Role | Role[];
}
