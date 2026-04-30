import { motion } from "framer-motion"
import { Download, Github } from "lucide-react"
import { useRepositories } from "../hooks/useRepository"
import { Skeleton } from "../components/ui/Skeleton"

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.55, delay, ease: "easeOut" as const },
})

const projectPlaceholder = (name: string) => (
  <div className="flex aspect-[16/10] items-center justify-center bg-gradient-to-br from-[var(--surface-2)] to-[var(--surface)] p-8 text-center">
    <p className="font-mono text-2xl font-semibold tracking-tight text-[var(--text)]">{name}</p>
  </div>
)

const ProjectLoading = () => (
  <div className="space-y-10">
    {[0, 1, 2].map((index) => (
      <div key={index} className="grid gap-8 md:grid-cols-2 md:items-center">
        <div className="space-y-3">
          <Skeleton className="h-6 w-2/5" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
        <Skeleton className="aspect-[16/10] w-full" />
      </div>
    ))}
  </div>
)

export const ProjectSection = () => {
  const { isLoading, repositories, error } = useRepositories()

  return (
    <section id="projects" className="border-t border-[var(--border)] px-6 py-32">
      <div className="mx-auto max-w-5xl space-y-24">
        <motion.div {...fadeUp()} className="space-y-2 text-center">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-[var(--accent)]">Projects</p>
          <h2 className="text-3xl font-bold text-[var(--text)] md:text-4xl">Selected Work</h2>
        </motion.div>

        {isLoading ? <ProjectLoading /> : null}
        {!isLoading && error ? (
          <p className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--muted)]">
            Unable to load repositories right now: {error}
          </p>
        ) : null}

        {!isLoading &&
          !error &&
          repositories.map((repo, index) => (
            <motion.div
              key={repo.name}
              {...fadeUp(0.1)}
              className={`flex flex-col ${
                index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
              } items-center gap-10 md:gap-14`}
            >
              <div className="shrink-0 space-y-4 md:w-[58%]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-bold text-[var(--text)]">{repo.name}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{repo.description}</p>
                  </div>
                  {repo.isPrivate ? (
                    <span className="rounded-full border border-[var(--border)] px-2 py-1 text-xs font-mono text-[var(--muted)]">
                      private
                    </span>
                  ) : (
                    <a
                      href={repo.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-[var(--border)] p-2 text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--text)]"
                    >
                      <Github size={16} />
                    </a>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-[var(--muted)]">
                  {repo.stars !== undefined ? (
                    <span className="rounded-full border border-[var(--border)] px-2 py-1">★ {repo.stars}</span>
                  ) : null}
                  {repo.language ? (
                    <span className="rounded-full border border-[var(--border)] px-2 py-1">{repo.language}</span>
                  ) : null}
                  {repo.pushedAt ? (
                    <span className="rounded-full border border-[var(--border)] px-2 py-1">{repo.pushedAt}</span>
                  ) : null}
                  {repo.downloadUrl ? (
                    <a
                      href={repo.downloadUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-full border border-[var(--accent)] bg-[var(--accent-glow)] px-2 py-1 text-[var(--text)]"
                    >
                      <Download size={12} />
                      macOS
                    </a>
                  ) : null}
                  {repo.tags.map((tag) => (
                    <span key={`${repo.name}-${tag}`} className="rounded-full border border-[var(--border)] px-2 py-1">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="w-full min-w-0 flex-1">
                <div className="group relative overflow-hidden rounded-xl border border-[var(--border)]">
                  {repo.url ? (
                    <a href={repo.url} target="_blank" rel="noreferrer" className="block">
                      {repo.preview ? (
                        <img
                          src={repo.preview}
                          alt={`${repo.name} preview screenshot`}
                          loading="lazy"
                          className="aspect-[16/10] w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                        />
                      ) : (
                        projectPlaceholder(repo.name)
                      )}
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[rgba(0,0,0,0.45)] via-transparent to-transparent" />
                    </a>
                  ) : (
                    <>
                      {repo.preview ? (
                        <img
                          src={repo.preview}
                          alt={`${repo.name} preview screenshot`}
                          loading="lazy"
                          className="aspect-[16/10] w-full object-cover"
                        />
                      ) : (
                        projectPlaceholder(repo.name)
                      )}
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[rgba(0,0,0,0.45)] via-transparent to-transparent" />
                    </>
                  )}
                  {!repo.url ? (
                    <div className="absolute bottom-4 left-4 rounded-md bg-[var(--surface)] px-3 py-1 text-xs font-medium text-[var(--text)]">
                      Internal project
                    </div>
                  ) : null}
                </div>
              </div>
            </motion.div>
          ))}
      </div>
    </section>
  )
}
