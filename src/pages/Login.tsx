import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { getUserFriendlyError, safeLogError } from "@/lib/error-utils";
import logoAllura from "@/assets/logo-allura-text.png";
import logoFlower from "@/assets/logo-allura-flower.png";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || "/";

  useEffect(() => {
    if (user && !authLoading) {
      if (isAdmin) {
        navigate("/admin");
      } else {
        navigate(from);
      }
    }
  }, [user, isAdmin, authLoading, navigate, from]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        safeLogError('Login', error);
        toast.error(getUserFriendlyError(error));
        return;
      }

      toast.success("Bem-vinda de volta!");
    } catch (error: unknown) {
      safeLogError('Login', error);
      toast.error(getUserFriendlyError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center noise-bg overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-[hsl(var(--cream-100))] via-[hsl(var(--cream-200))] to-[hsl(var(--cream-300))]" />
      <div className="fixed top-[15%] right-[10%] w-[500px] h-[500px] bg-primary/8 rounded-full blur-3xl animate-morph" />
      <div className="fixed bottom-[15%] left-[10%] w-[400px] h-[400px] bg-accent/10 rounded-full blur-3xl animate-morph" style={{ animationDelay: "-3s" }} />
      <div className="fixed top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-cream-200/40 to-transparent rounded-full blur-2xl" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md px-6"
      >
        <div className="liquid-glass-card p-10">
          {/* Logo */}
          <Link to="/" className="flex items-center justify-center gap-3 mb-10">
            <img src={logoFlower} alt="" className="h-10 w-auto" />
            <img src={logoAllura} alt="Allura" className="h-9 w-auto" />
          </Link>

          <h1 className="font-display text-3xl font-medium text-center mb-2">
            Bem-vinda de volta
          </h1>
          <p className="font-body text-sm text-muted-foreground text-center mb-10">
            Entre para acessar sua conta
          </p>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="font-body text-sm text-foreground/70 mb-2 block">
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-4 glass-input rounded-2xl font-body text-sm"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div>
              <label className="font-body text-sm text-foreground/70 mb-2 block">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-12 pr-12 py-4 glass-input rounded-2xl font-body text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link
                to="/recuperar-senha"
                className="font-body text-xs text-primary hover:underline"
              >
                Esqueceu sua senha?
              </Link>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={loading}
              className="w-full glass-btn py-4 text-primary-foreground font-body font-medium flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? "Entrando..." : "Entrar"}
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </form>

          <p className="font-body text-sm text-muted-foreground text-center mt-8">
            Não tem conta?{" "}
            <Link to="/cadastro" className="text-primary hover:underline font-medium">
              Criar conta
            </Link>
          </p>
        </div>

        <Link
          to="/"
          className="block text-center mt-8 font-body text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Voltar para a loja
        </Link>
      </motion.div>
    </div>
  );
};

export default Login;