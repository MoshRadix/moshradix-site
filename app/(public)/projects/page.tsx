import { ProjectsPageContent } from "@/components/public/projects/projects-page-content";
import type { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://moshradix.dev';

export const metadata: Metadata = {
  title: "Projects",
  description: "Open source tools and experiments, from offline-first desktop apps to Home Assistant add-ons. Browse the code.",
  keywords: ["open source", "projects", "electron", "home automation", "offline-first"],
  openGraph: {
    title: "Projects — MOSHRADIX",
    description: "Explore open source projects, experiments, and tools.",
    url: `${baseUrl}/projects`,
    type: "website",
    images: [
      {
        url: `${baseUrl}/og-image-projects.png`,
        width: 1200,
        height: 630,
        alt: "MOSHRADIX Projects",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Projects — MOSHRADIX",
    description: "Explore open source projects, experiments, and tools.",
    images: [`${baseUrl}/og-image-projects.png`],
  },
  alternates: {
    canonical: `${baseUrl}/projects`,
  },
};

export default function ProjectsPage() {
  return (
    <div className="pt-24">
      <ProjectsPageContent />
    </div>
  );
}
