import type { Metadata } from "next"
import type React from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ArrowLeft,
  ArrowUpRight,
  FileText,
  GitFork,
  Github,
  Scale,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { getProjectBySlug, projects } from "@/lib/project-data"

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://moshradix.dev"

interface ProjectPageProps {
  params: Promise<{
    slug: string
  }>
}

export function generateStaticParams() {
  return projects.map((project) => ({
    slug: project.slug,
  }))
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params
  const project = getProjectBySlug(slug)

  if (!project) {
    return {
      title: "Project not found",
    }
  }

  return {
    title: project.title,
    description: project.summary,
    openGraph: {
      title: `${project.title} - MOSHRADIX`,
      description: project.summary,
      url: `${baseUrl}/projects/${project.slug}`,
      type: "article",
      images: [
        {
          url: `${baseUrl}/og-image-projects.png`,
          width: 1200,
          height: 630,
          alt: `${project.title} project detail`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${project.title} - MOSHRADIX`,
      description: project.summary,
      images: [`${baseUrl}/og-image-projects.png`],
    },
    alternates: {
      canonical: `${baseUrl}/projects/${project.slug}`,
    },
  }
}

export default async function ProjectDetailPage({ params }: ProjectPageProps) {
  const { slug } = await params
  const project = getProjectBySlug(slug)

  if (!project) {
    notFound()
  }

  return (
    <article className="px-4 sm:px-6 pt-28 sm:pt-36 pb-20 sm:pb-28">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/projects"
          className="mb-8 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Projects
        </Link>

        <header className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-wrap items-center gap-3">
              {project.highlight && (
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/15 px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-wider text-primary animate-pulse-glow">
                  <Sparkles className="h-3.5 w-3.5" />
                  Featured
                </span>
              )}
              <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-secondary/50 px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    project.status === "shipped" && "bg-primary shadow-sm shadow-primary/50",
                    project.status === "in-progress" && "bg-yellow-500 animate-pulse shadow-sm shadow-yellow-500/50",
                    project.status === "archived" && "bg-muted-foreground",
                  )}
                />
                {project.status}
              </span>
              <span className="font-mono text-xs text-muted-foreground">{project.year}</span>
            </div>

            <div className="space-y-5">
              <p className="font-mono text-xs uppercase tracking-[0.25em] sm:tracking-[0.35em] text-primary">
                Artifact Detail
              </p>
              <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                {project.title}
              </h1>
              <p className="max-w-3xl text-base sm:text-lg leading-relaxed text-muted-foreground">
                {project.summary}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md border border-border/80 bg-secondary/60 px-2.5 py-1 font-mono text-xs text-secondary-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <aside className="rounded-xl border border-border/60 bg-card/40 glass p-6 animate-scale-in stagger-2">
            <div className="mb-5 flex items-center justify-between border-b border-border/60 pb-4">
              <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Project Signal</span>
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            </div>
            <dl className="grid grid-cols-2 gap-4 font-mono text-xs">
              <div className="rounded-lg border border-border/60 bg-secondary/30 p-3">
                <dt className="text-muted-foreground">stars</dt>
                <dd className="mt-2 flex items-center gap-2 text-foreground">
                  <Star className="h-3.5 w-3.5 text-yellow-500" />
                  {project.stars}
                </dd>
              </div>
              <div className="rounded-lg border border-border/60 bg-secondary/30 p-3">
                <dt className="text-muted-foreground">forks</dt>
                <dd className="mt-2 flex items-center gap-2 text-foreground">
                  <GitFork className="h-3.5 w-3.5" />
                  {project.forks}
                </dd>
              </div>
            </dl>
            <div className="mt-5 flex flex-col gap-3">
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center justify-center gap-3 rounded-lg border border-primary bg-primary/10 px-5 py-3 font-mono text-sm text-primary transition-all duration-300 hover:bg-primary hover:text-primary-foreground"
              >
                <Github className="h-4 w-4" />
                source repository
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
              {project.homepage && (
                <a
                  href={project.homepage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center justify-center gap-3 rounded-lg border border-border px-5 py-3 font-mono text-sm text-muted-foreground transition-all duration-300 hover:border-primary/50 hover:text-primary hover:bg-secondary/50"
                >
                  live project
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </a>
              )}
            </div>
          </aside>
        </header>

        <section className="mt-14 sm:mt-20 grid gap-5 lg:grid-cols-3">
          {project.details.map((section, index) => (
            <div
              key={section.title}
              className="rounded-xl border border-border/60 bg-card/40 glass p-6 sm:p-7 opacity-0 animate-fade-in-up"
              style={{ animationDelay: `${index * 100 + 200}ms` }}
            >
              <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-lg border border-primary/40 bg-primary/10 text-primary">
                <FileText className="h-4 w-4" />
              </div>
              <h2 className="mb-3 text-xl font-bold tracking-tight">{section.title}</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">{section.body}</p>
            </div>
          ))}
        </section>

        <section className="mt-14 sm:mt-20 grid gap-8 lg:grid-cols-2">
          <PolicyPanel
            eyebrow="Terms"
            title="Terms of Service"
            icon={<Scale className="h-4 w-4" />}
            sections={project.terms}
          />
          <PolicyPanel
            eyebrow="Privacy"
            title="Privacy Policy"
            icon={<ShieldCheck className="h-4 w-4" />}
            sections={project.privacy}
          />
        </section>
      </div>
    </article>
  )
}

function PolicyPanel({
  eyebrow,
  title,
  icon,
  sections,
}: {
  eyebrow: string
  title: string
  icon: React.ReactNode
  sections: {
    heading: string
    points: string[]
  }[]
}) {
  return (
    <section className="rounded-xl border border-border/60 bg-card/40 glass p-6 sm:p-7 animate-fade-in-up stagger-3">
      <div className="mb-6 flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/40 bg-primary/10 text-primary">
          {icon}
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-primary">{eyebrow}</p>
          <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        </div>
      </div>

      <div className="space-y-6">
        {sections.map((section) => (
          <div key={section.heading} className="border-t border-border/60 pt-5 first:border-t-0 first:pt-0">
            <h3 className="mb-3 font-mono text-xs uppercase tracking-widest text-foreground">{section.heading}</h3>
            <ul className="space-y-3">
              {section.points.map((point) => (
                <li key={point} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
