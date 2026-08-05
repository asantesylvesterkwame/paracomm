import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Globe2, Languages, Mic, ShieldCheck, Sparkles, Zap } from "lucide-react";
import ButtonElement from "@/components/elements/ButtonElement";
import Logo from "@/components/common/Logo";
import { ModeToggle } from "@/components/common/ModeToggle";
import { fadeUp, HOVER_LIFT, SPRING, staggerParent } from "@/lib/motion";
import { ROUTES } from "@/constants/routes.constants";
import { OUTPUT_LANGUAGES } from "@/files/live/live.constants";
import GreetingCycler from "../components/GreetingCycler";
import DemoConversation from "../components/DemoConversation";

const STEPS = [
  {
    icon: Mic,
    title: "Hit record and talk",
    body: "Your browser listens and writes down what you say as you say it. Nothing to install, nobody to sign up.",
  },
  {
    icon: Sparkles,
    title: "AI translates instantly",
    body: "Each phrase is translated the moment you finish it, so the conversation never has to wait for you.",
  },
  {
    icon: Languages,
    title: "Read it in any language",
    body: "Pick from over twenty languages, from Spanish and Japanese to Twi, Swahili and Yoruba.",
  },
];

const TRUST_POINTS = [
  { icon: ShieldCheck, label: "No account needed" },
  { icon: Zap, label: "Free every day" },
  { icon: Globe2, label: "25+ languages" },
];

const Landing = () => {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl flex-row items-center justify-between gap-4 px-6 py-4">
          <Logo />
          <div className="flex flex-row items-center gap-3">
            <ModeToggle />
            <Link to={ROUTES.LIVE}>
              <ButtonElement className="h-10 rounded-xl px-5 shadow-[0_8px_20px_-10px_rgba(0,100,255,0.55)]">
                Try it live
              </ButtonElement>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div className="hero-glow absolute inset-0" />
          <div className="bg-dotted absolute inset-0 opacity-40" />
          <div className="relative mx-auto grid w-full max-w-6xl gap-12 px-6 pb-20 pt-16 md:grid-cols-2 md:items-center md:pb-28 md:pt-24">
            <motion.div
              variants={staggerParent(0.09)}
              initial="hidden"
              animate="show"
              className="flex flex-col items-start gap-6"
            >
              <motion.span variants={fadeUp} className="text-eyebrow">
                Realtime speech translation
              </motion.span>
              <motion.h1
                variants={fadeUp}
                className="text-display text-5xl md:text-6xl lg:text-7xl"
              >
                Say <GreetingCycler /> and the whole room understands.
              </motion.h1>
              <motion.p
                variants={fadeUp}
                className="max-w-md text-lg leading-relaxed text-muted-foreground"
              >
                Paracomm listens while you speak and writes out what you said in
                the language you choose, live, word for word.
              </motion.p>
              <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-3">
                <Link to={ROUTES.LIVE}>
                  <ButtonElement className="h-12 rounded-xl px-7 text-base shadow-[0_12px_30px_-12px_rgba(0,100,255,0.6)]">
                    <Mic className="size-4" />
                    Start translating free
                  </ButtonElement>
                </Link>
                <a href="#how-it-works">
                  <ButtonElement variant="ghost" className="h-12 rounded-xl px-6 text-base">
                    How it works
                  </ButtonElement>
                </a>
              </motion.div>
              <motion.div
                variants={fadeUp}
                className="flex flex-wrap items-center gap-4 pt-2"
              >
                {TRUST_POINTS.map((point) => (
                  <span
                    key={point.label}
                    className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
                  >
                    <point.icon className="size-3.5 text-primary" />
                    {point.label}
                  </span>
                ))}
              </motion.div>
            </motion.div>
            <div className="flex justify-center md:justify-end">
              <DemoConversation />
            </div>
          </div>
        </section>

        <section className="border-y border-border/60 bg-secondary/30 py-5">
          <div className="marquee-mask overflow-hidden">
            <div className="animate-marquee flex w-max flex-row gap-10 pr-10">
              {[...OUTPUT_LANGUAGES, ...OUTPUT_LANGUAGES].map(
                (language, index) => (
                  <span
                    key={`${language.code}-${index}`}
                    className="text-sm font-medium tracking-wide text-muted-foreground"
                  >
                    {language.label}
                  </span>
                ),
              )}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="scroll-mt-24 py-20 md:py-28">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6">
            <motion.div
              variants={staggerParent(0.08)}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "0px 0px -120px 0px" }}
              className="flex flex-col gap-3"
            >
              <motion.span variants={fadeUp} className="text-eyebrow">
                How it works
              </motion.span>
              <motion.h2 variants={fadeUp} className="text-headline max-w-xl text-3xl md:text-4xl">
                Three steps between you and every language.
              </motion.h2>
            </motion.div>
            <motion.div
              variants={staggerParent(0.1)}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "0px 0px -120px 0px" }}
              className="grid gap-5 md:grid-cols-3"
            >
              {STEPS.map((step) => (
                <motion.div
                  key={step.title}
                  variants={fadeUp}
                  whileHover={HOVER_LIFT}
                  transition={SPRING.card}
                  className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-card/95 p-6"
                >
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <step.icon className="size-5" strokeWidth={2} />
                  </span>
                  <h3 className="text-headline text-xl">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {step.body}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        <section className="pb-24 md:pb-32">
          <div className="mx-auto w-full max-w-6xl px-6">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "0px 0px -80px 0px" }}
              transition={SPRING.panel}
              className="hero-glow relative overflow-hidden rounded-4xl border border-primary/20 bg-card/95 px-6 py-16 text-center md:py-20"
            >
              <div className="relative flex flex-col items-center gap-5">
                <span className="text-eyebrow">Free while in preview</span>
                <h2 className="text-headline max-w-2xl text-3xl md:text-5xl">
                  Every voice deserves to be understood.
                </h2>
                <p className="max-w-md text-base text-muted-foreground">
                  Everyone gets free translation minutes every single day. No
                  card, no account, just your voice.
                </p>
                <Link to={ROUTES.LIVE}>
                  <ButtonElement className="h-12 rounded-xl px-8 text-base shadow-[0_12px_30px_-12px_rgba(0,100,255,0.6)]">
                    Start speaking now
                  </ButtonElement>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 py-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-muted-foreground sm:flex-row">
          <span>Paracomm · A Corpland Technologies product</span>
          <div className="flex items-center gap-5">
            <Link
              to={ROUTES.LIVE}
              className="transition-colors hover:text-foreground"
            >
              Live translate
            </Link>
            <Link
              to={ROUTES.STYLES}
              className="transition-colors hover:text-foreground"
            >
              Design system
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
