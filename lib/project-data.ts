export type ProjectStatus = "shipped" | "in-progress" | "archived"

export interface ProjectDetailSection {
  title: string
  body: string
}

export interface ProjectPolicySection {
  heading: string
  points: string[]
}

export interface Project {
  id: number
  slug: string
  title: string
  description: string
  tags: string[]
  status: ProjectStatus
  year: string
  stars: number
  forks: number
  url: string
  homepage: string | null
  featured: boolean
  highlight: boolean
  summary: string
  details: ProjectDetailSection[]
  terms: ProjectPolicySection[]
  privacy: ProjectPolicySection[]
}

const standardTerms = (projectName: string): ProjectPolicySection[] => [
  {
    heading: "Use of the project",
    points: [
      `${projectName} is provided as an open-source or personal project artifact for learning, experimentation, and practical reuse where its repository license allows it.`,
      "You are responsible for reviewing the source, dependencies, configuration, and deployment environment before using it in production or sensitive workflows.",
      "The project may change, pause, or be archived without prior notice because it is maintained as part of an independent workshop rather than a commercial service.",
    ],
  },
  {
    heading: "No warranty",
    points: [
      "The software and documentation are provided as-is, without guarantees of uptime, compatibility, data recovery, or fitness for a specific purpose.",
      "Any automation, system command, school, home, or government-office workflow should be tested in a safe environment before real-world use.",
    ],
  },
  {
    heading: "Contributions and attribution",
    points: [
      "Issues, forks, and pull requests are welcome when the repository is active and public contribution is practical.",
      "Please preserve relevant copyright notices, license text, and attribution when adapting the work.",
    ],
  },
]

const standardPrivacy = (projectName: string): ProjectPolicySection[] => [
  {
    heading: "Project page analytics",
    points: [
      `This ${projectName} detail page may be measured through the site's privacy-conscious analytics setup to understand page visits and performance.`,
      "No account registration, newsletter signup, or project-specific tracking form is required to read this page.",
    ],
  },
  {
    heading: "Repository and external links",
    points: [
      "Opening the source repository or any external homepage may send standard request information to that third-party platform.",
      "Those external services are governed by their own terms, privacy policies, cookies, and logging practices.",
    ],
  },
  {
    heading: "Local and self-hosted data",
    points: [
      "Projects intended for offline or self-hosted use keep their runtime data in the environment where you install or operate them, unless you connect external services yourself.",
      "Review configuration files, secrets, logs, and storage paths before deploying a fork with real user data.",
    ],
  },
]

