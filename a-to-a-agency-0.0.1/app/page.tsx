import HeroSection from "./components/HeroSection";
import ServicesSection from "./components/ServicesSection";
import ProcessSection from "./components/ProcessSection";
import ComplianceSection from "./components/ComplianceSection";
import DashboardPreview from "./components/DashboardPreview";
import ContactSection from "./components/ContactSection";

export default function HomePage() {
  return (
    <div>
      <HeroSection />
      <ServicesSection />
      <ProcessSection />
      <DashboardPreview />
      <ComplianceSection />
      <ContactSection />
    </div>
  );
}
