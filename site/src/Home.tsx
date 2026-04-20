import { HeroSection } from "./sections/HeroSection"
import { AboutSection } from "./sections/AboutSection"
import { ProjectSection } from "./sections/ProjectSection"
import { ResumeSection } from "./sections/ResumeSection"
import { FooterSection } from "./sections/FooterSection"
import { useRepositories } from "./hooks/useRepository"
import { Navigation } from "./components/layout/Navigation"

const sectionIds = ["hero", "about", "projects", "resume", "contact"]

export const Home = () => {
  const { featured } = useRepositories()

  return (
    <>
      <Navigation sectionIds={sectionIds} />
      <HeroSection featured={featured} />
      <AboutSection />
      <ProjectSection />
      <ResumeSection />
      <FooterSection />
    </>
  )
}
