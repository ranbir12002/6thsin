import { Outlet } from 'react-router';
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '../components/ui/sidebar';
import AdminSidebar from './AdminSidebar';

export default function AdminLayout() {
  return (
    <SidebarProvider defaultOpen={true}>
      <AdminSidebar />
      <SidebarInset className="bg-[#0a0a0a]">
        <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-[#222] bg-[#0a0a0a]/80 backdrop-blur-sm px-4 py-2 sm:hidden">
          <SidebarTrigger className="text-[#F6F6F6]" />
          <span className="font-anton text-base text-[#F6F6F6]">6TH SIN</span>
          <span className="text-[9px] tracking-[0.15em] text-crimson uppercase font-medium bg-crimson/10 px-2 py-0.5 rounded ml-auto">
            Admin
          </span>
        </div>
        <div className="mx-auto w-full max-w-5xl p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
