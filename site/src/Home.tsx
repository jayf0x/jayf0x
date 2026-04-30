import { HeroSection } from "./sections/HeroSection"
import { ProjectSection } from "./sections/ProjectSection"
import { FooterSection } from "./sections/FooterSection"
import { Navigation } from "./components/Navigation"

export const Home = () => {
  return (
    <>
      <Navigation />
      <div className="w-fit m-auto" style={{
        backdropFilter: 'blur(15px) brightness(0.2)'
      }}>
        <HeroSection />
        <ProjectSection />
        <FooterSection />
      </div>

    </>
  )
}
