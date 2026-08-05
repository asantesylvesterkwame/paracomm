export type ColorToken = {
  name: string;
  role: string;
  light: string;
  dark: string;
};

export type Gradient = {
  name: "green" | "blue" | "purple" | "pink";
  value: string;
  hexStops: string;
  swatchClass: string;
  shadowClass: string;
};

export type RadiusToken = {
  name: string;
  utility: string;
  value: string;
};

export type TypographyUtility = {
  name: string;
  utility: string;
  sample: string;
  spec: string;
};

export type MotionPreset = {
  name: string;
  usage: string;
  transition: string;
};

export type ComponentPath = {
  path: string;
  role: string;
};

export type DesignRule = {
  name: string;
  body: string;
  section: string;
};

export const NORTH_STAR = {
  name: "The Effortless Counter",
  tagline: "Trustworthy, modern, effortless.",
  body: "Paracomm is the counter of a great Apple Store reimagined for realtime conversation across languages: a premium, frictionless surface where the conversation is the hero and every interaction flows into the next. Trust is earned through clarity, honest hierarchy, and immediate feedback, never through noise. Restraint is the default; one brand blue and four signature gradients carry the energy when energy is warranted. Mobile is the design, not an adaptation.",
};

export const DESIGN_RULES: DesignRule[] = [
  {
    name: "The One Voice Rule",
    body: "Paracomm Blue is the only accent color on a standard product screen, and it stays under about 10% of the surface. Its scarcity is what makes a CTA read as the action.",
    section: "Color",
  },
  {
    name: "The Gradient Curfew Rule",
    body: "The four gradients live on brand and marketing surfaces. They are forbidden on data dense product screens, on body text, and as a page background.",
    section: "Color",
  },
  {
    name: "The Tight Crown Rule",
    body: "Large type carries negative tracking (-0.035em to -0.045em) and text-wrap balance on h1 to h3. The floor is -0.045em; never tighter.",
    section: "Type",
  },
  {
    name: "The Rationed Eyebrow Rule",
    body: "The eyebrow kicker is allowed but never above every section. One per page at most, where it genuinely orients.",
    section: "Type",
  },
  {
    name: "The Earned Shadow Rule",
    body: "Surfaces are flat at rest. A shadow appears as a response to state (elevation, hover, focus) or to mark the single most important action on screen. Decorative drop shadows are forbidden.",
    section: "Elevation",
  },
];

export const COLOR_TOKENS: ColorToken[] = [
  { name: "background", role: "Page surface", light: "#ffffff", dark: "#000000" },
  { name: "foreground", role: "Primary text", light: "#1d1d1f", dark: "#f5f5f7" },
  { name: "card", role: "Elevated card surface", light: "#ffffff", dark: "#1d1d1f" },
  { name: "card-foreground", role: "Text on card", light: "#1d1d1f", dark: "#f5f5f7" },
  { name: "popover", role: "Floating surfaces", light: "#ffffff", dark: "#1d1d1f" },
  { name: "popover-foreground", role: "Text on popover", light: "#1d1d1f", dark: "#f5f5f7" },
  { name: "primary", role: "Brand / CTA", light: "#0064ff", dark: "#30a2ff" },
  { name: "primary-foreground", role: "Text on primary", light: "#ffffff", dark: "#ffffff" },
  { name: "secondary", role: "Subtle surfaces", light: "#f5f5f7", dark: "#1d1d1f" },
  { name: "secondary-foreground", role: "Text on secondary", light: "#1d1d1f", dark: "#f5f5f7" },
  { name: "muted", role: "Muted backgrounds", light: "#f5f5f7", dark: "#1d1d1f" },
  { name: "muted-foreground", role: "Secondary text", light: "#6e6e73", dark: "#86868b" },
  { name: "accent", role: "Hover / accent fill", light: "#f5f5f7", dark: "#1d1d1f" },
  { name: "accent-foreground", role: "Text on accent", light: "#1d1d1f", dark: "#f5f5f7" },
  { name: "destructive", role: "Errors / danger", light: "#e0301e", dark: "#ff453a" },
  { name: "success", role: "Connected / confirmed", light: "#248a3d", dark: "#30d158" },
  { name: "warning", role: "Pending / needs attention", light: "#c77700", dark: "#ff9f0a" },
  { name: "border", role: "Hairline border", light: "#ebebeb", dark: "rgba(255,255,255,0.12)" },
  { name: "input", role: "Input border / fill", light: "#ebebeb", dark: "rgba(255,255,255,0.16)" },
  { name: "ring", role: "Focus ring", light: "#0064ff", dark: "#30a2ff" },
];

