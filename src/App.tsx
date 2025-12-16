import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";

// Pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import RecuperarSenha from "./pages/RecuperarSenha";
import Carrinho from "./pages/Carrinho";
import Checkout from "./pages/Checkout";
import Produto from "./pages/Produto";
import ProdutosLista from "./pages/Produtos";
import Sobre from "./pages/Sobre";
import PedidoSucesso from "./pages/PedidoSucesso";
import MinhaConta from "./pages/MinhaConta";
import NotFound from "./pages/NotFound";

// Admin Pages
import Dashboard from "./pages/admin/Dashboard";
import AdminProdutos from "./pages/admin/Produtos";
import Pedidos from "./pages/admin/Pedidos";
import Clientes from "./pages/admin/Clientes";
import Configuracoes from "./pages/admin/Configuracoes";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Cadastro />} />
            <Route path="/recuperar-senha" element={<RecuperarSenha />} />
            <Route path="/carrinho" element={<Carrinho />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/produto/:slug" element={<Produto />} />
            <Route path="/produtos" element={<ProdutosLista />} />
            <Route path="/sobre" element={<Sobre />} />
            <Route path="/pedido/sucesso" element={<PedidoSucesso />} />
            <Route path="/minha-conta" element={<MinhaConta />} />

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/produtos"
              element={
                <ProtectedRoute>
                  <AdminProdutos />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/pedidos"
              element={
                <ProtectedRoute>
                  <Pedidos />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/clientes"
              element={
                <ProtectedRoute>
                  <Clientes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/configuracoes"
              element={
                <ProtectedRoute>
                  <Configuracoes />
                </ProtectedRoute>
              }
            />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
