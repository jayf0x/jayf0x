import { FluidText } from "@jayf0x/fluidity-js"
import { ArrowUpRight, FileText, Github, Mail } from "lucide-react"
import type { CSSProperties } from "react"
import { Skeleton } from "./components/Skeleton"
import { useRepositories } from "./hooks/useRepository"
import type { Project } from "./types"

const SPECTRUM = ["var(--s-0)", "var(--s-1)", "var(--s-2)", "var(--s-3)"]

export const Home = () => {
  const { repositories, isLoading } = useRepositories()

  return (
    <>
      <Hero />
      <div className="divider" />
      <FluidityBanner />
      <div className="divider" />
      <ProjectsSection repositories={repositories} isLoading={isLoading} />
      <div className="divider" />
      <AboutSection />
      <div className="divider" />
      <FooterSection />
    </>
  )
}

const Hero = () => (
  <section style={{ paddingTop: 120, paddingBottom: 80 }}>
    <div className="layout">
      <div style={{ gridColumn: "1 / -1" }} className="flex items-start justify-between">
        <div>
          <h1
            style={{
              fontSize: "var(--t-xl)",
              fontWeight: 700,
              lineHeight: 1,
              margin: 0,
              color: "var(--text)",
            }}
          >
            Jonatan Vons
          </h1>
          <p
            style={{
              fontSize: "var(--t-sm)",
              color: "var(--sub)",
              marginTop: 8,
              marginBottom: 0,
              letterSpacing: "0.08em",
            }}
          >
            Frontend engineer · Ghent · BE
          </p>
        </div>
        <div className="flex items-center gap-4">
          <IconLink href="https://github.com/jayf0x" label="GitHub" external>
            <Github size={20} />
          </IconLink>
          <IconLink href="mailto:jonatanverstraete@outlook.com" label="Email">
            <Mail size={20} />
          </IconLink>
          <IconLink href="/resume.pdf" label="CV" external>
            <FileText size={20} />
          </IconLink>
        </div>
      </div>
    </div>
  </section>
)

const IconLink = ({
  href,
  label,
  external,
  children,
}: {
  href: string
  label: string
  external?: boolean
  children: React.ReactNode
}) => (
  <a
    href={href}
    target={external ? "_blank" : undefined}
    rel={external ? "noopener noreferrer" : undefined}
    aria-label={label}
    style={{ color: "var(--sub)", display: "flex", width: 20, height: 20 }}
    className="transition-colors hover:text-[var(--accent)]"
  >
    {children}
  </a>
)

const FluidityBanner = () => (
  <div
    style={{
      width: "100vw",
      height: 280,
      overflow: "hidden",
      position: "relative",
      left: "50%",
      right: "50%",
      marginLeft: "-50vw",
      marginRight: "-50vw",
    }}
  >
    <FluidText
      text="JAYF0X"
      fontSize={200}
      fontWeight={700}
      color="#e2e2e6"
      backgroundColor="#0b0b0d"
      algorithm="aurora"
      style={{ width: "100%", height: "100%" }}
    />
  </div>
)

const ProjectsSection = ({
  repositories,
  isLoading,
}: {
  repositories: Project[]
  isLoading: boolean
}) => (
  <section style={{ paddingTop: 48, paddingBottom: 48 }}>
    <div className="layout">
      <div style={{ gridColumn: "1 / -1" }}>
        {isLoading ? (
          <div className="flex flex-col" style={{ gap: 1 }}>
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : (
          repositories.map((project, i) => (
            <ProjectRow
              key={project.name}
              project={project}
              isLast={i === repositories.length - 1}
            />
          ))
        )}
      </div>
    </div>
  </section>
)

const rowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "16px 1fr 2fr 1fr 20px",
  gap: "0 24px",
  alignItems: "center",
  padding: "14px 0",
  cursor: "pointer",
}

const rowStyleMobile: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "16px 1fr 20px",
  gap: "0 16px",
  alignItems: "center",
  padding: "14px 0",
}

const ProjectRow = ({ project, isLast }: { project: Project; isLast: boolean }) => {
  const color = SPECTRUM[project.spectrumIndex] ?? "var(--sub)"

  const handleClick = () => {
    if (!project.isPrivate && project.url) {
      window.open(project.url, "_blank", "noopener,noreferrer")
    }
  }

  return (
    <div
      onClick={project.isPrivate ? undefined : handleClick}
      style={{
        borderBottom: isLast ? "none" : "1px solid var(--line)",
      }}
      className="group -mx-2 px-2 hover:bg-[var(--surface)]"
    >
      {/* Desktop */}
      <div className="hidden md:grid" style={rowStyle}>
        <Dot color={color} />
        <span style={{ fontWeight: 700, fontSize: "var(--t-md)", color, whiteSpace: "nowrap" }}>
          {project.name}
        </span>
        <span
          style={{
            fontSize: "var(--t-sm)",
            color: "var(--sub)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {project.description}
        </span>
        <span
          style={{
            fontSize: "var(--t-sm)",
            color: "var(--sub)",
            whiteSpace: "nowrap",
          }}
        >
          {project.tags.join(" · ")}
        </span>
        <LinkIndicator isPrivate={project.isPrivate} />
      </div>

      {/* Mobile */}
      <div className="grid md:hidden" style={rowStyleMobile}>
        <Dot color={color} />
        <span style={{ fontWeight: 700, fontSize: "var(--t-md)", color }}>
          {project.name}
        </span>
        <LinkIndicator isPrivate={project.isPrivate} />
      </div>
    </div>
  )
}

const Dot = ({ color }: { color: string }) => (
  <div
    style={{
      width: 8,
      height: 8,
      borderRadius: "50%",
      backgroundColor: color,
      flexShrink: 0,
    }}
  />
)

const LinkIndicator = ({ isPrivate }: { isPrivate?: boolean }) =>
  isPrivate ? (
    <span style={{ fontSize: "var(--t-md)", color: "var(--sub)" }}>—</span>
  ) : (
    <ArrowUpRight size={16} style={{ color: "var(--sub)" }} />
  )

const AboutSection = () => (
  <section style={{ paddingTop: 48, paddingBottom: 48 }}>
    <div className="layout">
      <p
        style={{
          gridColumn: "1 / -1",
          fontSize: "var(--t-md)",
          color: "var(--text)",
          lineHeight: 1.6,
          margin: 0,
        }}
      >
        Frontend engineer building interfaces where information is the design.
        I work across React, Tauri, and Swift — from WebGL simulations to native desktop applications.
        Based in Ghent, with a preference for tools that are fast, direct, and visually honest.
      </p>
    </div>
  </section>
)

const FooterSection = () => (
  <footer style={{ paddingTop: 24, paddingBottom: 24 }}>
    <div className="layout">
      <div
        style={{
          gridColumn: "1 / -1",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "var(--t-sm)",
          color: "var(--sub)",
          letterSpacing: "0.08em",
        }}
      >
        <span>Jonatan Vons · 2025 · Ghent</span>
        <div className="flex items-center gap-3">
          <a
            href="https://github.com/jayf0x"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--sub)" }}
            className="hover:text-[var(--accent)] transition-colors"
          >
            GitHub
          </a>
          <span>/</span>
          <a
            href="mailto:jonatanverstraete@outlook.com"
            style={{ color: "var(--sub)" }}
            className="hover:text-[var(--accent)] transition-colors"
          >
            Email
          </a>
        </div>
      </div>
    </div>
  </footer>
)
