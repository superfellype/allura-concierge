import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Lock, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getUserFriendlyError, safeLogError } from "@/lib/error-utils";
import logoAllura from "@/assets/logo-allura.png";

const RedefinirSenha = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const canSubmit = useMemo(() => {
    return password.length >= 8 && password === confirmPassword;
  }, [password, confirmPassword]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      // Quando o usuário abre o link de recovery, a sessão normalmente já existe.
      setReady(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      toast.error("Preencha os campos");
      return;
    }

    if (password.length < 8) {
      toast.error("A senha deve ter pelo menos 8 caracteres");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("As senhas não conferem");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      toast.success("Senha atualizada com sucesso!");
      await supabase.auth.signOut();
      navigate("/login");
    } catch (error: unknown) {
      safeLogError("RedefinirSenha", error);
      toast.error(getUserFriendlyError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center noise-bg overflow-hidden">
      <div className="fixed inset-0 bg-gradient-to-br from-[hsl(45_40%_97%)] via-[hsl(38_35%_95%)] to-[hsl(30_30%_93%)]" />
      <div className="fixed top-[12%] left-[8%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl animate-morph" />
      <div className="fixed bottom-[12%] right-[8%] w-[520px] h-[520px] bg-accent/8 rounded-full blur-3xl animate-morph" style={{ animationDelay: "-4s" }} />

      <motion.main
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10 px-6"
      >
        <section className="liquid-glass-card p-8">
          <header className="text-center mb-8">
            <Link to="/">
              <img src={logoAllura} alt="Allura" className="h-12 mx-auto mb-6" />
            </Link>
            <h1 className="text-2xl font-serif">Redefinir senha</h1>
          </header>

          {!ready ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 rounded-full bg-amber-100/70 dark:bg-amber-900/20 flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                <ShieldAlert className="w-6 h-6 text-amber-700" />
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Abra este link pelo email de recuperação para continuar.
              </p>
              <Link to="/recuperar-senha" className="glass-btn inline-flex items-center gap-2 px-6 py-3">
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Link>
            </div>
          ) : (
            <>
              <p className="text-center text-muted-foreground text-sm mb-6">
                Crie uma nova senha para sua conta.
              </p>

              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Nova senha"
                      className="w-full pl-12 pr-4 py-3.5 glass-input rounded-xl"
                      autoComplete="new-password"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirmar nova senha"
                      className="w-full pl-12 pr-4 py-3.5 glass-input rounded-xl"
                      autoComplete="new-password"
                      required
                    />
                  </div>
                </div>

                <motion.button
                  type="submit"
                  disabled={loading || !canSubmit}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full glass-btn py-3.5 disabled:opacity-50"
                >
                  {loading ? "Salvando..." : "Atualizar senha"}
                </motion.button>

                <div className="pt-2 text-center">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Ir para o login
                  </Link>
                </div>
              </form>
            </>
          )}
        </section>
      </motion.main>
    </div>
  );
};

export default RedefinirSenha;
