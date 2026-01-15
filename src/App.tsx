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
import RedefinirSenha from "./pages/RedefinirSenha";
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
import AdminProdutoEditar from "./pages/admin/ProdutoEditar";
import Categorias from "./pages/admin/Categorias";
import Colecoes from "./pages/admin/Colecoes";
import Cupons from "./pages/admin/Cupons";
import Estoque from "./pages/admin/Estoque";
import Pedidos from "./pages/admin/Pedidos";
import NotasKanban from "./pages/admin/PedidosKanban";
import VendaManual from "./pages/admin/VendaManual";
import Clientes from "./pages/admin/Clientes";
import ClientePerfil from "./pages/admin/ClientePerfil";
import Configuracoes from "./pages/admin/Configuracoes";
import Pagamentos from "./pages/admin/Pagamentos";
import PedidoCancelado from "./pages/PedidoCancelado";
import Notas from "./pages/admin/Notas";
import Despesas from "./pages/admin/Despesas";
import Relatorios from "./pages/admin/Relatorios";
import WhatsApp from "./pages/admin/WhatsApp";

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
            <Route path="/redefinir-senha" element={<RedefinirSenha />} />
            <Route path="/carrinho" element={<Carrinho />} />
            <Route path="/produto/:slug" element={<Produto />} />
            <Route path="/produtos" element={<ProdutosLista />} />
            <Route path="/sobre" element={<Sobre />} />
            <Route path="/pedido/sucesso" element={<PedidoSucesso />} />
            <Route path="/pedido/cancelado" element={<PedidoCancelado />} />

            {/* Protected User Routes */}
            <Route path="/minha-conta" element={<ProtectedRoute><MinhaConta /></ProtectedRoute>} />
            <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />

            {/* Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute requireAdmin><Dashboard /></ProtectedRoute>} />
            <Route path="/admin/produtos" element={<ProtectedRoute requireAdmin><AdminProdutos /></ProtectedRoute>} />
            <Route path="/admin/produtos/novo" element={<ProtectedRoute requireAdmin><AdminProdutoEditar /></ProtectedRoute>} />
            <Route path="/admin/produtos/:id" element={<ProtectedRoute requireAdmin><AdminProdutoEditar /></ProtectedRoute>} />
            <Route path="/admin/categorias" element={<ProtectedRoute requireAdmin><Categorias /></ProtectedRoute>} />
            <Route path="/admin/colecoes" element={<ProtectedRoute requireAdmin><Colecoes /></ProtectedRoute>} />
            <Route path="/admin/cupons" element={<ProtectedRoute requireAdmin><Cupons /></ProtectedRoute>} />
            <Route path="/admin/estoque" element={<ProtectedRoute requireAdmin><Estoque /></ProtectedRoute>} />
            <Route path="/admin/pedidos" element={<ProtectedRoute requireAdmin><Pedidos /></ProtectedRoute>} />
            <Route path="/admin/kanban" element={<ProtectedRoute requireAdmin><NotasKanban /></ProtectedRoute>} />
            <Route path="/admin/venda-manual" element={<ProtectedRoute requireAdmin><VendaManual /></ProtectedRoute>} />
            <Route path="/admin/clientes" element={<ProtectedRoute requireAdmin><Clientes /></ProtectedRoute>} />
            <Route path="/admin/clientes/:id" element={<ProtectedRoute requireAdmin><ClientePerfil /></ProtectedRoute>} />
            <Route path="/admin/pagamentos" element={<ProtectedRoute requireAdmin><Pagamentos /></ProtectedRoute>} />
            <Route path="/admin/configuracoes" element={<ProtectedRoute requireAdmin><Configuracoes /></ProtectedRoute>} />
            <Route path="/admin/notas" element={<ProtectedRoute requireAdmin><Notas /></ProtectedRoute>} />
            <Route path="/admin/despesas" element={<ProtectedRoute requireAdmin><Despesas /></ProtectedRoute>} />
            <Route path="/admin/relatorios" element={<ProtectedRoute requireAdmin><Relatorios /></ProtectedRoute>} />
            <Route path="/admin/whatsapp" element={<ProtectedRoute requireAdmin><WhatsApp /></ProtectedRoute>} />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