export const GRADIENTS: Gradient[] = [
  {
    name: "green",
    value: "linear-gradient(45deg, #30a8bc 0%, #4dda68 100%)",
    hexStops: "#30a8bc → #4dda68 · 45°",
    swatchClass: "bg-[linear-gradient(45deg,#30a8bc_0%,#4dda68_100%)]",
    shadowClass: "shadow-[0_8px_24px_-12px_rgba(77,218,104,0.55)]",
  },
  {
    name: "blue",
    value: "linear-gradient(315deg, #1860c4 0%, #58d0d9 100%)",
    hexStops: "#1860c4 → #58d0d9 · 315°",
    swatchClass: "bg-[linear-gradient(315deg,#1860c4_0%,#58d0d9_100%)]",
    shadowClass: "shadow-[0_8px_24px_-12px_rgba(88,208,217,0.55)]",
  },
  {
    name: "purple",
    value: "linear-gradient(45deg, #5138ec 0%, #b561f9 100%)",
    hexStops: "#5138ec → #b561f9 · 45°",
    swatchClass: "bg-[linear-gradient(45deg,#5138ec_0%,#b561f9_100%)]",
    shadowClass: "shadow-[0_8px_24px_-12px_rgba(181,97,249,0.55)]",
  },
  {
    name: "pink",
    value: "linear-gradient(315deg, #c84591 0%, #f7a17b 100%)",
    hexStops: "#c84591 → #f7a17b · 315°",
    swatchClass: "bg-[linear-gradient(315deg,#c84591_0%,#f7a17b_100%)]",
    shadowClass: "shadow-[0_8px_24px_-12px_rgba(247,161,123,0.55)]",
  },
];

export const RADII: RadiusToken[] = [
  { name: "sm", utility: "rounded-sm", value: "calc(0.875rem − 4px) ≈ 10px" },
  { name: "md", utility: "rounded-md", value: "calc(0.875rem − 2px) ≈ 12px" },
  { name: "lg", utility: "rounded-lg", value: "0.875rem (14px), the --radius base" },
  { name: "xl", utility: "rounded-xl", value: "calc(0.875rem + 4px) ≈ 18px" },
  { name: "2xl", utility: "rounded-2xl", value: "0.875rem × 1.8 ≈ 25px" },
  { name: "3xl", utility: "rounded-3xl", value: "0.875rem × 2.2 ≈ 31px" },
  { name: "4xl", utility: "rounded-4xl", value: "0.875rem × 2.6 ≈ 36px" },
];

export const TYPOGRAPHY_UTILITIES: TypographyUtility[] = [
  {
    name: "Display",
    utility: ".text-display",
    sample: "Two languages. One conversation.",
    spec: "weight 700 · tracking -0.045em · leading 1.05",
  },
  {
    name: "Hero",
    utility: ".text-hero",
    sample: "Speak once, be heard everywhere.",
    spec: "weight 600 · tracking -0.04em · leading 1.05",
  },
  {
    name: "Headline",
    utility: ".text-headline",
    sample: "Your room is waiting.",
    spec: "weight 600 · tracking -0.035em · leading 1.1",
  },
  {
    name: "Reading",
    utility: "text-[15px]",
    sample: "Secondary prose that should stay comfortable to read.",
    spec: "15px · weight 400 · leading 1.6 · half step between text-sm and text-base",
  },
  {
    name: "Eyebrow",
    utility: ".text-eyebrow",
    sample: "Welcome back",
    spec: "12px · weight 600 · tracking 0.12em · uppercase · text-primary",
  },
];

