"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { ArrowRight, Calendar, Tag, Search } from "lucide-react"
import { Input } from "@/components/ui/input"

const notes = [
  {
    id: 1,
    title: "Ten years of Codexero: from Blogger to GitHub",
    excerpt:
      "Looking back at a personal blog called Codexero that's been posting random ideas since the late 2000s, and what changed once the real work moved over to GitHub.",
    content:
      "A reflection on running a personal blog since the 2000s, why it went quiet for years at a stretch, and how GitHub quietly became the new home for the same hobby...",
    date: "Sep 2020",
    category: "musings",
    tags: ["blogging", "reflection", "open source"],
    color: "from-indigo-500/20 to-purple-500/20",
    readTime: "5 min",
  },
  {
    id: 2,
    title: "A free, ad-free school bell timer",
    excerpt:
      "How a coworker's frustration with trial bell software turned into a free weekend build for sounding a school's intercom on a schedule.",
    content: "Full walkthrough of building a free Windows bell-timer app for a school intercom system, from picking a scheduling approach to packaging it for non-technical staff...",
    date: "Sep 2020",
    category: "systems",
    tags: ["Python", "Windows", "Education"],
    color: "from-orange-500/20 to-amber-500/20",
    readTime: "6 min",
  },
  {
    id: 3,
    title: "Bringing Thaana script into an Electron app",
    excerpt:
      "Notes on getting ligature-heavy Dhivehi (Thaana) text rendering cleanly inside an Electron desktop app built for government staff.",
    content: "A practical look at font bundling, ligature shaping, and right-to-left-adjacent quirks when adding Dhivehi support to an Electron and Node desktop app...",
    date: "May 2026",
    category: "frontend",
    tags: ["Electron", "i18n", "Dhivehi"],
    color: "from-primary/20 to-emerald-500/20",
    readTime: "9 min",
  },
  {
    id: 4,
    title: "Offline-first document generation with docx and xlsx",
    excerpt:
      "How template placeholders get auto-computed and weekday or date logic gets handled when generating Word and Excel documents entirely offline.",
    content: "How template placeholders get auto-computed, hidden fields get derived, and weekday and date logic gets handled when generating .docx and .xlsx documents without an internet connection...",
    date: "Jun 2026",
    category: "systems",
    tags: ["Node.js", "docx", "Templates"],
    color: "from-blue-500/20 to-cyan-500/20",
    readTime: "10 min",
  },
  {
    id: 5,
    title: "Self-hosting Snips for voice control on Home Assistant",
    excerpt:
      "Getting an offline voice assistant talking to Home Assistant on amd64 hardware, so commands never have to leave the house.",
    content: "Step-by-step notes on packaging Snips as a Home Assistant add-on, wiring up intents, and keeping voice data off the cloud...",
    date: "Oct 2019",
    category: "automation",
    tags: ["Home Assistant", "Snips", "Hass.io"],
    color: "from-cyan-500/20 to-blue-500/20",
    readTime: "8 min",
  },
  {
    id: 6,
    title: "Tapping into TikTok LIVE's realtime stream with Dart",
    excerpt:
      "A look at building a Dart client for TikTok LIVE's realtime comment and gift stream, and what it takes to keep a long-lived connection alive.",
    content: "Notes from porting TikTok LIVE's realtime event protocol to Dart, handling reconnects, and parsing gift and comment payloads...",
    date: "Feb 2024",
    category: "frontend",
    tags: ["Dart", "Realtime", "TikTok API"],
    color: "from-red-500/20 to-orange-500/20",
    readTime: "7 min",
  },
]

const categories = ["all", "frontend", "systems", "automation", "musings"]
const allTags = [...new Set(notes.flatMap((n) => n.tags))]

