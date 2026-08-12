import type { Transition, Variants } from "motion/react";

export const SPRING = {
  card: { type: "spring", stiffness: 260, damping: 24 },
  panel: { type: "spring", stiffness: 260, damping: 22 },
  gradient: { type: "spring", stiffness: 260, damping: 20 },
  snappy: { type: "spring", stiffness: 440, damping: 34 },
  press: { type: "spring", stiffness: 600, damping: 30, mass: 0.6 },
} as const satisfies Record<string, Transition>;

export const FADE: Transition = { duration: 0.2 };

export const LANDING_EASE: Transition = {
  duration: 0.6,
  ease: [0.22, 1, 0.36, 1],
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: SPRING.card },
};

export const fadeScale: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 1, scale: 1, transition: SPRING.panel },
};

export const staggerParent = (stagger = 0.06, delayChildren = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren } },
});

export const TAP = { scale: 0.97 };
export const HOVER_LIFT = { y: -2 };

export const FLOAT: Transition = {
  duration: 2.4,
  repeat: Infinity,
  ease: "easeInOut",
};
export const FLOAT_Y = { y: [0, 5, 0] };

export const EQUALIZER_Y = { scaleY: [0.35, 1, 0.5, 0.85, 0.35] };
export const equalizerTransition = (delay = 0): Transition => ({
  duration: 0.9,
  repeat: Infinity,
  ease: "easeInOut",
  delay,
});
