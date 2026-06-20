export interface BlogPost {
  id: number
  slug: string
  title: string
  excerpt: string
  content: string
  date: string
  readTime: string
  category: string
  tags: string[]
  author: {
    name: string
    avatar: string
    role: string
  }
  featured: boolean
  color: string
}

export const blogPosts: BlogPost[] = [
  {
    id: 1,
    slug: "school-bell-timer-free-for-all",
    title: "School Bell Timer — Free for All",
    excerpt:
      "How a coworker's request to stop using nagging trial software turned into a free weekend build for sounding a school's intercom on schedule.",
    content: `
## Back After a Long Silence

Hello friends and strangers — it's been ages since my last post. A friend suggested over coffee that I should write about my hobby projects, so here I am. I'm an administrator by profession, and a technology enthusiast and hobby programmer by choice.

## The Problem

A coworker asked for help putting an end to the annoying cycle of using trial software to sound the school's bell. The school's intercom system plays bell sounds between periods, which is convenient — the problem was finding free software to do the job. Solutions exist that let you use commercial software for free without paying, but those routes are ethically and morally wrong, so that wasn't on the table.

## A Weekend Project

Most projects start because there's a real need, and this one had a clear one. I scheduled it for the weekend, and by Sunday evening it was done: a small Windows utility that rings the bell on schedule, with no trial nags and no license key.

## Get It

You can grab the files and setup instructions here:

<a href="https://drive.google.com/drive/folders/17J7Ytk3anQ7EyNTZ2Yz3fyVgMa2Ap78l?usp=sharing" target="_blank" rel="noopener noreferrer">Download School Bell Timer</a>

Thanks for your time :)
    `,
    date: "Sep 26, 2020",
    readTime: "4 min read",
    category: "software",
    tags: ["windows", "desktop-app", "education"],
    author: {
      name: "Mohamed Shamil",
      avatar: "/developer-portrait.png",
      role: "IT Administrator & Hobbyist Developer",
    },
    featured: true,
    color: "from-orange-500/20 to-amber-500/20",
  },
  {
    id: 2,
    slug: "codexero-bot-experimental-im-bot",
    title: "The Codexero BOT — An Experimental IM Bot",
    excerpt:
      "A weekend experiment in getting useful information — flights, definitions, places — straight into an instant messenger client.",
    content: `
## Why Build a Bot?

The Codexero BOT was an experiment in getting useful information inside an instant messenger client itself, without switching apps or opening a browser. The idea was simple: message the bot like a friend, and get a straight answer back.

## What It Could Do

Hosted on a free web server, the bot wasn't always reliable — some downtime was expected — but during testing it held up well. At its best it could:

- Look up flight information
- Display word definitions
- Pull information on places, people, and things

## Commands

\`\`\`text
info Maldives      → information about a place, person, or thing
dict hello         → a word definition
flight sq451       → live flight information
\`\`\`

## Lessons From a Free Backend

Running a bot's backend on a free hosting tier means accepting downtime as part of the deal. It was a fun way to learn the basics of building a conversational interface, long before "chatbot" was a buzzword on every product roadmap.
    `,
    date: "Jan 5, 2010",
    readTime: "3 min read",
    category: "software",
    tags: ["bot", "im", "robotics"],
    author: {
      name: "Mohamed Shamil",
      avatar: "/developer-portrait.png",
      role: "IT Administrator & Hobbyist Developer",
    },
    featured: false,
    color: "from-indigo-500/20 to-purple-500/20",
  },
  {
    id: 3,
    slug: "thaana-font-installer-for-everyone",
    title: "Thaana Font Installer for Everyone",
    excerpt:
      "A small utility built to make installing Thaana fonts painless for fellow Maldivians who found the process more confusing than it should be.",
    content: `
## A Small Utility for a Real Problem

Font installation is normally an easy process, but not everyone finds it easy to track down Thaana fonts and get them installed correctly on a Windows PC. So I built a little utility — the Codexero Thaana Font Installer — to take care of it in a couple of clicks, available in both 64-bit and 32-bit builds for newer and older machines.

## Why It Mattered

As Dhivehi-language blogging, journalism, and social media use grew, more people needed a working set of Thaana fonts on their everyday PC — not just specialists with the know-how to track down and install fonts by hand. A one-click installer closed that gap.

## Years Later

This same instinct — that everyday people shouldn't need technical know-how just to read and write Dhivehi on a computer — is the same one behind the Dhivehi (Thaana) support built into MTO Samugaa years later. Good ideas tend to resurface.
    `,
    date: "Aug 23, 2011",
    readTime: "3 min read",
    category: "software",
    tags: ["dhivehi", "fonts", "windows"],
    author: {
      name: "Mohamed Shamil",
      avatar: "/developer-portrait.png",
      role: "IT Administrator & Hobbyist Developer",
    },
    featured: false,
    color: "from-primary/20 to-emerald-500/20",
  },
  {
    id: 4,
    slug: "ultimate-online-security-explained",
    title: "Ultimate Online Security, Explained",
    excerpt:
      "A practical rundown of passwords, HTTPS, two-factor authentication, and email encryption for anyone concerned about their online privacy.",
    content: `
## Why This Matters

Major search engines and social networks keep track of what you search for and which sites you visit. This is a practical, no-nonsense briefing on password security, email encryption, and online privacy — written for anyone who's concerned but doesn't know where to start.

## Use a Strong Password

Mix uppercase and lowercase characters with special symbols, aim for more than eight characters, and never reuse a password across services. A password manager with a built-in generator takes the guesswork out of it.

## Protect Your Accounts

**Enable HTTPS.** If a service offers an "Always use HTTPS" setting, turn it on. Logging in over plain HTTP means your credentials travel in plain text — visible to anyone sniffing the network.

**Enable two-factor authentication.** Services like Gmail and Facebook can send a one-time code by SMS on login. Even if your password leaks, it's useless without that second factor.

**Use a password manager.** Store your credentials somewhere safer than your memory or a sticky note, and look for one that supports two-factor authentication for an extra layer of protection.

## Mind Your Privacy

Some ISPs inject their own content into search results or track which sites you visit. A few small habits push back:

- Set up a third-party DNS resolver for more control over filtering and malware protection
- Install a tracker-blocking browser extension to stop cookie-based tracking
- Periodically clear your browser history, cookies, and cache

## Encrypt Your Email

Email travels across networks before reaching its destination, and it's not unheard of for messages to be intercepted along the way — or for a provider to hand over an entire archive if legally compelled to. PGP encryption keeps the contents readable only by the intended recipient, with setup guides available for most major email clients.
    `,
    date: "Sep 27, 2011",
    readTime: "7 min read",
    category: "security",
    tags: ["security", "privacy", "passwords"],
    author: {
      name: "Mohamed Shamil",
      avatar: "/developer-portrait.png",
      role: "IT Administrator & Hobbyist Developer",
    },
    featured: true,
    color: "from-cyan-500/20 to-blue-500/20",
  },
  {
    id: 5,
    slug: "boost-router-wifi-signal-custom-firmware",
    title: "Boosting Router Wi-Fi Signal With Custom Firmware",
    excerpt:
      "Flashing a consumer router with DD-WRT turned a weak signal and an expensive upgrade into a free afternoon project.",
    content: `
## The Problem With a Big House

Wireless internet is great until you're in a room far from the router and the signal strength drops off. The obvious fix is buying a more powerful (and more expensive) router — but a friend suggested flashing the existing one with better firmware instead.

## Enter DD-WRT

After some research, DD-WRT turned out to be the most reliable and capable router firmware available, and it's free. Flashing it took less than three minutes, and the difference was immediate.

## What You Get

DD-WRT unlocks a long list of features that stock router firmware usually leaves out:

- Dynamic DNS updates, so your router stays reachable even with an IP that changes every time you reconnect
- A built-in Wi-Fi hotspot mode
- VPN, SSH, and Telnet access
- Fine-grained transmit power (Tx Power) adjustment

## The Fix

Bumping the Tx Power value up significantly boosted the signal throughout the house — no new hardware required. DD-WRT supports the vast majority of consumer routers, which makes turning a cheap router into a feature-rich one a genuinely free upgrade.
    `,
    date: "Jul 9, 2011",
    readTime: "5 min read",
    category: "hardware",
    tags: ["networking", "dd-wrt", "wifi"],
    author: {
      name: "Mohamed Shamil",
      avatar: "/developer-portrait.png",
      role: "IT Administrator & Hobbyist Developer",
    },
    featured: false,
    color: "from-blue-500/20 to-cyan-500/20",
  },
  {
    id: 6,
    slug: "tiny-computers-for-developers-and-geeks",
    title: "Tiny Computers for Developers and Geeks",
    excerpt:
      "Plug computers pack a full Linux server into something the size of a power adapter — and they're a great platform for IM bots, firewalls, and home media servers.",
    content: `
## A Blessed Age for Geeks

Tablets, laptops, and smartphones get all the attention, but for geeks who like to tinker, plug computers are the real treat: tiny computers, mostly running Linux, that plug straight into a wall outlet.

## What's Inside

Features vary by device, but many plug computers pack in HDMI, USB, Ethernet, Wi-Fi, and expansion card slots. Plug in a portable hard disk and the device becomes a DLNA server, streaming audio and video to anything on the network.

## What They're Good For

- Security surveillance
- Lightweight web hosting
- Media streaming
- Running an IM bot that updates a status or sends an SMS on command
- Running Smoothwall, a powerful open-source firewall, if your router's built-in protection isn't cutting it

## A Development Platform in Disguise

Some of these devices double as a full development platform, capable of running a stack of different applications at once. For a geek who likes having a small Linux box always on and always reachable, it's hard to beat.
    `,
    date: "Jul 30, 2011",
    readTime: "4 min read",
    category: "hardware",
    tags: ["linux", "hardware", "home-server"],
    author: {
      name: "Mohamed Shamil",
      avatar: "/developer-portrait.png",
      role: "IT Administrator & Hobbyist Developer",
    },
    featured: false,
    color: "from-teal-500/20 to-cyan-500/20",
  },
]

export function getPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug)
}

export function getRelatedPosts(currentSlug: string, limit = 3): BlogPost[] {
  const currentPost = getPostBySlug(currentSlug)
  if (!currentPost) return []

  return blogPosts
    .filter((post) => post.slug !== currentSlug)
    .filter((post) => post.category === currentPost.category || post.tags.some((tag) => currentPost.tags.includes(tag)))
    .slice(0, limit)
}