export function NotesPageContent() {
  const [activeCategory, setActiveCategory] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [expandedNote, setExpandedNote] = useState<number | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const filteredNotes = notes.filter((n) => {
    const matchesCategory = activeCategory === "all" || n.category === activeCategory
    const matchesSearch =
      searchQuery === "" ||
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTags = selectedTags.length === 0 || selectedTags.some((tag) => n.tags.includes(tag))
    return matchesCategory && matchesSearch && matchesTags
  })

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  return (
    <section className="px-4 sm:px-6 py-12 sm:py-20">
      <div className="mx-auto max-w-7xl">
        {/* Hero */}
        <div className={cn("mb-12 sm:mb-16 space-y-4 opacity-0", isVisible && "animate-fade-in-up")}>
          <p className="font-mono text-xs uppercase tracking-[0.25em] sm:tracking-[0.35em] text-primary">Field Notes</p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">Lab Notes</h1>
          <p className="max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
            Brief observations, technical findings, and thoughts from the workbench. Documentation of the learning
            journey.
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-4">
          {/* Sidebar */}
          <div className={cn("lg:col-span-1 space-y-6 opacity-0", isVisible && "animate-fade-in-up stagger-2")}>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-card/40 border-border/60 focus:border-primary/50"
              />
            </div>

            {/* Categories */}
            <div className="rounded-xl border border-border bg-card/40 glass p-5">
              <h3 className="font-mono text-xs uppercase tracking-wider text-primary mb-4">Categories</h3>
              <div className="flex flex-col gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={cn(
                      "text-left px-3 py-2 rounded-lg font-mono text-xs uppercase tracking-wider transition-all duration-200",
                      activeCategory === category
                        ? "bg-primary/15 text-primary border border-primary/30"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
                    )}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div className="rounded-xl border border-border bg-card/40 glass p-5">
              <h3 className="font-mono text-xs uppercase tracking-wider text-primary mb-4 flex items-center gap-2">
                <Tag className="h-3.5 w-3.5" />
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={cn(
                      "rounded-md border px-2.5 py-1 font-mono text-xs transition-all duration-200",
                      selectedTags.includes(tag)
                        ? "border-primary/50 bg-primary/10 text-primary"
                        : "border-border/60 bg-secondary/40 text-muted-foreground hover:border-primary/30 hover:text-foreground",
                    )}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Notes Grid */}
          <div className="lg:col-span-3">
            <div className="grid gap-5 md:grid-cols-2">
              {filteredNotes.map((note, index) => (
                <article
                  key={note.id}
                  className={cn(
                    "group relative cursor-pointer overflow-hidden rounded-xl border border-border bg-card/40 glass p-6 sm:p-7 transition-all duration-400 hover:border-primary/40 hover:bg-card/60 active:scale-[0.99] hover-lift opacity-0",
                    isVisible && "animate-fade-in-up",
                    expandedNote === note.id && "border-primary/50 bg-card/70",
                  )}
                  style={{ animationDelay: `${index * 80 + 200}ms` }}
                  onClick={() => setExpandedNote(expandedNote === note.id ? null : note.id)}
                >
                  <div
                    className={cn(
                      "absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-500 group-hover:opacity-100",
                      note.color,
                    )}
                  />

                  <div className="relative z-10">
                    <div className="mb-4 sm:mb-5 flex items-center justify-between gap-3">
                      <span className="rounded-lg border border-border/80 bg-secondary/60 px-3 py-1.5 font-mono text-xs text-muted-foreground transition-colors group-hover:border-primary/50 group-hover:text-foreground">
                        {note.category}
                      </span>
                      <div className="flex items-center gap-3 font-mono text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {note.date}
                        </span>
                        <span>{note.readTime}</span>
                      </div>
                    </div>

                    <h3 className="mb-3 text-lg sm:text-xl font-semibold tracking-tight transition-colors duration-300 group-hover:text-gradient">
                      {note.title}
                    </h3>

                    <p className="text-sm leading-relaxed text-muted-foreground mb-4">{note.excerpt}</p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {note.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-md border border-border/60 bg-secondary/40 px-2 py-0.5 font-mono text-[10px] text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 font-mono text-xs text-primary transition-all duration-300 sm:opacity-0 sm:translate-x-[-8px] group-hover:opacity-100 group-hover:translate-x-0">
                      <span>read more</span>
                      <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                    </div>
                  </div>

                  <div className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-primary to-transparent transition-all duration-500 group-hover:w-full" />
                </article>
              ))}
            </div>

            {filteredNotes.length === 0 && (
              <div className="text-center py-20">
                <p className="font-mono text-sm text-muted-foreground">No notes found matching your criteria.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
