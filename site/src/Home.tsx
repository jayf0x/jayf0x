import { HeroSection } from "./sections/HeroSection";
import { ProjectSection } from "./sections/ProjectSection";
import { FooterSection } from "./sections/FooterSection";

export const Home = () => (
  <div className="flex-1 flex flex-col min-h-0">
    <HeroSection />
    <ProjectSection />
    <FooterSection />
  </div>
);
