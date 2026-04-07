import RoleSidebar from "./RoleSidebar";
import Topbar from "./Topbar";

interface RoleLayoutProps {
  children: React.ReactNode;
  title?: string;
  breadcrumbs?: { label: string; href?: string }[];
}

const RoleLayout = ({ children, title, breadcrumbs }: RoleLayoutProps) => (
  <div className="flex min-h-screen max-[900px]:flex-col">
    <RoleSidebar />
    <main className="ml-60 w-[calc(100%-240px)] min-h-screen max-[900px]:ml-0 max-[900px]:w-full">
      <Topbar title={title} breadcrumbs={breadcrumbs} />
      <div className="max-w-[1200px] p-8 max-[900px]:p-5">
        {children}
      </div>
    </main>
  </div>
);

export default RoleLayout;
