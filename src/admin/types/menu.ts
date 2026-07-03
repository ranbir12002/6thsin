export interface MenuItem {
  id: string;
  label: string;
  href: string;
}

export interface NavMenuCategory {
  id: string;
  label: string;
  children: MenuItem[];
}
