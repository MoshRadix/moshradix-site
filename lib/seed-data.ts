// Seed data extracted from the original static page content. Used by
// lib/db.ts to populate the database the first time it is queried.

export const notesSeed = [
  {
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
    title: "A free, ad-free school bell timer",
    excerpt:
      "How a coworker's frustration with trial bell software turned into a free weekend build for sounding a school's intercom on a schedule.",
    content:
      "Full walkthrough of building a free Windows bell-timer app for a school intercom system, from picking a scheduling approach to packaging it for non-technical staff...",
    date: "Sep 2020",
    category: "systems",
    tags: ["Python", "Windows", "Education"],
    color: "from-orange-500/20 to-amber-500/20",
    readTime: "6 min",
  },
  {
    title: "Bringing Thaana script into an Electron app",
    excerpt:
      "Notes on getting ligature-heavy Dhivehi (Thaana) text rendering cleanly inside an Electron desktop app built for government staff.",
    content:
      "A practical look at font bundling, ligature shaping, and right-to-left-adjacent quirks when adding Dhivehi support to an Electron and Node desktop app...",
    date: "May 2026",
    category: "frontend",
    tags: ["Electron", "i18n", "Dhivehi"],
    color: "from-primary/20 to-emerald-500/20",
    readTime: "9 min",
  },
  {
    title: "Offline-first document generation with docx and xlsx",
    excerpt:
      "How template placeholders get auto-computed and weekday or date logic gets handled when generating Word and Excel documents entirely offline.",
    content:
      "How template placeholders get auto-computed, hidden fields get derived, and weekday and date logic gets handled when generating .docx and .xlsx documents without an internet connection...",
    date: "Jun 2026",
    category: "systems",
    tags: ["Node.js", "docx", "Templates"],
    color: "from-blue-500/20 to-cyan-500/20",
    readTime: "10 min",
  },
  {
    title: "Self-hosting Snips for voice control on Home Assistant",
    excerpt:
      "Getting an offline voice assistant talking to Home Assistant on amd64 hardware, so commands never have to leave the house.",
    content:
      "Step-by-step notes on packaging Snips as a Home Assistant add-on, wiring up intents, and keeping voice data off the cloud...",
    date: "Oct 2019",
    category: "automation",
    tags: ["Home Assistant", "Snips", "Hass.io"],
    color: "from-cyan-500/20 to-blue-500/20",
    readTime: "8 min",
  },
  {
    title: "Tapping into TikTok LIVE's realtime stream with Dart",
    excerpt:
      "A look at building a Dart client for TikTok LIVE's realtime comment and gift stream, and what it takes to keep a long-lived connection alive.",
    content:
      "Notes from porting TikTok LIVE's realtime event protocol to Dart, handling reconnects, and parsing gift and comment payloads...",
    date: "Feb 2024",
    category: "frontend",
    tags: ["Dart", "Realtime", "TikTok API"],
    color: "from-red-500/20 to-orange-500/20",
    readTime: "7 min",
  },
]

