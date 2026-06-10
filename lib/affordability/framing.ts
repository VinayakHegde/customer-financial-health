import type { FramingCopy } from "./types";

export function framingNotice(): FramingCopy {
  return {
    headline: "About this assessment",
    body: "This is a reflection of the numbers you have shared with us — not financial advice. If you want guidance on what to do next, speak with our support team.",
    supportLink: {
      href: "/support",
      label: "Contact support",
    },
  };
}
