import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Github, Scale } from "lucide-react"
import { getProjectBySlug } from "@/lib/project-data"

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://moshradix.dev"

interface ProjectLegalPageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: ProjectLegalPageProps): Promise<Metadata> {
  const { slug } = await params
  const project = getProjectBySlug(slug)

  if (!project) {
    return {
      title: "Terms not found",
    }
  }

  return {
    title: `${project.title} Terms of Service`,
    description: `Terms of Service for ${project.title}.`,
    alternates: {
      canonical: `${baseUrl}/projects/${project.slug}/terms`,
    },
    openGraph: {
      title: `${project.title} Terms of Service - MOSHRADIX`,
      description: `Terms of Service for ${project.title}.`,
      url: `${baseUrl}/projects/${project.slug}/terms`,
      type: "article",
    },
  }
}

export default async function ProjectTermsPage({ params }: ProjectLegalPageProps) {
  const { slug } = await params
  const project = getProjectBySlug(slug)

  if (!project) {
    notFound()
  }

  const sections = project.legalTerms ?? project.terms

  return (
    <article className="px-4 sm:px-6 pt-28 sm:pt-36 pb-20 sm:pb-28">
      <div className="mx-auto max-w-4xl">
        <Link
          href={`/projects/${project.slug}`}
          className="mb-8 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          {project.title}
        </Link>

        <header className="mb-12 space-y-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-primary/40 bg-primary/10 text-primary">
            <Scale className="h-5 w-5" />
          </div>
          <div className="space-y-4">
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-primary">Legal</p>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{project.title} Terms of Service</h1>
            {project.effectiveDate && (
              <p className="font-mono text-sm text-muted-foreground">Effective date: {project.effectiveDate}</p>
            )}
          </div>
          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 font-mono text-xs text-muted-foreground transition-colors hover:text-primary"
          >
            <Github className="h-4 w-4" />
            source repository
          </a>
        </header>

        <div className="space-y-8">
          {sections.map((section, index) => (
            <section
              key={section.heading}
              className="rounded-xl border border-border/60 bg-card/40 glass p-6 sm:p-7 animate-fade-in-up"
              style={{ animationDelay: `${index * 40}ms` }}
            >
              <h2 className="mb-4 font-mono text-sm uppercase tracking-widest text-foreground">{section.heading}</h2>
              <ul className="space-y-3">
                {section.points.map((point) => (
                  <li key={point} className="flex gap-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </article>
  )
}
