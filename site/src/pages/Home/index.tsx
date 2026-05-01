import { HeroSection } from "./HeroSection";
import { ProjectSection } from "./ProjectSection";
import { FooterSection } from "./FooterSection";

export const Home = () => (
  <div className="flex-1 flex flex-col min-h-0">
    <HeroSection />
    <ProjectSection />
    <FooterSection />
  </div>
);
