import Link from "next/link";
import { GenieMark } from "@/components/placement/genie-mark";

const studentSteps = [
  {
    body: "Upload a resume or enter USN, CGPA, and skills so Genie knows who you are.",
    code: "01",
    title: "Add your profile",
  },
  {
    body: "Check readiness for a campus company and role against live placement data.",
    code: "02",
    title: "Ask about a role",
  },
  {
    body: "Get a sequenced skill plan, then track it until you are drive-ready.",
    code: "03",
    title: "Close the gaps",
  },
];

const cellSteps = [
  {
    body: "Placement Cell access is separate from student chat. No resume or roadmap tools.",
    code: "01",
    title: "Sign in with a code",
  },
  {
    body: "Ask Genie for funnels, conversion, at-risk groups, and student-level tables.",
    code: "02",
    title: "See the campus picture",
  },
  {
    body: "Prioritize interventions from charts and directories, not spreadsheets.",
    code: "03",
    title: "Act on evidence",
  },
];

const capabilities = [
  {
    body: "Match student skills to company requirements by name. Missing skills stay missing.",
    color: "#00a972",
    title: "Readiness, not guesswork",
  },
  {
    body: "Genie queries placement drives, students, scores, and courses from Databricks.",
    color: "#016bc1",
    title: "Campus data, live",
  },
  {
    body: "Students prepare. Placement Cell sees the whole funnel. Same Genie, different doors.",
    color: "#eb1600",
    title: "Two rooms, one product",
  },
];

export function LandingPage() {
  return (
    <div className="landing-grid min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0b2026]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link
            className="flex items-center gap-3 text-white no-underline"
            href="/"
          >
            <GenieMark size={32} />
            <span className="font-medium text-[15px]">Placement Genie</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link className="landing-link hidden sm:inline" href="/login">
              Student sign in
            </Link>
            <Link className="landing-link" href="/placement-cell/login">
              Placement Cell
            </Link>
            <Link className="landing-cta" href="/chat">
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl gap-12 px-5 py-20 lg:grid-cols-[1.15fr_0.85fr] lg:py-28">
          <div>
            <p className="landing-mono mb-5 text-[12px] tracking-[0.18em] text-[#90a5b1] uppercase">
              Campus placement intelligence
            </p>
            <h1 className="max-w-[14ch] font-medium text-4xl leading-[1.1] text-white md:text-6xl">
              Know if you are ready. Show the campus why.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-[#c4ccd6] md:text-lg">
              Ask Genie whether you match a campus role, then close skill gaps
              with a plan. Placement officers get the same data as charts,
              funnels, and a student directory.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link className="landing-cta" href="/chat">
                Get started
              </Link>
              <Link
                className="landing-cta-secondary"
                href="/placement-cell/login"
              >
                Placement Cell
              </Link>
            </div>
            <p className="mt-4 text-[13px] text-[#90a5b1]">
              Students enter chat. Placement Cell uses an access code.
            </p>
          </div>

          <aside className="border border-white/10 bg-[#1b3139] p-6 shadow-[0_16px_48px_rgb(0_0_0_/_0.35)]">
            <p className="landing-mono text-[11px] tracking-[0.16em] text-[#00a972] uppercase">
              Two doors
            </p>
            <div className="mt-6 grid gap-px bg-white/10">
              <div className="bg-[#1b3139] p-5">
                <p className="font-medium text-white">Students</p>
                <p className="mt-2 text-[14px] leading-6 text-[#c4ccd6]">
                  Profile, readiness questions, skill-gap roadmaps.
                </p>
              </div>
              <div className="bg-[#1b3139] p-5">
                <p className="font-medium text-white">Placement Cell</p>
                <p className="mt-2 text-[14px] leading-6 text-[#c4ccd6]">
                  Analytics workspace. No resume upload. No student roadmap.
                </p>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <span className="size-2.5 bg-[#eb1600]" />
              <span className="size-2.5 bg-[#00a972]" />
              <span className="size-2.5 bg-[#016bc1]" />
            </div>
          </aside>
        </section>

        <section className="bg-[#f9f7f4] py-20 text-[#1b3139]">
          <div className="mx-auto max-w-6xl px-5">
            <p className="landing-mono text-[12px] tracking-[0.18em] text-[#5a6f77] uppercase">
              How it works
            </p>
            <h2 className="mt-3 font-medium text-3xl md:text-4xl">
              One product. Two journeys.
            </h2>
            <div className="mt-12 grid gap-10 lg:grid-cols-2">
              <div>
                <h3 className="font-medium text-xl">For students</h3>
                <ol className="mt-6 space-y-6">
                  {studentSteps.map((step) => (
                    <li className="flex gap-4" key={step.code}>
                      <span className="landing-mono w-8 shrink-0 text-[#eb1600]">
                        {step.code}
                      </span>
                      <div>
                        <p className="font-medium">{step.title}</p>
                        <p className="mt-1 text-[14px] leading-6 text-[#445361]">
                          {step.body}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
              <div>
                <h3 className="font-medium text-xl">For Placement Cell</h3>
                <ol className="mt-6 space-y-6">
                  {cellSteps.map((step) => (
                    <li className="flex gap-4" key={step.code}>
                      <span className="landing-mono w-8 shrink-0 text-[#016bc1]">
                        {step.code}
                      </span>
                      <div>
                        <p className="font-medium">{step.title}</p>
                        <p className="mt-1 text-[14px] leading-6 text-[#445361]">
                          {step.body}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-20 text-[#1b3139]">
          <div className="mx-auto max-w-6xl px-5">
            <p className="landing-mono text-[12px] tracking-[0.18em] text-[#5a6f77] uppercase">
              Built for campus drives
            </p>
            <h2 className="mt-3 max-w-[18ch] font-medium text-3xl md:text-4xl">
              Precise answers. Visible evidence.
            </h2>
            <div className="mt-12 grid gap-px bg-[#edf2f8] md:grid-cols-3">
              {capabilities.map((item) => (
                <article className="bg-white p-8" key={item.title}>
                  <span
                    className="mb-6 block h-1 w-10"
                    style={{ background: item.color }}
                  />
                  <h3 className="font-medium text-xl">{item.title}</h3>
                  <p className="mt-3 text-[14px] leading-6 text-[#445361]">
                    {item.body}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#1b3139] py-20">
          <div className="mx-auto max-w-6xl px-5">
            <h2 className="font-medium text-3xl text-white md:text-4xl">
              Start where you belong.
            </h2>
            <p className="mt-4 max-w-xl text-[16px] leading-7 text-[#c4ccd6]">
              Students prepare for a company and role. Placement Cell reads the
              whole season.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link className="landing-cta" href="/chat">
                Get started
              </Link>
              <Link
                className="landing-cta-secondary"
                href="/placement-cell/login"
              >
                Placement Cell login
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-[#0b2026] py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 text-[12px] text-[#90a5b1]">
          <p>Placement Readiness Genie</p>
          <p className="landing-mono uppercase tracking-[0.12em]">
            Powered by Databricks Genie
          </p>
        </div>
      </footer>
    </div>
  );
}