export const projects: Project[] = [
  {
    id: 0,
    slug: "mto-samugaa",
    title: "MTO Samugaa",
    description:
      "A bilingual (English & Dhivehi), offline-first desktop suite for Addu City Council's Municipal Technical Office - bundling document generation, task tracking, and staff logging into one fast Electron app.",
    tags: ["Electron", "JavaScript", "Offline-first", "Dhivehi i18n"],
    status: "in-progress",
    year: "2026",
    stars: 0,
    forks: 0,
    url: "https://github.com/MoshRadix/mosh-samugaa-app",
    homepage: null,
    featured: true,
    highlight: true,
    summary:
      "MTO Samugaa turns a set of repeated municipal office tasks into one local-first desktop workspace, shaped around bilingual staff workflows and unreliable connectivity.",
    details: [
      {
        title: "What it solves",
        body: "The app is designed for a technical office where forms, staff logs, task notes, and generated documents need to move quickly without waiting on cloud services. It gives the office a single place to prepare repeatable paperwork and keep operational context close to the people doing the work.",
      },
      {
        title: "How it is built",
        body: "Electron provides the desktop shell, while the interface focuses on fast local interactions, predictable templates, and Dhivehi-friendly text handling. The offline-first direction keeps the system useful on ordinary office machines and allows documents to be produced even when the network is having a bad day.",
      },
      {
        title: "Current direction",
        body: "The project is still active, with attention on template auto-computation, date handling, bilingual polish, and the small details that make an internal tool feel trustworthy for everyday staff use.",
      },
    ],
    terms: standardTerms("MTO Samugaa"),
    privacy: standardPrivacy("MTO Samugaa"),
  },
  {
    id: 1,
    slug: "quantumone",
    title: "QuantumOne",
    description:
      "An Alexa-powered web service that lets you control a Windows PC by voice - shut it down, wake it up, or run quick commands from across the room.",
    tags: ["JavaScript", "Alexa Skills", "Home Automation"],
    status: "shipped",
    year: "2019",
    stars: 1,
    forks: 0,
    url: "https://github.com/MoshRadix/QuantumOne",
    homepage: null,
    featured: true,
    highlight: false,
    summary:
      "QuantumOne connects voice commands to desktop control, exploring the practical edge between smart speakers, home automation, and a Windows machine.",
    details: [
      {
        title: "What it solves",
        body: "The project gives a voice-first route for simple PC actions that normally require walking over to the machine. It is the sort of home automation bridge that makes sense when the computer is part workstation, part media device, and part always-on household utility.",
      },
      {
        title: "How it is built",
        body: "The service uses JavaScript and an Alexa Skill flow to interpret commands, pass them to a local or reachable endpoint, and trigger actions on Windows. The interesting part is not a huge interface, but the careful handshake between cloud voice intent and local machine behavior.",
      },
      {
        title: "Current direction",
        body: "QuantumOne is shipped as an older experiment. It remains useful as a reference for voice-command plumbing and the security questions that come with giving a smart-home system permission to control a real computer.",
      },
    ],
    terms: standardTerms("QuantumOne"),
    privacy: standardPrivacy("QuantumOne"),
  },
  {
    id: 2,
    slug: "hassio-add-ons",
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
    summary:
      "Hass.io Add-ons packages self-hosted smart-home helpers into repeatable Home Assistant add-ons for a more capable local setup.",
    details: [
      {
        title: "What it solves",
        body: "Home Assistant becomes much more powerful when small services can be installed, updated, and tested consistently. This collection captures those extras as add-ons rather than one-off machine tweaks.",
      },
      {
        title: "How it is built",
        body: "The repository leans on Shell scripts and Docker packaging conventions, matching the Home Assistant add-on ecosystem. Each add-on is intended to be understandable, portable, and close enough to the platform's patterns to run on modest home hardware.",
      },
      {
        title: "Current direction",
        body: "The project is shipped and serves as a snapshot of a self-hosted home-automation setup. It is a practical base for anyone studying how Home Assistant add-ons are composed and maintained.",
      },
    ],
    terms: standardTerms("Hass.io Add-ons"),
    privacy: standardPrivacy("Hass.io Add-ons"),
  },
  {
    id: 3,
    slug: "codexero-db-plugin",
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
    summary:
      "Codexero DB Plugin is an early education-tech artifact, built to adapt an open-source school system to the data needs of a real deployment.",
    details: [
      {
        title: "What it solves",
        body: "School management systems often need local customization once they meet real administrative workflows. This plugin explored a focused data-layer extension for Fedena, making a generic platform better suited to a particular school context.",
      },
      {
        title: "How it is built",
        body: "The project follows the plugin style of the Fedena ecosystem rather than trying to replace the host application. Its value is in the narrow integration work: fitting into an established education platform and extending the database behavior where the deployment needed it.",
      },
      {
        title: "Current direction",
        body: "The plugin is archived and best read as an early snapshot of practical software work around schools, databases, and local operational requirements.",
      },
    ],
    terms: standardTerms("Codexero DB Plugin"),
    privacy: standardPrivacy("Codexero DB Plugin"),
  },
  {
    id: 4,
    slug: "snips-for-hassio",
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
    summary:
      "Snips for Hass.io brings an offline voice assistant into Home Assistant, emphasizing local control and private smart-home interaction.",
    details: [
      {
        title: "What it solves",
        body: "Voice control is convenient, but smart-home voice systems often depend on cloud processing. This add-on packaged Snips for Home Assistant so commands could be handled locally on amd64 hardware.",
      },
      {
        title: "How it is built",
        body: "The work centers on packaging, startup behavior, and integration boundaries. Shell and Home Assistant add-on conventions make the assistant installable inside the same self-hosted environment as the rest of the home automation stack.",
      },
      {
        title: "Current direction",
        body: "The project is archived, but it remains a useful reference for local voice-control architecture and privacy-minded smart-home experimentation.",
      },
    ],
    terms: standardTerms("Snips for Hass.io"),
    privacy: standardPrivacy("Snips for Hass.io"),
  },
  {
    id: 5,
    slug: "cxquotes",
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
    summary:
      "cxquotes is a lightweight quote-collection tool, built around the simple pleasure of saving small lines that deserve to stay findable.",
    details: [
      {
        title: "What it solves",
        body: "A blog or personal site gathers fragments over time: quotes, little ideas, and lines that are too good to vanish into a notebook. cxquotes gives those fragments a small web-shaped home.",
      },
      {
        title: "How it is built",
        body: "The project uses JavaScript with a deliberately small surface area. Its appeal is in being direct: collect, store, and serve quotes without turning a tiny idea into an oversized platform.",
      },
      {
        title: "Current direction",
        body: "cxquotes is archived as a compact web experiment. It fits the workshop theme: a useful tool made because a personal workflow wanted one.",
      },
    ],
    terms: standardTerms("cxquotes"),
    privacy: standardPrivacy("cxquotes"),
  },
  {
    id: 6,
    slug: "tiktok-live-for-dart",
    title: "TikTok Live for Dart",
    description:
      "A Dart library for tapping into TikTok LIVE's realtime event stream - comments, gifts, and viewer activity - for building live-stream dashboards and bots.",
    tags: ["Dart", "Realtime", "TikTok API"],
    status: "archived",
    year: "2024",
    stars: 0,
    forks: 0,
    url: "https://github.com/MoshRadix/tiktoklive_dart2",
    homepage: null,
    featured: false,
    highlight: false,
    summary:
      "TikTok Live for Dart explores realtime stream events in Dart, making comments, gifts, and viewer activity available to apps and bots.",
    details: [
      {
        title: "What it solves",
        body: "Live-stream tooling often needs quick access to chat events and audience signals. This library turns those realtime events into data a Dart application can consume for dashboards, overlays, experiments, or moderation helpers.",
      },
      {
        title: "How it is built",
        body: "The project focuses on long-lived connection behavior, parsing event payloads, and representing TikTok LIVE activity in a Dart-friendly way. The useful work is in keeping the stream understandable while the upstream service stays dynamic.",
      },
      {
        title: "Current direction",
        body: "The library is archived, which is important for API-adjacent projects where external protocols can move quickly. It remains a reference for realtime client structure in Dart.",
      },
    ],
    terms: standardTerms("TikTok Live for Dart"),
    privacy: standardPrivacy("TikTok Live for Dart"),
  },
  {
    id: 7,
    slug: "issue-tracker",
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
    summary:
      "Issue Tracker is a modern React practice project, using an ordinary product workflow to learn the shape of Next.js and TypeScript.",
    details: [
      {
        title: "What it solves",
        body: "Issue tracking is a familiar enough domain to reveal the real edges of an application: forms, status changes, lists, details, validation, and navigation. That makes it a strong practice ground for learning the App Router without inventing a strange product problem.",
      },
      {
        title: "How it is built",
        body: "The project uses Next.js and TypeScript, focusing on typed UI flows and the core patterns needed in day-to-day React work. It is less about being a commercial tracker and more about building fluency through a complete workflow.",
      },
      {
        title: "Current direction",
        body: "The repository is archived as a learning build. Its value is in showing the progression from tutorials into a hands-on, end-to-end application.",
      },
    ],
    terms: standardTerms("Issue Tracker"),
    privacy: standardPrivacy("Issue Tracker"),
  },
]

export const allProjectTags = [...new Set(projects.flatMap((project) => project.tags))]

export function getProjectBySlug(slug: string) {
  return projects.find((project) => project.slug === slug)
}