export const projectsSeed = [
  {
    title: "MTO Samugaa",
    description:
      "A bilingual (English & Dhivehi), offline-first desktop suite for Addu City Council's Municipal Technical Office — bundling document generation, task tracking, and staff logging into one fast Electron app.",
    tags: ["Electron", "JavaScript", "Offline-first", "Dhivehi i18n"],
    status: "in-progress",
    year: "2026",
    stars: 0,
    forks: 0,
    url: "https://github.com/MoshRadix/mosh-samugaa-app",
    homepage: null,
    featured: true,
    highlight: true,
  },
  {
    title: "QuantumOne",
    description:
      "An Alexa-powered web service that lets you control a Windows PC by voice — shut it down, wake it up, or run quick commands from across the room.",
    tags: ["JavaScript", "Alexa Skills", "Home Automation"],
    status: "shipped",
    year: "2019",
    stars: 1,
    forks: 0,
    url: "https://github.com/MoshRadix/QuantumOne",
    homepage: null,
    featured: true,
    highlight: false,
  },
  {
    title: "Hass.io Add-ons",
    description:
      "A personal collection of Hass.io / Home Assistant add-ons for extending a self-hosted smart-home setup with extra integrations and utilities.",
    tags: ["Shell", "Docker", "Home Assistant"],
    status: "shipped",
    year: "2019",
    stars: 0,
    forks: 0,
    url: "https://github.com/MoshRadix/hassio-addons",
    homepage: null,
    featured: true,
    highlight: false,
  },
  {
    title: "Codexero DB Plugin",
    description:
      "A database plugin written for Fedena, the open-source school management system, built to extend its data layer for a real school deployment.",
    tags: ["Fedena", "Plugin", "Education"],
    status: "archived",
    year: "2012",
    stars: 0,
    forks: 0,
    url: "https://github.com/MoshRadix/Codexero_DB_Plugin",
    homepage: null,
    featured: true,
    highlight: false,
  },
  {
    title: "Snips for Hass.io",
    description:
      "A Home Assistant add-on packaging the Snips offline voice assistant for amd64 hardware, for hands-free home automation without sending audio to the cloud.",
    tags: ["Shell", "Snips", "Voice Assistant"],
    status: "archived",
    year: "2019",
    stars: 0,
    forks: 0,
    url: "https://github.com/MoshRadix/hassio-snips-amd64",
    homepage: null,
    featured: false,
    highlight: false,
  },
  {
    title: "cxquotes",
    description:
      "A small JavaScript tool for collecting and serving quotes, grown out of the Codexero blog's love of random ideas worth keeping around.",
    tags: ["JavaScript", "Web"],
    status: "archived",
    year: "2021",
    stars: 0,
    forks: 0,
    url: "https://github.com/MoshRadix/cxquotes",
    homepage: null,
    featured: false,
    highlight: false,
  },
  {
    title: "TikTok Live for Dart",
    description:
      "A Dart library for tapping into TikTok LIVE's realtime event stream — comments, gifts, and viewer activity — for building live-stream dashboards and bots.",
    tags: ["Dart", "Realtime", "TikTok API"],
    status: "archived",
    year: "2024",
    stars: 0,
    forks: 0,
    url: "https://github.com/MoshRadix/tiktoklive_dart2",
    homepage: null,
    featured: false,
    highlight: false,
  },
  {
    title: "Issue Tracker",
    description:
      "A Next.js and TypeScript practice build for tracking issues end-to-end, used to get hands dirty with the App Router and modern React patterns.",
    tags: ["TypeScript", "Next.js", "Learning"],
    status: "archived",
    year: "2024",
    stars: 0,
    forks: 0,
    url: "https://github.com/MoshRadix/issue-tracker",
    homepage: null,
    featured: false,
    highlight: false,
  },
]

export const workbenchSeed = [
  {
    name: "mosh-samugaa-app",
    description: "Bilingual, offline-first desktop suite for Addu City Council's Municipal Technical Office",
    progress: 80,
    lastUpdated: "Jun 2026",
    url: "https://github.com/MoshRadix/mosh-samugaa-app",
    branch: "main",
    commits: 89,
  },
  {
    name: "hassio-addons",
    description: "Personal collection of Hass.io add-ons for a self-hosted smart home",
    progress: 55,
    lastUpdated: "Feb 2025",
    url: "https://github.com/MoshRadix/hassio-addons",
    branch: "master",
    commits: 23,
  },
  {
    name: "tiktoklive_dart2",
    description: "Dart library for TikTok LIVE's realtime comment and gift stream",
    progress: 70,
    lastUpdated: "Feb 2024",
    url: "https://github.com/MoshRadix/tiktoklive_dart2",
    branch: "main",
    commits: 100,
  },
  {
    name: "issue-tracker",
    description: "Next.js and TypeScript practice build for tracking issues end-to-end",
    progress: 90,
    lastUpdated: "Dec 2024",
    url: "https://github.com/MoshRadix/issue-tracker",
    branch: "master",
    commits: 14,
  },
  {
    name: "cxquotes",
    description: "Small JavaScript tool for collecting and serving quotes",
    progress: 40,
    lastUpdated: "Nov 2021",
    url: "https://github.com/MoshRadix/cxquotes",
    branch: "main",
    commits: 36,
  },
]

export const activitySeed = [
  { type: "commit", project: "mosh-samugaa-app", message: "Polish template auto-computation logic", time: "3 hours ago" },
  { type: "commit", project: "mosh-samugaa-app", message: "Fix Dhivehi date formatting", time: "1 day ago" },
  { type: "commit", project: "Fonts", message: "Update bundled Thaana font assets", time: "5 days ago" },
  { type: "branch", project: "mosh-samugaa-app", message: "Created release/1.1.1 branch", time: "1 week ago" },
]
