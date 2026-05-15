import RoleSidebar from "./RoleSidebar";
import Topbar from "./Topbar";
import InternalPageHeader from "@/components/shared/InternalPageHeader";
import ScrollToTop from "@/components/shared/ScrollToTop";
import { SidebarProvider } from "./SidebarContext";

interface RoleLayoutProps {
  children: React.ReactNode;
  title?: string;
  breadcrumbs?: { label: string; href?: string }[];
}

const RoleLayout = ({ children, title, breadcrumbs }: RoleLayoutProps) => (
  <SidebarProvider>
    <div className="flex min-h-screen">
      <RoleSidebar />
      <main className="flex-1 min-w-0 min-h-screen bg-background pt-14 lg:ml-60">
        <Topbar title={title} breadcrumbs={breadcrumbs} />
        <div className="max-w-[1200px] p-4 sm:p-6 lg:p-8">
          <InternalPageHeader breadcrumbs={breadcrumbs} />
          {children}
        </div>
        <ScrollToTop />
      </main>
    </div>
  </SidebarProvider>
);

export default RoleLayout;
