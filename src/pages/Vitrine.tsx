import VitrineNav from "@/components/vitrine/VitrineNav";
import VitrineHero from "@/components/vitrine/VitrineHero";
import VitrineManifesto from "@/components/vitrine/VitrineManifesto";
import VitrineImageGrid from "@/components/vitrine/VitrineImageGrid";
import VitrineProdutos from "@/components/vitrine/VitrineProdutos";
import VitrineLoja from "@/components/vitrine/VitrineLoja";
import VitrineFooter from "@/components/vitrine/VitrineFooter";

const Vitrine = () => {
  return (
    <div className="min-h-screen bg-vitrine-bg text-vitrine-text antialiased scroll-smooth">
      <VitrineNav />
      
      <main>
        {/* Hero - Full impact */}
        <VitrineHero />
        
        {/* Manifesto - Brand story */}
        <VitrineManifesto />

        {/* Image Grid - Editorial feel */}
        <VitrineImageGrid />
        
        {/* Products - Featured collection */}
        <VitrineProdutos />
        
        {/* Store - Physical presence */}
        <VitrineLoja />
      </main>
      
      <VitrineFooter />
    </div>
  );
};

export default Vitrine;
