import { HeroSection } from "./sections/HeroSection"
import { ProjectSection } from "./sections/ProjectSection"
import { FooterSection } from "./sections/FooterSection"
import { useRepositories } from "./hooks/useRepository"
import { Navigation } from "./components/Navigation"

const sectionIds = ["hero", "about", "projects", "resume", "contact"]

export const Home = () => {
  const { featured } = useRepositories()

  return (
    <>
      <Navigation sectionIds={sectionIds} />
      <HeroSection featured={featured} />
      <ProjectSection />
      <FooterSection />
    </>
  )
}
