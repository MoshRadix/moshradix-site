import { Code2, Wrench, FileText, TerminalSquare, Radio, Languages } from "lucide-react";

export default function IntroductionPage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative min-h-[60vh] px-4 sm:px-6 pt-28 sm:pt-32 pb-16 sm:pb-20">
        <div className="mx-auto max-w-4xl">
          <div className="space-y-6 sm:space-y-8">
            <div className="space-y-2">
              <p className="font-mono text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] text-muted-foreground">
                Welcome to MoshRadix
              </p>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl text-balance">
                Where Code Meets{" "}
                <span className="bg-gradient-to-l from-primary/50 to-accent text-transparent bg-clip-text">
                  the Isles
                </span>
              </h1>
            </div>

            <p className="text-base sm:text-lg leading-relaxed text-muted-foreground max-w-3xl">
              MoshRadix is the digital workshop of Mohamed Shamil — an IT administrator by profession and a
              hobbyist developer by choice, based in the Maldives. It&apos;s a space where government
              workflows get automated, home networks get tinkered with, and the occasional weekend project
              turns into something worth sharing.
            </p>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="relative px-4 sm:px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <div className="rounded border border-border/50 bg-card/50 p-6 sm:p-10 backdrop-blur-sm space-y-8">
            <div className="space-y-4">
              <p className="font-mono text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] text-primary">
                About the Workshop
              </p>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                An Administrator&apos;s Digital Workshop
              </h2>
            </div>

            <div className="space-y-6 text-base sm:text-lg leading-relaxed text-muted-foreground">
              <p>
                MoshRadix isn&apos;t a software-house portfolio — it&apos;s a running log of a hobbyist&apos;s
                projects, kept by someone who handles administration by day and writes code by night. The
                blog this site grew out of has been posting random ideas, downloads, and the occasional
                rant from the isles since the late 2000s.
              </p>

              <p>
                Lately the focus has shifted from blog posts to building: an offline-first desktop suite for
                local government staff, a handful of Home Assistant add-ons for a self-hosted smart home, and
                small libraries written to scratch a very specific itch — like talking to TikTok LIVE&apos;s
                realtime API in Dart.
              </p>

              <p>
                Every project here is open source and lives on GitHub. None of it is polished
                enterprise software — it&apos;s built the way most good hobby projects are: because
                something annoying needed fixing, and a free weekend was available.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative px-4 sm:px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 space-y-4 text-center">
            <p className="font-mono text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] text-primary">
              What You&apos;ll Find Here
            </p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Built by a Hobbyist, for Hobbyists
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Code2,
                title: "Open Source Projects",
                description:
                  "Every project is available on GitHub for learning and collaboration — from desktop apps to small libraries, warts and all.",
              },
              {
                icon: Wrench,
                title: "Offline-First Tools",
                description:
                  "Software built to work without an internet connection, for places and people who can't always count on having one.",
              },
              {
                icon: FileText,
                title: "Field Notes",
                description:
                  "Write-ups of what got built, what broke, and what was learned along the way — from bell timers to voice assistants.",
              },
              {
                icon: TerminalSquare,
                title: "Practical Tech Stack",
                description:
                  "Electron, Node.js, Dart, and a fair bit of Shell — tools picked for getting real, small-scale problems solved.",
              },
              {
                icon: Radio,
                title: "Home Automation",
                description:
                  "Hass.io add-ons, self-hosted voice assistants, and workflow automation — keeping smart-home data off the cloud where possible.",
              },
              {
                icon: Languages,
                title: "Bilingual by Design",
                description:
                  "English and Dhivehi (Thaana script) support built into desktop tools, so local government staff can use software in their own language.",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="group rounded border border-border/50 bg-card/50 p-6 backdrop-blur-sm transition-all duration-300 hover:border-primary/50 hover:bg-card/80"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded border border-primary/30 bg-primary/10 text-primary transition-all duration-300 group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 font-mono text-sm font-semibold uppercase tracking-wider text-foreground">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
