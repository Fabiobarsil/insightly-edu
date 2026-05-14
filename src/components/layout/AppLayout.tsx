import RoleSidebar from "./RoleSidebar";
import Topbar from "./Topbar";
import InternalPageHeader from "@/components/shared/InternalPageHeader";
import ScrollToTop from "@/components/shared/ScrollToTop";

interface AppLayoutProps {
  children: React.ReactNode;
  title: string;
  breadcrumbs?: { label: string; href?: string }[];
}

const AppLayout = ({ children, title, breadcrumbs }: AppLayoutProps) => (
  <div className="flex min-h-screen max-[900px]:flex-col">
    <RoleSidebar />
    <main className="ml-60 w-[calc(100%-240px)] min-h-screen bg-background rounded-l-2xl max-[900px]:ml-0 max-[900px]:w-full max-[900px]:rounded-none">
      <Topbar title={title} breadcrumbs={breadcrumbs} />
      <div className="max-w-[1200px] p-8 max-[900px]:p-5">
        <InternalPageHeader breadcrumbs={breadcrumbs} />
        {children}
      </div>
      <ScrollToTop />
    </main>
  </div>
);

export default AppLayout;
