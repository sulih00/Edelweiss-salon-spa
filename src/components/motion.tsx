"use client";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

export function Reveal({
  children,
  delay = 0,
  y = 24,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  desc,
  align = "left",
  dark = false,
}: {
  eyebrow: string;
  title: string;
  desc?: string;
  align?: "left" | "center";
  dark?: boolean;
}) {
  return (
    <Reveal className={align === "center" ? "text-center" : ""}>
      <p className={`text-xs font-bold uppercase tracking-[0.3em] ${dark ? "text-gold-300" : "text-gold-500"}`}>
        {eyebrow}
      </p>
      <h2 className={`font-serif-display mt-2 text-3xl font-bold md:text-4xl ${dark ? "text-white" : "text-sage-900"}`}>
        {title}
      </h2>
      {desc && <p className={`mt-2 max-w-2xl text-sm md:text-base ${dark ? "text-white/70" : "text-stone-500"} ${align === "center" ? "mx-auto" : ""}`}>{desc}</p>}
    </Reveal>
  );
}