export const MOTION_PRESETS: MotionPreset[] = [
  {
    name: "Card entry",
    usage: "SPRING.card · form card initial reveal",
    transition: '{ type: "spring", stiffness: 260, damping: 24 }',
  },
  {
    name: "Panel content",
    usage: "SPRING.panel · eyebrow / title / subtitle stagger",
    transition: '{ type: "spring", stiffness: 260, damping: 22 }',
  },
  {
    name: "Gradient card",
    usage: "SPRING.gradient · gradient feature card staggered entry",
    transition: '{ type: "spring", stiffness: 260, damping: 20 }',
  },
  {
    name: "Landing ease",
    usage: "LANDING_EASE · hero / marketing reveals",
    transition: '{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }',
  },
];

export const SHADOW_TOKENS = [
  {
    name: "Elevated card",
    classLight:
      "shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_32px_rgba(0,0,0,0.06)]",
    classDark:
      "shadow-[0_1px_2px_rgba(0,0,0,0.4),0_8px_32px_rgba(0,0,0,0.45)]",
    usage: "Form card surface",
  },
  {
    name: "Submit glow",
    classLight:
      "shadow-[0_8px_20px_-10px_rgba(0,100,255,0.55)] hover:shadow-[0_10px_24px_-10px_rgba(0,100,255,0.7)]",
    classDark: "(same, uses brand primary)",
    usage: "SUBMIT_CLASS, the primary CTA elevation",
  },
  {
    name: "Gradient halo",
    classLight: "shadow-[0_8px_24px_-12px_<gradient-tint>]",
    classDark: "(same, color tinted per variant)",
    usage: "Gradient feature chip elevation",
  },
];

export const AUTH_OVERRIDES = {
  FIELD_CLASS:
    "h-11 rounded-xl border-border/60 bg-secondary/60 dark:bg-input/40 px-4 text-[15px] md:text-sm",
  SUBMIT_CLASS:
    "h-11 w-full rounded-xl text-[15px] font-medium shadow-[0_8px_20px_-10px_rgba(0,100,255,0.55)] hover:shadow-[0_10px_24px_-10px_rgba(0,100,255,0.7)] transition-shadow",
  OTP_SLOT_CLASS:
    "size-12 text-lg font-semibold border-border/60 bg-secondary/60 dark:bg-input/40 first:rounded-l-xl last:rounded-r-xl",
};

export const COMPONENT_PATHS: ComponentPath[] = [
  { path: "src/index.css", role: "All design tokens plus typography utilities (Tailwind 4, config in CSS)" },
  { path: "src/main.tsx", role: "Entry: ThemeProvider, RouterProvider, Toaster" },
  { path: "src/app/RootLayout.tsx", role: "Shared shell rendered around every route" },
  { path: "src/app/router.tsx", role: "createBrowserRouter map with thin route elements only" },
  { path: "src/constants/routes.constants.ts", role: "ROUTES constants, the only place paths are written" },
  { path: "src/components/ui/*", role: "shadcn/ui base maia primitives (Button, Input, Card, Dialog, Sheet, Bubble, Message, ...)" },
  { path: "src/components/elements/DivElement.tsx", role: "Default flex column wrapper with container/inverted types" },
  { path: "src/components/elements/ButtonElement.tsx", role: "Button wrapper; shows LoadingElement when disabled and isLoading" },
  { path: "src/components/elements/InputElement.tsx", role: "Input wrapper; forwards inputClassName, optional isButtoned action" },
  { path: "src/components/elements/OtpElement.tsx", role: "OTP wrapper; accepts slotClassName + groupClassName" },
  { path: "src/components/elements/SelectElement.tsx", role: "Select wrapper for string[] items" },
  { path: "src/components/elements/SegmentedTabsElement.tsx", role: "Pill tab switcher with spring layoutId indicator" },
  { path: "src/components/elements/SwitchElement.tsx", role: "Switch with optional label + description card row" },
  { path: "src/components/elements/BadgeElement.tsx", role: "Badge wrapper; optional icon + spring mount" },
  { path: "src/components/elements/ProgressElement.tsx", role: "Progress wrapper; indicatorClassName carries the tone" },
  { path: "src/components/elements/SkeletonElement.tsx", role: "Skeleton wrapper for loading placeholders" },
  { path: "src/components/elements/LoadingElement.tsx", role: "Spinner (size-6, text-primary)" },
  { path: "src/components/elements/ModalElement.tsx", role: "Image lightbox dialog wrapping any trigger children" },
  { path: "src/components/elements/DialogElement.tsx", role: "Re-exports the ui Dialog family" },
  { path: "src/components/elements/SheetElement.tsx", role: "Controlled side sheet with title + description header" },
  { path: "src/components/elements/LabelElement.tsx", role: "Label wrapper" },
  { path: "src/components/elements/TextareaElement.tsx", role: "Textarea wrapper" },
  { path: "src/components/common/EmptyState.tsx", role: "Icon + title + description + optional action, spring entry" },
  { path: "src/components/common/Logo.tsx", role: "Icon chip + Paracomm wordmark, links to home" },
  { path: "src/components/common/ModeToggle.tsx", role: "Light/Dark/System dropdown" },
  { path: "src/components/styles/StylesPage.tsx", role: "This living design system page" },
  { path: "src/constants/styleGuide.ts", role: "All data behind this page and the LLM payload" },
  { path: "src/providers/theme-provider.tsx", role: "Class strategy theme provider, system aware" },
  { path: "src/hooks/useDocumentTitle.ts", role: "Sets document.title per route" },
  { path: "src/lib/motion.ts", role: "SPRING presets, fadeUp, fadeScale, staggerParent" },
  { path: "src/lib/utils.ts", role: "cn() clsx + tailwind merge" },
  { path: "src/utils/index.ts", role: "notify() sonner pipeline" },
  { path: "worker/index.ts", role: "Cloudflare Worker serving the SPA assets, never product logic" },
];

