import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User, ArrowRight, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logoAllura from "@/assets/logo-allura-text.png";
import logoFlower from "@/assets/logo-allura-flower.png";

const Cadastro = () => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const redirectUrl = `${window.location.origin}/`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    toast.success("Conta criada com sucesso!");
    navigate("/admin");
  };

  return (
    <div className="min-h-screen flex items-center justify-center noise-bg">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-[hsl(45_40%_97%)] via-[hsl(38_35%_95%)] to-[hsl(30_30%_93%)]" />
      <div className="fixed top-[20%] left-[10%] w-[500px] h-[500px] bg-primary/6 rounded-full blur-3xl" />
      <div className="fixed bottom-[20%] right-[10%] w-[400px] h-[400px] bg-accent/8 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md px-6"
      >
        <div className="liquid-card p-8">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <img src={logoFlower} alt="" className="h-8 w-auto" />
            <img src={logoAllura} alt="Allura" className="h-8 w-auto" />
          </div>

          <h1 className="font-display text-2xl font-medium text-center mb-2">
            Criar sua conta
          </h1>
          <p className="font-body text-sm text-muted-foreground text-center mb-8">
            Junte-se à comunidade Allura
          </p>

          <form onSubmit={handleSignUp} className="space-y-5">
            <div>
              <label className="font-body text-sm text-foreground/70 mb-1.5 block">
                Nome completo
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-3 liquid-glass rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  placeholder="Seu nome"
                />
              </div>
            </div>

            <div>
              <label className="font-body text-sm text-foreground/70 mb-1.5 block">
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-3 liquid-glass rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div>
              <label className="font-body text-sm text-foreground/70 mb-1.5 block">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-11 pr-11 py-3 liquid-glass rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  placeholder="Mínimo 6 caracteres"
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

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={loading}
              className="w-full liquid-button py-3.5 text-primary-foreground font-body font-medium flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? "Criando conta..." : "Criar conta"}
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </form>

          <p className="font-body text-sm text-muted-foreground text-center mt-6">
            Já tem conta?{" "}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Entrar
            </Link>
          </p>
        </div>

        <Link
          to="/"
          className="block text-center mt-6 font-body text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Voltar para a loja
        </Link>
      </motion.div>
    </div>
  );
};

export default Cadastro;
