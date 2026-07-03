import { NavLink } from 'react-router';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from '../components/ui/sidebar';
import {
  LayoutDashboard,
  FileText,
  Package,
  Plus,
  Menu,
} from 'lucide-react';

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/frontpage', icon: FileText, label: 'Frontpage', end: false },
  { to: '/admin/menu', icon: Menu, label: 'Menu', end: false },
  { to: '/admin/products', icon: Package, label: 'Products', end: false },
  { to: '/admin/products/new', icon: Plus, label: 'Add Product', end: false },
];

export default function AdminSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-3">
          <span className="font-anton text-xl tracking-wider text-[#F6F6F6]">6TH SIN</span>
          <span className="text-[10px] tracking-[0.15em] text-crimson uppercase font-medium bg-crimson/10 px-2 py-0.5 rounded">
            Admin
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map(item => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton asChild tooltip={item.label}>
                    <NavLink to={item.to} end={item.end}>
                      <item.icon className="size-4" />
                      <span>{item.label}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <NavLink
          to="/"
          className="text-xs text-[rgba(246,246,246,0.4)] hover:text-crimson transition-colors"
        >
          &larr; Back to site
        </NavLink>
      </SidebarFooter>
    </Sidebar>
  );
}
