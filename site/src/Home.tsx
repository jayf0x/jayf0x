import { HeroSection } from "./sections/HeroSection";
import { ProjectSection } from "./sections/ProjectSection";
import { FooterSection } from "./sections/FooterSection";
import { useIsMobile } from "./hooks/useIsMobile";

export const Home = () => {
  const isMobile = useIsMobile();

  return (
    <div
      className={isMobile ? "w-full" : "min-w-[60%] w-fit m-auto"}
      style={{
        backdropFilter: "blur(15px) brightness(0.2)",
      }}
    >
      <HeroSection />
      <ProjectSection />
      <FooterSection />
    </div>
  );
};
