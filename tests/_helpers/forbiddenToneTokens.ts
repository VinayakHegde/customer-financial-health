/** Tone tokens (R6) — collections-aggressive, punitive, or urgency language. */
export const toneTokens = [
  "must",
  "now",
  "urgent",
  "failed",
  "bad",
  "wrong",
  "should have",
  "guilty",
  "irresponsible",
  "irresponsible spending",
  "you owe",
  "pay now",
  "act now",
  "immediately",
  "deadline",
  "penalty",
  "default",
  "delinquent",
  "shame",
  "blame",
] as const;

/** Advice-implying tokens (R20) — language that could imply regulated financial advice. */
export const adviceImplyingTokens = [
  "recommend",
  "advise",
  "suggest you",
  "you should",
  "we recommend",
  "our advice",
  "financial advice",
  "you must",
  "best option",
  "you need to",
] as const;

/** Combined list for tone-guard tests across copy surfaces. */
export const forbiddenToneTokens = [
  ...toneTokens,
  ...adviceImplyingTokens,
] as const;
