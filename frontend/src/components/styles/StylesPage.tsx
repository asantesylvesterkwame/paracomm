import { useEffect, useState } from "react";
import {
  Globe2,
  Keyboard,
  MessagesSquare,
  Mic,
  Settings2,
  WifiOff,
} from "lucide-react";
import DivElement from "@/components/elements/DivElement";
import ButtonElement from "@/components/elements/ButtonElement";
import InputElement from "@/components/elements/InputElement";
import OtpElement from "@/components/elements/OtpElement";
import SelectElement from "@/components/elements/SelectElement";
import SegmentedTabsElement from "@/components/elements/SegmentedTabsElement";
import SwitchElement from "@/components/elements/SwitchElement";
import BadgeElement from "@/components/elements/BadgeElement";
import ProgressElement from "@/components/elements/ProgressElement";
import SkeletonElement from "@/components/elements/SkeletonElement";
import ModalElement from "@/components/elements/ModalElement";
import SheetElement from "@/components/elements/SheetElement";
import LabelElement from "@/components/elements/LabelElement";
import EmptyState from "@/components/common/EmptyState";
import Logo from "@/components/common/Logo";
import { ModeToggle } from "@/components/common/ModeToggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Message,
  MessageContent,
  MessageGroup,
  MessageHeader,
} from "@/components/ui/message";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import StylesSection from "@/components/styles/StylesSection";
import StylesNav from "@/components/styles/StylesNav";
import TokenSwatch from "@/components/styles/TokenSwatch";
import GradientSwatch from "@/components/styles/GradientSwatch";
import RadiusSwatch from "@/components/styles/RadiusSwatch";
import ShadowSwatch from "@/components/styles/ShadowSwatch";
import MotionDemo from "@/components/styles/MotionDemo";
import ComponentDemo from "@/components/styles/ComponentDemo";
import CodeBlock from "@/components/styles/CodeBlock";
import CopyForLLMButton from "@/components/styles/CopyForLLMButton";
import {
  ARCHITECTURE_RULES,
  AUTH_OVERRIDES,
  COLOR_TOKENS,
  COMPONENT_PATHS,
  DESIGN_RULES,
  GRADIENTS,
  MOTION_PRESETS,
  NORTH_STAR,
  RADII,
  SHADOW_TOKENS,
  STACK_SUMMARY,
  TYPOGRAPHY_UTILITIES,
} from "@/constants/styleGuide";

const NAV_ITEMS = [
  { id: "overview", label: "Overview" },
  { id: "principles", label: "North Star" },
  { id: "stack", label: "Stack" },
  { id: "colors", label: "Color tokens" },
  { id: "gradients", label: "Brand gradients" },
  { id: "typography", label: "Typography" },
  { id: "radii", label: "Radius scale" },
  { id: "shadows", label: "Shadows" },
  { id: "motion", label: "Motion" },
  { id: "buttons", label: "Buttons" },
  { id: "inputs", label: "Inputs & controls" },
  { id: "cards", label: "Cards & chat" },
  { id: "feedback", label: "Status & feedback" },
  { id: "overlays", label: "Overlays" },
  { id: "components", label: "Components map" },
  { id: "rules", label: "Architecture rules" },
];

const LANGUAGES = ["English", "French", "Spanish", "Akan", "Swahili"];

const demoImage =
  "data:image/svg+xml;charset=utf8," +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='640' height='400'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#5138ec'/><stop offset='1' stop-color='#b561f9'/></linearGradient></defs><rect width='640' height='400' fill='url(#g)'/></svg>"
  );

const buttonsCode = `<ButtonElement variant="default" className="${AUTH_OVERRIDES.SUBMIT_CLASS}">
  Join room
</ButtonElement>`;

const fieldCode = `<InputElement
  id="email"
  type="email"
  placeholder="you@example.com"
  inputClassName="${AUTH_OVERRIDES.FIELD_CLASS}"
  onChange={(e) => setEmail(e.target.value)}
/>`;

