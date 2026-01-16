import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, ArrowLeft, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import BenefitsSection from "@/components/BenefitsSection";
import FeaturedProducts from "@/components/FeaturedProducts";
import Footer from "@/components/Footer";

export default function Preview() {
  const [isDraft, setIsDraft] = useState(false);
  const [draftData, setDraftData] = useState<any>(null);

  useEffect(() => {
    // Check if we have draft data in localStorage
    const storedDraft = localStorage.getItem("editor-draft");
    if (storedDraft) {
      try {
        setDraftData(JSON.parse(storedDraft));
        setIsDraft(true);
      } catch (e) {
        console.error("Error parsing draft:", e);
      }
    }
  }, []);

  return (
    <div className="relative min-h-screen">
      {/* Preview Banner */}
      {isDraft && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-amber-950 py-2 px-4"
        >
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">
                PREVIEW - NÃO PUBLICADO
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/admin/editor-tema">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs bg-white/20 border-amber-950/30 hover:bg-white/30"
                >
                  <ArrowLeft className="w-3 h-3 mr-1" />
                  Voltar ao Editor
                </Button>
              </Link>
              <Link to="/" target="_blank">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs bg-white/20 border-amber-950/30 hover:bg-white/30"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Ver Site Publicado
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      )}

      {/* Add top padding when preview banner is shown */}
      <div className={isDraft ? "pt-10" : ""}>
        <Navbar />
        <main>
          <HeroSection />
          <BenefitsSection />
          <FeaturedProducts />
        </main>
        <Footer />
      </div>
    </div>
  );
}
