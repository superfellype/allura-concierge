import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import logoAllura from "@/assets/logo-allura-text.png";
import logoFlower from "@/assets/logo-allura-flower.png";

import { Boxes, Kanban } from "lucide-react";

const navItems = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Produtos", href: "/admin/produtos", icon: Package },
  { name: "Estoque", href: "/admin/estoque", icon: Boxes },
  { name: "Pedidos", href: "/admin/pedidos", icon: ShoppingCart },
  { name: "Kanban", href: "/admin/kanban", icon: Kanban },
  { name: "Clientes", href: "/admin/clientes", icon: Users },
  { name: "Configurações", href: "/admin/configuracoes", icon: Settings },
];

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

const AdminLayout = ({ children, title }: AdminLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(45_40%_97%)] via-[hsl(38_35%_95%)] to-[hsl(30_30%_93%)] noise-bg">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 liquid-glass-strong px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={logoFlower} alt="" className="h-6 w-auto" />
          <img src={logoAllura} alt="Allura" className="h-6 w-auto" />
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-foreground"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 z-40
        transform transition-transform duration-300 ease-out
        lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full liquid-glass-strong p-6 flex flex-col">
          {/* Logo */}
          <Link to="/admin" className="flex items-center gap-2 mb-10 mt-2">
            <img src={logoFlower} alt="" className="h-7 w-auto" />
            <img src={logoAllura} alt="Allura" className="h-7 w-auto" />
          </Link>

          {/* Navigation */}
          <nav className="flex-1 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`admin-nav-item ${isActive ? 'active' : ''}`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                  {isActive && (
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User & Logout */}
          <div className="pt-6 border-t border-border/30">
            <div className="mb-4 px-4">
              <p className="font-body text-xs text-muted-foreground">Logado como</p>
              <p className="font-body text-sm font-medium truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="admin-nav-item w-full text-destructive hover:text-destructive hover:bg-destructive/5"
            >
              <LogOut className="w-5 h-5" />
              Sair
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-foreground/10 backdrop-blur-sm z-30 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="lg:pl-64 pt-16 lg:pt-0 min-h-screen">
        <div className="p-6 lg:p-8">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="mb-8"
          >
            <h1 className="font-display text-3xl font-medium">{title}</h1>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