const otpCode = `<OtpElement
  id="otp"
  slots={[1, 2, 3, 4]}
  onChange={setOtp}
  slotClassName="${AUTH_OVERRIDES.OTP_SLOT_CLASS}"
/>`;

const selectCode = `<SelectElement
  label="Language"
  placeholder="Choose a language"
  items={LANGUAGES}
  value={language}
  onValueChange={setLanguage}
/>`;

const chatCode = `<Message align="end">
  <MessageContent>
    <Bubble align="end">
      <BubbleContent>Loud and clear. Welcome to the room.</BubbleContent>
    </Bubble>
  </MessageContent>
</Message>`;

const sheetCode = `<SheetElement
  open={open}
  onOpenChange={setOpen}
  title="Room settings"
  description="Tune how this room translates."
>
  {content}
</SheetElement>`;

const modalCode = `<ModalElement source={coverUrl} alt="Room cover">
  <img src={coverUrl} alt="Room cover" className="h-28 w-40 rounded-2xl object-cover" />
</ModalElement>`;

const StylesPage = () => {
  const [active, setActive] = useState(NAV_ITEMS[0].id);
  const [language, setLanguage] = useState("English");
  const [inputMode, setInputMode] = useState("speak");
  const [micOn, setMicOn] = useState(true);
  const [autoDetect, setAutoDetect] = useState(true);
  const [saveTranscript, setSaveTranscript] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const offsets = NAV_ITEMS.map((item) => {
        const el = document.getElementById(item.id);
        if (!el) return { id: item.id, top: Infinity };
        return {
          id: item.id,
          top: Math.abs(el.getBoundingClientRect().top - 120),
        };
      });
      offsets.sort((a, b) => a.top - b.top);
      setActive(offsets[0].id);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <DivElement className="min-h-svh bg-background">
      <DivElement className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl backdrop-saturate-150">
        <DivElement className="mx-auto w-full max-w-7xl flex-row items-center justify-between gap-4 px-6 py-4 lg:px-12">
          <DivElement className="flex-row items-center gap-4">
            <Logo />
            <span className="hidden text-eyebrow md:inline">Design system</span>
          </DivElement>
          <DivElement className="flex-row items-center gap-3">
            <ModeToggle />
            <CopyForLLMButton />
          </DivElement>
        </DivElement>
      </DivElement>

      <DivElement className="mx-auto w-full max-w-7xl flex-row gap-12 px-6 py-10 lg:px-12">
        <StylesNav items={NAV_ITEMS} active={active} />

        <DivElement className="flex-1 min-w-0">
          <DivElement id="overview" className="scroll-mt-28 gap-5 pb-12">
            <span className="text-eyebrow">Paracomm · {NORTH_STAR.name}</span>
            <h1 className="text-display text-4xl md:text-6xl text-foreground max-w-3xl text-balance">
              The single source of truth for how Paracomm looks, moves, and
              feels.
            </h1>
            <p className="max-w-2xl text-[15px] leading-relaxed text-muted-foreground md:text-base">
              Trustworthy, modern, effortless. Dual mode, motion rich, built to
              flow like Apple. Click{" "}
              <span className="font-medium text-foreground">Copy for LLMs</span>{" "}
              up top to paste this whole spec into a new Claude session, where
              every token, gradient, motion preset, and file path lives in one
              markdown blob.
            </p>
            <DivElement className="flex-row flex-wrap gap-2 mt-2">
              <span className="rounded-full border border-border/60 bg-secondary/60 px-3 py-1 text-[11px] text-muted-foreground">
                Apple influenced
              </span>
              <span className="rounded-full border border-border/60 bg-secondary/60 px-3 py-1 text-[11px] text-muted-foreground">
                Dual mode by design
              </span>
              <span className="rounded-full border border-border/60 bg-secondary/60 px-3 py-1 text-[11px] text-muted-foreground">
                Spring motion (260/22)
              </span>
              <span className="rounded-full border border-border/60 bg-secondary/60 px-3 py-1 text-[11px] text-muted-foreground">
                Tailwind 4 · config in CSS
              </span>
            </DivElement>
          </DivElement>

          <StylesSection
            id="principles"
            eyebrow="Philosophy"
            title="North Star"
            description="The single metaphor every screen answers to. When a decision is ambiguous, this is the tiebreaker."
          >
            <DivElement className="gap-2 rounded-3xl border border-border/60 bg-card p-6 md:p-8">
              <span className="text-eyebrow">{NORTH_STAR.tagline}</span>
              <h3 className="text-hero text-3xl md:text-4xl text-foreground text-balance">
                {NORTH_STAR.name}
              </h3>
              <p className="max-w-2xl text-[15px] leading-relaxed text-muted-foreground md:text-base text-pretty">
                {NORTH_STAR.body}
              </p>
            </DivElement>

            <DivElement className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {DESIGN_RULES.map((rule) => (
                <DivElement
                  key={rule.name}
                  className="gap-2 rounded-2xl border border-border/60 bg-card p-5"
                >
                  <DivElement className="flex-row items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      {rule.name}
                    </span>
                    <span className="rounded-full border border-border/60 bg-secondary/60 px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                      {rule.section}
                    </span>
                  </DivElement>
                  <span className="text-[13px] leading-relaxed text-muted-foreground">
                    {rule.body}
                  </span>
                </DivElement>
              ))}
            </DivElement>
          </StylesSection>

          <StylesSection
            id="stack"
            eyebrow="Foundation"
            title="Stack"
            description="What this app runs on. Everything in components/ui is shadcn/ui; everything in components/elements is a project wrapper around it."
          >
            <DivElement className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {STACK_SUMMARY.map((s) => (
                <DivElement
                  key={s.name}
                  className="gap-1 rounded-2xl border border-border/60 bg-card p-4"
                >
                  <DivElement className="flex-row items-baseline gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      {s.name}
                    </span>
                    <code className="text-[11px] text-muted-foreground">
                      {s.version}
                    </code>
                  </DivElement>
                  {s.note && (
                    <span className="text-[12px] text-muted-foreground leading-relaxed">
                      {s.note}
                    </span>
                  )}
                </DivElement>
              ))}
            </DivElement>
          </StylesSection>

          <StylesSection
            id="colors"
            eyebrow="Tokens"
            title="Color tokens"
            description="Every variable in src/index.css. Each tile shows light (left) and dark (right) side by side so you can see both without toggling theme."
          >
            <DivElement className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {COLOR_TOKENS.map((token) => (
                <TokenSwatch key={token.name} token={token} />
              ))}
            </DivElement>
          </StylesSection>

          <StylesSection
            id="gradients"
            eyebrow="Brand"
            title="Signature gradients"
            description="Four signature gradients shared across the brand. Reserved for marketing surfaces and feature icon chips, never for data dense product screens."
          >
            <DivElement className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {GRADIENTS.map((g) => (
                <GradientSwatch key={g.name} gradient={g} />
              ))}
            </DivElement>
          </StylesSection>

          <StylesSection
            id="typography"
            eyebrow="Type"
            title="Typography utilities"
            description="Inter Variable, self hosted in src/index.css. Four named utilities cover every heading tier. Never set font weight or tracking ad hoc."
          >
            <DivElement className="gap-6">
              {TYPOGRAPHY_UTILITIES.map((t) => (
                <DivElement
                  key={t.utility}
                  className="gap-2 rounded-2xl border border-border/60 bg-card p-6"
                >
                  <span className="text-eyebrow">{t.utility}</span>
                  <p
                    className={
                      t.utility === ".text-display"
                        ? "text-display text-4xl md:text-5xl text-foreground"
                        : t.utility === ".text-hero"
                          ? "text-hero text-3xl md:text-4xl text-foreground"
                          : t.utility === ".text-headline"
                            ? "text-headline text-2xl md:text-3xl text-foreground"
                            : "text-eyebrow"
                    }
                  >
                    {t.sample}
                  </p>
                  <span className="text-[11px] text-muted-foreground">
                    {t.spec}
                  </span>
                </DivElement>
              ))}
            </DivElement>
          </StylesSection>

          <StylesSection
            id="radii"
            eyebrow="Geometry"
            title="Radius scale"
            description="Tailwind tokens derived from --radius (0.875rem / 14px). Inputs and buttons use rounded-xl, cards use rounded-2xl, elevated surfaces use rounded-3xl."
          >
            <DivElement className="grid grid-cols-2 gap-6 sm:grid-cols-4 lg:grid-cols-7">
              {RADII.map((r) => (
                <RadiusSwatch key={r.utility} token={r} />
              ))}
            </DivElement>
          </StylesSection>

          <StylesSection
            id="shadows"
            eyebrow="Elevation"
            title="Shadow tokens"
            description="Soft, layered shadows. The elevated card uses a two layer drop; the primary CTA glows in brand primary."
          >
            <DivElement className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {SHADOW_TOKENS.map((s) => (
                <ShadowSwatch
                  key={s.name}
                  name={s.name}
                  usage={s.usage}
                  classLight={s.classLight}
                  classDark={s.classDark}
                  shadowClass={
                    s.name === "Elevated card"
                      ? "shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.4),0_8px_32px_rgba(0,0,0,0.45)]"
                      : s.name === "Submit glow"
                        ? "shadow-[0_8px_20px_-10px_rgba(0,100,255,0.55)]"
                        : "shadow-[0_8px_24px_-12px_rgba(181,97,249,0.55)]"
                  }
                />
              ))}
            </DivElement>
          </StylesSection>

          <StylesSection
            id="motion"
            eyebrow="Motion"
            title="Spring presets"
            description="Three springs and one ease curve cover every animation in the app. Always import from `motion/react`, never the legacy framer-motion."
          >
            <DivElement className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {MOTION_PRESETS.map((p) => (
                <MotionDemo key={p.name} preset={p} />
              ))}
            </DivElement>
          </StylesSection>

          <StylesSection
            id="buttons"
            eyebrow="Primitives"
            title="Buttons"
            description="shadcn variants through the ButtonElement wrapper. Forms apply the SUBMIT_CLASS override on top of variant default for the brand glow."
          >
            <ComponentDemo
              name="Variants"
              description="Default, outline, secondary, ghost, destructive, link. All through the ButtonElement wrapper."
            >
              <DivElement className="flex-row flex-wrap items-center justify-center gap-3">
                <ButtonElement variant="default">Default</ButtonElement>
                <ButtonElement variant="outline">Outline</ButtonElement>
                <ButtonElement variant="secondary">Secondary</ButtonElement>
                <ButtonElement variant="ghost">Ghost</ButtonElement>
                <ButtonElement variant="destructive">Destructive</ButtonElement>
                <ButtonElement variant="link">Link</ButtonElement>
              </DivElement>
            </ComponentDemo>

            <ComponentDemo
              name="Sizes"
              description="sm · default (h-9) · lg · icon"
            >
              <DivElement className="flex-row flex-wrap items-center justify-center gap-3">
                <ButtonElement size="sm">sm</ButtonElement>
                <ButtonElement size="default">default</ButtonElement>
                <ButtonElement size="lg">lg</ButtonElement>
                <ButtonElement size="icon" variant="secondary">
                  <Mic className="size-4" />
                </ButtonElement>
              </DivElement>
            </ComponentDemo>

            <ComponentDemo
              name="Loading state"
              description="disabled plus isLoading swaps the children for LoadingElement."
            >
              <DivElement className="flex-row flex-wrap items-center justify-center gap-3">
                <ButtonElement variant="secondary" disabled isLoading>
                  Joining
                </ButtonElement>
                <ButtonElement
                  variant="default"
                  disabled
                  isLoading
                  className={AUTH_OVERRIDES.SUBMIT_CLASS + " max-w-40"}
                >
                  Joining
                </ButtonElement>
              </DivElement>
            </ComponentDemo>

            <ComponentDemo
              name="Primary submit button"
              description="ButtonElement plus SUBMIT_CLASS override. Taller, rounded-xl, brand glow shadow"
              code={buttonsCode}
            >
              <ButtonElement
                variant="default"
                type="button"
                className={AUTH_OVERRIDES.SUBMIT_CLASS}
                onClick={() => undefined}
              >
                Join room
              </ButtonElement>
            </ComponentDemo>
          </StylesSection>

          <StylesSection
            id="inputs"
            eyebrow="Primitives"
            title="Inputs & controls"
            description="InputElement wraps shadcn Input and accepts inputClassName for local overrides. FIELD_CLASS gives the taller, softer field used in every form. OtpElement, SelectElement, SegmentedTabsElement and SwitchElement cover the rest."
          >
            <ComponentDemo
              name="Form field"
              description="h-11 · rounded-xl · bg-secondary/60 (light) / bg-input/40 (dark)"
              code={fieldCode}
            >
              <DivElement className="w-full max-w-sm gap-2">
                <LabelElement
                  htmlFor="demo-email"
                  className="text-sm font-medium"
                >
                  Email
                </LabelElement>
                <InputElement
                  id="demo-email"
                  type="email"
                  placeholder="you@example.com"
                  inputClassName={AUTH_OVERRIDES.FIELD_CLASS}
                />
              </DivElement>
            </ComponentDemo>

            <ComponentDemo
              name="4 digit OTP"
              description="OtpElement with slotClassName override; first/last slots get rounded-xl ends"
              code={otpCode}
            >
              <OtpElement
                id="demo-otp"
                slots={[1, 2, 3, 4]}
                onChange={() => undefined}
                slotClassName={AUTH_OVERRIDES.OTP_SLOT_CLASS}
                groupClassName="gap-2 rounded-none"
              />
            </ComponentDemo>

            <ComponentDemo
              name="SelectElement"
              description="String list select. The room language picker uses exactly this."
              code={selectCode}
            >
              <DivElement className="w-full max-w-sm gap-2">
                <LabelElement className="text-sm font-medium">
                  Your language
                </LabelElement>
                <SelectElement
                  label="Language"
                  placeholder="Choose a language"
                  items={LANGUAGES}
                  value={language}
                  onValueChange={setLanguage}
                />
              </DivElement>
            </ComponentDemo>

            <ComponentDemo
              name="SegmentedTabsElement"
              description="Pill switcher with a spring layoutId indicator. Used to flip between speaking and typing."
            >
              <SegmentedTabsElement
                tabs={[
                  { value: "speak", label: "Speak", icon: Mic },
                  { value: "type", label: "Type", icon: Keyboard },
                ]}
                value={inputMode}
                onChange={setInputMode}
                labelMode="always"
                layoutId="styles-input-mode"
              />
            </ComponentDemo>

            <ComponentDemo
              name="SwitchElement"
              description="Plain switch, or a full card row when label and description are given."
            >
              <DivElement className="w-full max-w-sm items-stretch gap-4">
                <DivElement className="flex-row items-center justify-between gap-3">
                  <span className="text-sm font-medium text-foreground">
                    Microphone
                  </span>
                  <SwitchElement checked={micOn} onCheckedChange={setMicOn} />
                </DivElement>
                <SwitchElement
                  checked={autoDetect}
                  onCheckedChange={setAutoDetect}
                  label="Auto detect language"
                  description="Pick the source language for you"
                />
              </DivElement>
            </ComponentDemo>
          </StylesSection>

          <StylesSection
            id="cards"
            eyebrow="Surfaces"
            title="Cards & chat"
            description="The shadcn Card primitive plus the chat primitives that carry every room conversation."
          >
            <ComponentDemo
              name="shadcn Card"
              description="rounded-2xl · bg-card · ring-foreground/10 · gap-6 py-6"
            >
              <Card className="w-full max-w-md">
                <CardHeader>
                  <CardTitle>Lightweight card</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Use for tiles, list items, and dense info, when you do not
                    need the elevated form surface.
                  </p>
                </CardContent>
              </Card>
            </ComponentDemo>

            <ComponentDemo
              name="Message & Bubble"
              description="Incoming messages sit left in secondary; your own sit right in primary. The tinted bubble carries the translation."
              code={chatCode}
            >
              <DivElement className="w-full max-w-md">
                <MessageGroup>
                  <Message>
                    <MessageContent>
                      <MessageHeader>{"Ama · French"}</MessageHeader>
                      <Bubble variant="secondary">
                        <BubbleContent>
                          {"Bonjour, tout le monde m'entend ?"}
                        </BubbleContent>
                      </Bubble>
                      <Bubble variant="tinted">
                        <BubbleContent>
                          {"Hello, can everyone hear me?"}
                        </BubbleContent>
                      </Bubble>
                    </MessageContent>
                  </Message>
                  <Message align="end">
                    <MessageContent>
                      <MessageHeader>{"You · English"}</MessageHeader>
                      <Bubble align="end">
                        <BubbleContent>
                          {"Loud and clear. Welcome to the room."}
                        </BubbleContent>
                      </Bubble>
                    </MessageContent>
                  </Message>
                </MessageGroup>
              </DivElement>
            </ComponentDemo>
          </StylesSection>

          <StylesSection
            id="feedback"
            eyebrow="Feedback"
            title="Status & feedback"
            description="Badge, progress, skeleton and empty state primitives. The hard rule: loading surfaces mirror the final layout, and an empty room says what to do next, never just that nothing is here."
          >
            <ComponentDemo
              name="BadgeElement"
              description="Status chips with optional icon and spring mount."
            >
              <DivElement className="flex-row flex-wrap items-center justify-center gap-3">
                <BadgeElement>Default</BadgeElement>
                <BadgeElement variant="secondary" icon={Globe2}>
                  Live translation
                </BadgeElement>
                <BadgeElement variant="outline">Outline</BadgeElement>
                <BadgeElement variant="destructive" icon={WifiOff}>
                  Disconnected
                </BadgeElement>
              </DivElement>
            </ComponentDemo>

            <ComponentDemo
              name="ProgressElement"
              description="indicatorClassName carries the tone."
            >
              <DivElement className="w-full max-w-sm gap-3">
                <ProgressElement value={72} label="72 percent" />
                <ProgressElement
                  value={40}
                  indicatorClassName="bg-warning"
                  label="40 percent"
                />
                <ProgressElement
                  value={18}
                  indicatorClassName="bg-destructive"
                  label="18 percent"
                />
              </DivElement>
            </ComponentDemo>

            <ComponentDemo
              name="SkeletonElement"
              description="Loading placeholders shaped like the conversation they replace."
            >
              <DivElement className="w-full max-w-sm items-stretch gap-3">
                <DivElement className="flex-row items-end gap-2">
                  <SkeletonElement className="size-8 rounded-full" />
                  <SkeletonElement className="h-10 w-44 rounded-3xl" />
                </DivElement>
                <SkeletonElement className="h-10 w-52 self-end rounded-3xl" />
                <SkeletonElement className="h-4 w-24 rounded-full" />
              </DivElement>
            </ComponentDemo>

            <ComponentDemo
              name="EmptyState"
              description="Icon chip, headline, one line of guidance, one action. Spring entry."
            >
              <DivElement className="w-full max-w-md">
                <EmptyState
                  icon={MessagesSquare}
                  title="No messages yet"
                  description="Say something and the room hears it in every language."
                  actionLabel="Start speaking"
                  onAction={() => undefined}
                />
              </DivElement>
            </ComponentDemo>
          </StylesSection>

          <StylesSection
            id="overlays"
            eyebrow="Composition"
            title="Overlays"
            description="ModalElement for image lightboxes and SheetElement for side panels. Both spring in and out over a dimmed page."
          >
            <ComponentDemo
              name="SheetElement"
              description="Controlled side sheet with title and description header. Default side is right."
              code={sheetCode}
            >
              <ButtonElement
                variant="outline"
                type="button"
                onClick={() => setSheetOpen(true)}
              >
                <Settings2 className="size-4" />
                Open room settings
              </ButtonElement>
              <SheetElement
                open={sheetOpen}
                onOpenChange={setSheetOpen}
                title="Room settings"
                description="Tune how this room translates."
              >
                <DivElement className="gap-4">
                  <SwitchElement
                    checked={autoDetect}
                    onCheckedChange={setAutoDetect}
                    label="Auto detect language"
                    description="Pick the source language for you"
                  />
                  <SwitchElement
                    checked={saveTranscript}
                    onCheckedChange={setSaveTranscript}
                    label="Save transcript"
                    description="Keep a copy of this conversation"
                  />
                </DivElement>
              </SheetElement>
            </ComponentDemo>

            <ComponentDemo
              name="ModalElement"
              description="Wraps any trigger children and opens the image in a lightbox dialog."
              code={modalCode}
            >
              <ModalElement source={demoImage} alt="Room cover">
                <img
                  src={demoImage}
                  alt="Room cover"
                  className="h-28 w-40 cursor-pointer rounded-2xl object-cover"
                />
              </ModalElement>
            </ComponentDemo>
          </StylesSection>

          <StylesSection
            id="components"
            eyebrow="Reference"
            title="Components map"
            description="Where every reusable piece lives. Reuse before creating, so search this list first."
          >
            <DivElement className="overflow-hidden rounded-2xl border border-border/60 bg-card">
              {COMPONENT_PATHS.map((c, i) => (
                <DivElement
                  key={c.path}
                  className={`flex-row items-start gap-4 px-5 py-3 ${
                    i !== 0 ? "border-t border-border/60" : ""
                  }`}
                >
                  <code className="text-[12px] text-foreground shrink-0 w-full sm:w-72">
                    {c.path}
                  </code>
                  <span className="text-[12px] text-muted-foreground leading-relaxed">
                    {c.role}
                  </span>
                </DivElement>
              ))}
            </DivElement>
          </StylesSection>

          <StylesSection
            id="rules"
            eyebrow="Constitution"
            title="Architecture rules"
            description="From Architecture.md. Future Claude sessions are expected to follow these without being reminded."
          >
            <DivElement className="gap-3 rounded-2xl border border-border/60 bg-card p-6">
              {ARCHITECTURE_RULES.map((rule, i) => (
                <DivElement key={rule} className="flex-row items-start gap-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-primary/10 text-[11px] font-semibold text-primary">
                    {i + 1}
                  </span>
                  <span className="text-[14px] text-foreground leading-relaxed">
                    {rule}
                  </span>
                </DivElement>
              ))}
            </DivElement>
            <CodeBlock
              label="Thin route"
              code={`import RoomScreen from "@/files/room/screens/RoomScreen";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

const RoomRoute = () => {
  useDocumentTitle("Room | Paracomm");
  return <RoomScreen />;
};

export default RoomRoute;`}
            />
          </StylesSection>

          <DivElement className="border-t border-border/60 py-10 text-center">
            <p className="text-[12px] text-muted-foreground">
              Living spec. Edit{" "}
              <code className="text-foreground">
                src/constants/styleGuide.ts
              </code>{" "}
              to update both this page and the LLM payload.
            </p>
          </DivElement>
        </DivElement>
      </DivElement>
    </DivElement>
  );
};

export default StylesPage;
