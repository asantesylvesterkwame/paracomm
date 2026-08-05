import * as React from "react";
import { motion } from "motion/react";
import DivElement from "@/components/elements/DivElement";
import { cn } from "@/lib/utils";
import { SPRING, staggerParent, fadeUp } from "@/lib/motion";

type StylesSectionProps = {
  id: string;
  eyebrow: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
};

const StylesSection: React.FC<StylesSectionProps> = ({
  id,
  eyebrow,
  title,
  description,
  children,
  className,
}) => {
  return (
    <motion.section
      id={id}
      className={cn("scroll-mt-28 border-t border-border/60 py-16", className)}
      variants={staggerParent(0.08)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "0px 0px -120px 0px" }}
    >
      <DivElement className="gap-3">
        <motion.span variants={fadeUp} className="text-eyebrow">
          {eyebrow}
        </motion.span>
        <motion.h2
          variants={fadeUp}
          className="text-headline text-3xl md:text-4xl text-foreground text-balance"
        >
          {title}
        </motion.h2>
        {description && (
          <motion.p
            variants={fadeUp}
            className="max-w-2xl text-sm text-muted-foreground md:text-[15px] leading-relaxed text-pretty"
          >
            {description}
          </motion.p>
        )}
      </DivElement>
      <motion.div
        variants={fadeUp}
        transition={SPRING.card}
        className="mt-8 flex flex-col gap-8"
      >
        {children}
      </motion.div>
    </motion.section>
  );
};

export default StylesSection;
