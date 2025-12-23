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
  Boxes,
  Kanban,
  FolderTree,
  Sparkles,
  Ticket,
  PlusCircle,
  DollarSign,
  BarChart3,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import logoAllura from "@/assets/logo-allura-text.png";
import logoFlower from "@/assets/logo-allura-flower.png";

const navGroups = [
  {
    label: "Principal",
    items: [
      { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { name: "Venda Manual", href: "/admin/venda-manual", icon: PlusCircle },
    ],
  },
  {
    label: "Catálogo",
    items: [
      { name: "Produtos", href: "/admin/produtos", icon: Package },
      { name: "Categorias", href: "/admin/categorias", icon: FolderTree },
      { name: "Coleções", href: "/admin/colecoes", icon: Sparkles },
      { name: "Estoque", href: "/admin/estoque", icon: Boxes },
    ],
  },
  {
    label: "Vendas",
    items: [
      { name: "Pedidos", href: "/admin/pedidos", icon: ShoppingCart },
      { name: "Kanban", href: "/admin/kanban", icon: Kanban },
      { name: "Cupons", href: "/admin/cupons", icon: Ticket },
    ],
  },
  {
    label: "Clientes",
    items: [
      { name: "Clientes", href: "/admin/clientes", icon: Users },
    ],
  },
  {
    label: "Sistema",
    items: [
      { name: "Configurações", href: "/admin/configuracoes", icon: Settings },
    ],
  },
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
    <div className="min-h-screen bg-gradient-to-br from-[hsl(30_25%_97%)] via-[hsl(35_30%_95%)] to-[hsl(25_20%_93%)] noise-bg">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 liquid-glass-strong px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={logoFlower} alt="" className="h-6 w-auto" />
          <img src={logoAllura} alt="Allura" className="h-6 w-auto" />
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-foreground glass-button rounded-xl"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-72 z-40
        transform transition-transform duration-300 ease-out
        lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full liquid-glass-strong p-6 flex flex-col overflow-y-auto">
          {/* Logo */}
          <Link to="/admin" className="flex items-center gap-2 mb-8 mt-2">
            <img src={logoFlower} alt="" className="h-8 w-auto" />
            <img src={logoAllura} alt="Allura" className="h-8 w-auto" />
          </Link>

          {/* Navigation Groups */}
          <nav className="flex-1 space-y-6">
            {navGroups.map((group) => (
              <div key={group.label}>
                <p className="px-4 mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground/60">
                  {group.label}
                </p>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`admin-nav-item ${isActive ? 'active' : ''}`}
                      >
                        <item.icon className="w-5 h-5" />
                        <span className="flex-1">{item.name}</span>
                        {isActive && (
                          <ChevronRight className="w-4 h-4 opacity-50" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* User & Logout */}
          <div className="pt-6 mt-6 border-t border-border/20">
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
            className="fixed inset-0 modal-overlay z-30 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="lg:pl-72 pt-16 lg:pt-0 min-h-screen">
        <div className="p-6 lg:p-8">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="mb-8"
          >
            <h1 className="font-display text-3xl font-medium tracking-tight">{title}</h1>
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