export const ARCHITECTURE_RULES = [
  "Identify the entity first. Existing entities live under src/files/<entity>/; new ones scaffold the full module.",
  "Check components/elements and components/common before creating anything. Extend, never duplicate.",
  "Missing primitive: install the shadcn component, restyle it to the tokens, add spring enter and exit, wrap it as an Element.",
  "Every API call flows through handleApiAction inside a use<Entity> hook, with per action loading flags and notify validation.",
  "Shared or realtime state lives in <entity>.context.tsx; all realtime goes through RoomSocketContext, never socket.io.",
  "Routes stay thin: a ROUTES constant, a thin route file, a router.tsx entry. Screens live in files/<entity>/screens.",
  "No components/ui imports, hardcoded tokens, or inline transitions in feature code. Import motion presets from src/lib/motion.ts.",
  "Storage and toast only via SecureStoreService and notify; axios lives only in src/api and files/auth.",
  "No VITE_* reads outside src/api and context; worker/index.ts never contains product logic.",
  "No cross entity component imports; promote to common first. Anything repeated twice gets extracted immediately.",
  "Every screen ships responsive, in both themes, with springy enter and exit.",
];

export const STACK_SUMMARY = [
  { name: "Vite", version: "8.x", note: "SPA served by Cloudflare Workers Assets" },
  { name: "React", version: "19.2", note: "Stable" },
  { name: "TypeScript", version: "6.x", note: "" },
  { name: "Tailwind CSS", version: "4.x", note: "Config in CSS in src/index.css" },
  { name: "shadcn/ui", version: "—", note: "base maia style on @base-ui/react, components/ui/*" },
  { name: "motion", version: "12.x", note: "Import from motion/react; presets in src/lib/motion.ts" },
  { name: "react-router-dom", version: "7.x", note: "createBrowserRouter, thin route elements" },
  { name: "Theme provider", version: "—", note: "Class on html, system aware, in src/providers" },
  { name: "sonner", version: "2.x", note: "Toaster fed only through notify in src/utils" },
  { name: "lucide-react", version: "1.x", note: "All inline icons" },
  { name: "input-otp", version: "1.4.x", note: "OTP slots underpinning OtpElement" },
  { name: "Inter Variable", version: "—", note: "Self hosted @font-face in src/index.css" },
];

const renderColorRow = (t: ColorToken) =>
  `| --${t.name} | ${t.role} | ${t.light} | ${t.dark} |`;

