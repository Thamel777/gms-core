export interface SidebarProps {
  onNavigate: (page: string) => void;
  currentPage: string;
  onLogout: () => void;
  userRole?: string;
}

export interface SidebarItem {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}

export interface SidebarConfig {
  title: string;
  subtitle: string;
  items: SidebarItem[];
  logoIcon: React.ReactNode;
}