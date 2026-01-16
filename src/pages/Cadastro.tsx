import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { 
  ArrowRight, 
  ArrowLeft, 
  User, 
  Mail, 
  Lock, 
  Phone, 
  Camera,
  Check,
  Sparkles,
  CreditCard,
  Calendar
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logoAllura from "@/assets/logo-allura-text.png";
import logoFlower from "@/assets/logo-allura-flower.png";

type OnboardingStep = 
  | "welcome" 
  | "identity" 
  | "contact" 
  | "style" 
  | "occasions" 
  | "security" 
  | "complete";

interface FormData {
  fullName: string;
  pronoun: string;
  avatarFile: File | null;
  avatarPreview: string;
  email: string;
  whatsapp: string;
  cpf: string;
  birthDate: string;
  whatsappOptIn: boolean;
  stylePreferences: string[];
  occasions: string[];
  password: string;
  confirmPassword: string;
}

const STEPS: OnboardingStep[] = [
  "welcome",
  "identity", 
  "contact",
  "style",
  "occasions",
  "security",
  "complete"
];

const STYLE_OPTIONS = [
  { id: "classico", label: "Clássico", emoji: "🎩" },
  { id: "minimalista", label: "Minimalista", emoji: "◻️" },
  { id: "sofisticado", label: "Sofisticado", emoji: "✨" },
  { id: "criativo", label: "Criativo", emoji: "🎨" },
  { id: "atemporal", label: "Atemporal", emoji: "⏳" },
];

const OCCASION_OPTIONS = [
  { id: "trabalho", label: "Trabalho", emoji: "💼" },
  { id: "eventos", label: "Eventos", emoji: "🥂" },
  { id: "dia-a-dia", label: "Dia a dia", emoji: "☀️" },
  { id: "viagens", label: "Viagens", emoji: "✈️" },
  { id: "presentes", label: "Presentes", emoji: "🎁" },
];

const Cadastro = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("welcome");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    pronoun: "",
    avatarFile: null,
    avatarPreview: "",
    email: "",
    whatsapp: "",
    cpf: "",
    birthDate: "",
    whatsappOptIn: false,
    stylePreferences: [],
    occasions: [],
    password: "",
    confirmPassword: "",
  });

  const currentStepIndex = STEPS.indexOf(currentStep);
  const progress = ((currentStepIndex) / (STEPS.length - 1)) * 100;

  const goToStep = (step: OnboardingStep) => {
    setCurrentStep(step);
  };

  const nextStep = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex]);
    }
  };

  const prevStep = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex]);
    }
  };

  const updateForm = (updates: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const toggleStylePreference = (id: string) => {
    setFormData(prev => ({
      ...prev,
      stylePreferences: prev.stylePreferences.includes(id)
        ? prev.stylePreferences.filter(s => s !== id)
        : [...prev.stylePreferences, id]
    }));
  };

  const toggleOccasion = (id: string) => {
    setFormData(prev => ({
      ...prev,
      occasions: prev.occasions.includes(id)
        ? prev.occasions.filter(o => o !== id)
        : [...prev.occasions, id]
    }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        updateForm({ 
          avatarFile: file, 
          avatarPreview: e.target?.result as string 
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const formatWhatsapp = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 2) return `(${numbers}`;
    if (numbers.length <= 3) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 3)} ${numbers.slice(3)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 3)} ${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  const formatCpf = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
  };

  const formatBirthDate = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 4) return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
    return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
  };

  const handleSignUp = async () => {
    if (formData.password !== formData.confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    if (formData.password.length < 8) {
      toast.error("A senha deve ter no mínimo 8 caracteres");
      return;
    }

    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/`;

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: formData.fullName,
          },
        },
      });

      if (authError) throw authError;

      // Upload avatar if provided
      let avatarUrl = null;
      if (formData.avatarFile && authData.user) {
        const fileExt = formData.avatarFile.name.split('.').pop();
        const fileName = `${authData.user.id}/avatar.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, formData.avatarFile, { upsert: true });

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);
          avatarUrl = urlData.publicUrl;
        }
      }

      // Update profile with all preferences
      if (authData.user) {
        // Parse birth date from DD/MM/YYYY to YYYY-MM-DD
        let birthDateFormatted = null;
        if (formData.birthDate && formData.birthDate.length === 10) {
          const [day, month, year] = formData.birthDate.split('/');
          birthDateFormatted = `${year}-${month}-${day}`;
        }

        const { error: profileError } = await supabase.from('profiles').upsert(
          {
            user_id: authData.user.id,
            full_name: formData.fullName,
            phone: formData.whatsapp.replace(/\D/g, ""),
            avatar_url: avatarUrl,
            preferences: {
              pronoun: formData.pronoun,
              style_preferences: formData.stylePreferences,
              occasions: formData.occasions,
              whatsapp_opt_in: formData.whatsappOptIn,
              cpf: formData.cpf.replace(/\D/g, ""),
              birth_date: birthDateFormatted,
            }
          },
          { onConflict: 'user_id' }
        );
        
        if (profileError) {
          console.error('Profile update error:', profileError);
        }
      }

      nextStep(); // Go to complete step
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  };

  const handleEnterAllura = () => {
    navigate("/");
  };

  const slideVariants = {
    enter: { opacity: 0, y: 20 },
    center: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  return (
    <div className="min-h-screen flex items-center justify-center noise-bg overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-[hsl(45_40%_97%)] via-[hsl(38_35%_95%)] to-[hsl(30_30%_93%)]" />
      <div className="fixed top-[10%] left-[5%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl animate-morph" />
      <div className="fixed bottom-[10%] right-[5%] w-[500px] h-[500px] bg-accent/8 rounded-full blur-3xl animate-morph" style={{ animationDelay: "-4s" }} />
      <div className="fixed top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-cream-200/30 to-transparent rounded-full blur-2xl" />

      {/* Progress Bar */}
      {currentStep !== "welcome" && currentStep !== "complete" && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-border/30 z-50">
          <motion.div 
            className="h-full bg-gradient-to-r from-primary to-primary/80"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      )}

      <div className="relative z-10 w-full max-w-lg px-6 py-12">
        <AnimatePresence mode="wait">
          {/* STEP: WELCOME */}
          {currentStep === "welcome" && (
            <motion.div
              key="welcome"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="text-center"
            >
              <div className="liquid-card p-12 mb-8">
                <motion.div 
                  className="flex items-center justify-center gap-3 mb-10"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                >
                  <img src={logoFlower} alt="" className="h-12 w-auto" />
                  <img src={logoAllura} alt="Allura" className="h-10 w-auto" />
                </motion.div>

                <motion.h1 
                  className="font-display text-4xl font-medium text-foreground mb-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  Bem-vinda à Allura.
                </motion.h1>

                <motion.p 
                  className="font-body text-lg text-muted-foreground mb-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  Vamos criar sua experiência.
                </motion.p>

                <motion.p 
                  className="font-body text-sm text-muted-foreground/70"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                >
                  Leva menos de 1 minuto.
                </motion.p>
              </div>

              <motion.button
                onClick={nextStep}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="liquid-button w-full py-4 text-primary-foreground font-body font-medium flex items-center justify-center gap-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                Começar
                <ArrowRight className="w-4 h-4" />
              </motion.button>

              <motion.p 
                className="font-body text-sm text-muted-foreground text-center mt-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.5 }}
              >
                Já tem conta?{" "}
                <Link to="/login" className="text-primary hover:underline font-medium">
                  Entrar
                </Link>
              </motion.p>
            </motion.div>
          )}

          {/* STEP: IDENTITY */}
          {currentStep === "identity" && (
            <motion.div
              key="identity"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="liquid-card p-8">
                <StepHeader 
                  step={1}
                  totalSteps={5}
                  onBack={prevStep}
                />

                <div className="space-y-6 mt-8">
                  {/* Avatar Upload */}
                  <div className="flex flex-col items-center mb-8">
                    <label className="relative cursor-pointer group">
                      <div className="w-24 h-24 rounded-full liquid-glass flex items-center justify-center overflow-hidden border-2 border-dashed border-border/50 group-hover:border-primary/50 transition-colors">
                        {formData.avatarPreview ? (
                          <img 
                            src={formData.avatarPreview} 
                            alt="Avatar" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Camera className="w-8 h-8 text-muted-foreground/50 group-hover:text-primary/70 transition-colors" />
                        )}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                      <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg">
                        <Camera className="w-4 h-4 text-primary-foreground" />
                      </div>
                    </label>
                    <p className="font-body text-xs text-muted-foreground mt-3 text-center max-w-[200px]">
                      Uma imagem sua deixa sua experiência ainda mais pessoal.
                    </p>
                  </div>

                  {/* Name Field */}
                  <div>
                    <label className="font-body text-sm text-foreground/70 mb-1.5 block">
                      Como podemos te chamar?
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => updateForm({ fullName: e.target.value })}
                        className="w-full pl-11 pr-4 py-3.5 liquid-glass rounded-2xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                        placeholder="Seu nome"
                      />
                    </div>
                  </div>

                  {/* Pronoun Selection */}
                  <div>
                    <label className="font-body text-sm text-foreground/70 mb-3 block">
                      Como prefere ser tratada?
                    </label>
                    <div className="flex gap-3">
                      {[
                        { id: "ela", label: "Ela" },
                        { id: "ele", label: "Ele" },
                        { id: "neutro", label: "Prefiro não informar" },
                      ].map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => updateForm({ pronoun: option.id })}
                          className={`flex-1 py-3 px-4 rounded-xl font-body text-sm transition-all ${
                            formData.pronoun === option.id
                              ? "liquid-glass bg-primary/10 ring-2 ring-primary/30 text-foreground"
                              : "liquid-glass hover:bg-secondary/50 text-muted-foreground"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={nextStep}
                  disabled={!formData.fullName}
                  className="w-full liquid-button py-4 mt-8 text-primary-foreground font-body font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continuar
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP: CONTACT */}
          {currentStep === "contact" && (
            <motion.div
              key="contact"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="liquid-card p-8">
                <StepHeader 
                  step={2}
                  totalSteps={5}
                  onBack={prevStep}
                />

                <div className="space-y-6 mt-8">
                  {/* Email Field */}
                  <div>
                    <label className="font-body text-sm text-foreground/70 mb-1.5 block">
                      Seu e-mail
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => updateForm({ email: e.target.value })}
                        className="w-full pl-11 pr-4 py-3.5 liquid-glass rounded-2xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                        placeholder="seu@email.com"
                      />
                    </div>
                    <p className="font-body text-xs text-muted-foreground mt-2">
                      Para acompanhar pedidos e novidades exclusivas.
                    </p>
                  </div>

                  {/* WhatsApp Field */}
                  <div>
                    <label className="font-body text-sm text-foreground/70 mb-1.5 block">
                      WhatsApp
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="tel"
                        value={formData.whatsapp}
                        onChange={(e) => updateForm({ whatsapp: formatWhatsapp(e.target.value) })}
                        className="w-full pl-11 pr-4 py-3.5 liquid-glass rounded-2xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                        placeholder="(DDD) 9 xxxx-xxxx"
                        maxLength={18}
                      />
                    </div>
                  </div>

                  {/* CPF Field */}
                  <div>
                    <label className="font-body text-sm text-foreground/70 mb-1.5 block">
                      CPF
                    </label>
                    <div className="relative">
                      <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        value={formData.cpf}
                        onChange={(e) => updateForm({ cpf: formatCpf(e.target.value) })}
                        className="w-full pl-11 pr-4 py-3.5 liquid-glass rounded-2xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                        placeholder="000.000.000-00"
                        maxLength={14}
                      />
                    </div>
                  </div>

                  {/* Birth Date Field */}
                  <div>
                    <label className="font-body text-sm text-foreground/70 mb-1.5 block">
                      Data de Nascimento
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        value={formData.birthDate}
                        onChange={(e) => updateForm({ birthDate: formatBirthDate(e.target.value) })}
                        className="w-full pl-11 pr-4 py-3.5 liquid-glass rounded-2xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                        placeholder="DD/MM/AAAA"
                        maxLength={10}
                      />
                    </div>
                    <p className="font-body text-xs text-muted-foreground mt-2">
                      Para enviarmos um presente especial no seu dia! 🎂
                    </p>
                  </div>

                  {/* WhatsApp Opt-in */}
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div 
                      className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                        formData.whatsappOptIn 
                          ? "bg-primary" 
                          : "liquid-glass group-hover:bg-secondary/50"
                      }`}
                      onClick={() => updateForm({ whatsappOptIn: !formData.whatsappOptIn })}
                    >
                      {formData.whatsappOptIn && (
                        <Check className="w-3 h-3 text-primary-foreground" />
                      )}
                    </div>
                    <div>
                      <span className="font-body text-sm text-foreground">
                        Receber novidades da Allura no WhatsApp
                      </span>
                      <p className="font-body text-xs text-muted-foreground mt-1">
                        Prometemos escrever pouco e com intenção.
                      </p>
                    </div>
                  </label>
                </div>

                <button
                  onClick={nextStep}
                  disabled={!formData.email}
                  className="w-full liquid-button py-4 mt-8 text-primary-foreground font-body font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continuar
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP: STYLE */}
          {currentStep === "style" && (
            <motion.div
              key="style"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="liquid-card p-8">
                <StepHeader 
                  step={3}
                  totalSteps={5}
                  onBack={prevStep}
                />

                <div className="mt-8">
                  <h2 className="font-display text-2xl font-medium text-foreground mb-2">
                    Seu estilo
                  </h2>
                  <p className="font-body text-sm text-muted-foreground mb-6">
                    O que mais combina com você?
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    {STYLE_OPTIONS.map((style, index) => (
                      <motion.button
                        key={style.id}
                        type="button"
                        onClick={() => toggleStylePreference(style.id)}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`p-4 rounded-2xl font-body text-sm transition-all text-left ${
                          formData.stylePreferences.includes(style.id)
                            ? "liquid-glass bg-primary/10 ring-2 ring-primary/40"
                            : "liquid-glass hover:bg-secondary/50"
                        }`}
                      >
                        <span className="text-lg mb-1 block">{style.emoji}</span>
                        <span className={formData.stylePreferences.includes(style.id) ? "text-foreground" : "text-muted-foreground"}>
                          {style.label}
                        </span>
                      </motion.button>
                    ))}
                  </div>

                  <p className="font-body text-xs text-muted-foreground mt-4 text-center">
                    Usamos isso para sugerir peças com mais precisão.
                  </p>
                </div>

                <button
                  onClick={nextStep}
                  className="w-full liquid-button py-4 mt-8 text-primary-foreground font-body font-medium flex items-center justify-center gap-2"
                >
                  Continuar
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP: OCCASIONS */}
          {currentStep === "occasions" && (
            <motion.div
              key="occasions"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="liquid-card p-8">
                <StepHeader 
                  step={4}
                  totalSteps={5}
                  onBack={prevStep}
                />

                <div className="mt-8">
                  <h2 className="font-display text-2xl font-medium text-foreground mb-2">
                    Momentos
                  </h2>
                  <p className="font-body text-sm text-muted-foreground mb-6">
                    Em quais ocasiões você mais usa bolsas?
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    {OCCASION_OPTIONS.map((occasion, index) => (
                      <motion.button
                        key={occasion.id}
                        type="button"
                        onClick={() => toggleOccasion(occasion.id)}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`p-4 rounded-2xl font-body text-sm transition-all text-left ${
                          formData.occasions.includes(occasion.id)
                            ? "liquid-glass bg-primary/10 ring-2 ring-primary/40"
                            : "liquid-glass hover:bg-secondary/50"
                        }`}
                      >
                        <span className="text-lg mb-1 block">{occasion.emoji}</span>
                        <span className={formData.occasions.includes(occasion.id) ? "text-foreground" : "text-muted-foreground"}>
                          {occasion.label}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={nextStep}
                  className="w-full liquid-button py-4 mt-8 text-primary-foreground font-body font-medium flex items-center justify-center gap-2"
                >
                  Continuar
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP: SECURITY */}
          {currentStep === "security" && (
            <motion.div
              key="security"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="liquid-card p-8">
                <StepHeader 
                  step={5}
                  totalSteps={5}
                  onBack={prevStep}
                />

                <div className="space-y-6 mt-8">
                  {/* Password Field */}
                  <div>
                    <label className="font-body text-sm text-foreground/70 mb-1.5 block">
                      Crie uma senha
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => updateForm({ password: e.target.value })}
                        className="w-full pl-11 pr-4 py-3.5 liquid-glass rounded-2xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                        placeholder="••••••••"
                      />
                    </div>
                    <p className="font-body text-xs text-muted-foreground mt-2">
                      Mínimo de 8 caracteres.
                    </p>
                  </div>

                  {/* Confirm Password Field */}
                  <div>
                    <label className="font-body text-sm text-foreground/70 mb-1.5 block">
                      Confirmar senha
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => updateForm({ confirmPassword: e.target.value })}
                        className="w-full pl-11 pr-4 py-3.5 liquid-glass rounded-2xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                        placeholder="••••••••"
                      />
                    </div>
                    {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                      <p className="font-body text-xs text-destructive mt-2">
                        As senhas não coincidem.
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleSignUp}
                  disabled={loading || !formData.password || formData.password !== formData.confirmPassword || formData.password.length < 8}
                  className="w-full liquid-button py-4 mt-8 text-primary-foreground font-body font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Criando sua conta..." : "Finalizar cadastro"}
                  {!loading && <ArrowRight className="w-4 h-4" />}
                </button>

                <p className="font-body text-xs text-muted-foreground text-center mt-6">
                  Ao continuar, você concorda com nossos{" "}
                  <Link to="/termos" className="text-primary hover:underline">
                    Termos
                  </Link>{" "}
                  e{" "}
                  <Link to="/privacidade" className="text-primary hover:underline">
                    Política de Privacidade
                  </Link>.
                </p>
              </div>
            </motion.div>
          )}

          {/* STEP: COMPLETE */}
          {currentStep === "complete" && (
            <motion.div
              key="complete"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="text-center"
            >
              <div className="liquid-card p-12">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mx-auto mb-8 shadow-glow"
                >
                  <Sparkles className="w-10 h-10 text-primary-foreground" />
                </motion.div>

                <motion.h1 
                  className="font-display text-4xl font-medium text-foreground mb-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  Pronto.
                </motion.h1>

                <motion.p 
                  className="font-body text-lg text-muted-foreground mb-8"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  Sua experiência Allura começa agora.
                </motion.p>

                <motion.button
                  onClick={handleEnterAllura}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="liquid-button w-full py-4 text-primary-foreground font-body font-medium flex items-center justify-center gap-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  Entrar na Allura
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <motion.p 
          className="font-body text-xs text-muted-foreground/60 text-center mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          Allura — Design que flui com você.
        </motion.p>
      </div>
    </div>
  );
};

// Step Header Component
const StepHeader = ({ 
  step, 
  totalSteps, 
  onBack 
}: { 
  step: number; 
  totalSteps: number; 
  onBack: () => void; 
}) => (
  <div className="flex items-center justify-between">
    <button
      onClick={onBack}
      className="w-10 h-10 rounded-full liquid-glass flex items-center justify-center hover:bg-secondary/50 transition-colors"
    >
      <ArrowLeft className="w-4 h-4 text-muted-foreground" />
    </button>
    <span className="font-body text-xs text-muted-foreground">
      {step} de {totalSteps}
    </span>
  </div>
);

export default Cadastro;