const renderPathRow = (c: ComponentPath) => `- \`${c.path}\` — ${c.role}`;

export const STYLE_GUIDE_MARKDOWN = `# Paracomm frontend — Design System Snapshot

Paste this into a fresh Claude session to skip the discovery phase. Live page: \`/styles\`.

## Stack

${STACK_SUMMARY.map((s) => `- **${s.name}** ${s.version}${s.note ? ` — ${s.note}` : ""}`).join("\n")}

No \`tailwind.config.js\` — Tailwind 4 reads tokens from \`src/index.css\` via \`@theme\` + \`:root\` / \`.dark\`.

## Brand

- Primary: \`#0064ff\` (light) / \`#30a2ff\` (dark) — token \`--primary\`
- Font: Inter Variable, self hosted \`@font-face\` in \`src/index.css\` → \`--font-sans\`
- Logo: Languages icon chip + Paracomm wordmark (\`src/components/common/Logo.tsx\`)

## North Star

**${NORTH_STAR.name}** — ${NORTH_STAR.tagline}

${NORTH_STAR.body}

## Design rules

${DESIGN_RULES.map((r) => `- **${r.name}** (${r.section}): ${r.body}`).join("\n")}

## Color tokens

| Token | Role | Light | Dark |
|---|---|---|---|
${COLOR_TOKENS.map(renderColorRow).join("\n")}

## Brand gradients

${GRADIENTS.map((g) => `- **${g.name}**: \`${g.value}\``).join("\n")}

## Typography utilities (defined in \`src/index.css\`)

${TYPOGRAPHY_UTILITIES.map((t) => `- \`${t.utility}\` — ${t.spec}`).join("\n")}

## Radius scale (from \`@theme\` block; base \`--radius: 0.875rem\`)

${RADII.map((r) => `- \`${r.utility}\` — ${r.value}`).join("\n")}

## Motion presets (from \`src/lib/motion.ts\`)

${MOTION_PRESETS.map((m) => `- **${m.name}** (${m.usage}): \`${m.transition}\``).join("\n")}

## Form design overrides (scoped, applied via className — do not change globals)

- \`FIELD_CLASS\` = \`${AUTH_OVERRIDES.FIELD_CLASS}\`
- \`SUBMIT_CLASS\` = \`${AUTH_OVERRIDES.SUBMIT_CLASS}\`
- \`OTP_SLOT_CLASS\` = \`${AUTH_OVERRIDES.OTP_SLOT_CLASS}\`

## File map

${COMPONENT_PATHS.map(renderPathRow).join("\n")}

## Architecture rules (Architecture.md)

${ARCHITECTURE_RULES.map((r, i) => `${i + 1}. ${r}`).join("\n")}

## Pattern recipes

### Thin route

\`\`\`tsx
import RoomScreen from "@/files/room/screens/RoomScreen";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

const RoomRoute = () => {
  useDocumentTitle("Room | Paracomm");
  return <RoomScreen />;
};

export default RoomRoute;
\`\`\`

Register it in \`src/app/router.tsx\` with a constant from \`src/constants/routes.constants.ts\`; never hardcode a path.

### Form field

\`\`\`tsx
<InputElement
  id="email"
  type="email"
  placeholder="you@example.com"
  inputClassName="${AUTH_OVERRIDES.FIELD_CLASS}"
  onChange={(e) => setEmail(e.target.value)}
  required
/>
\`\`\`

### Primary submit button

\`\`\`tsx
<ButtonElement
  type="submit"
  variant="default"
  className="${AUTH_OVERRIDES.SUBMIT_CLASS}"
  onClick={handleJoinRoom}
  isLoading={isLoading}
>
  Join room
</ButtonElement>
\`\`\`

### Motion (always via \`motion/react\` + \`src/lib/motion.ts\`)

\`\`\`tsx
import { motion } from "motion/react";
import { SPRING } from "@/lib/motion";

<motion.div
  initial={{ opacity: 0, y: 18 }}
  animate={{ opacity: 1, y: 0 }}
  transition={SPRING.panel}
>
  ...
</motion.div>
\`\`\`
`;
