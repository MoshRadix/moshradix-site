import { BlogHero } from "@/components/public/blog/blog-hero";
import { BlogList } from "@/components/public/blog/blog-list";
import { BlogSidebar } from "@/components/public/blog/blog-sidebar";
import type { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://moshradix.dev';

export const metadata: Metadata = {
  title: "Blog",
  description: "Articles, experiments, and field notes from the digital workshop. Offline-first software, home automation, and life in the Maldives.",
  openGraph: {
    title: "Blog — MOSHRADIX",
    description: "Articles, experiments, and field notes from the digital workshop.",
    url: `${baseUrl}/blog`,
    type: "website",
    images: [
      {
        url: `${baseUrl}/og-image-blog.png`,
        width: 1200,
        height: 630,
        alt: "MOSHRADIX Blog",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog — MOSHRADIX",
    description: "Articles, experiments, and field notes from the digital workshop.",
    images: [`${baseUrl}/og-image-blog.png`],
  },
  alternates: {
    canonical: `${baseUrl}/blog`,
  },
};

export default function BlogPage() {
  return (
    <div>
      <BlogHero />
      <section className="px-4 sm:px-6 py-16 sm:py-20 border-t border-border/30">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-[1fr_320px]">
            <BlogList />
            <BlogSidebar />
          </div>
        </div>
      </section>
    </div>
  );
}
