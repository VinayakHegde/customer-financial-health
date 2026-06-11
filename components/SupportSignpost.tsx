import { ArrowRight, LifeBuoy } from "lucide-react";
import { getCopyForOutcome } from "../lib/affordability/copy";
import type { OutcomeState } from "../lib/affordability/types";

const HEADING_ID = "support-signpost-heading";

type SupportSignpostProps = {
  state: OutcomeState;
};

function usesStrongEmphasis(state: OutcomeState): boolean {
  return state === "shortfall" || state === "zero-income";
}

export function SupportSignpost({ state }: SupportSignpostProps) {
  const { supportSignpost } = getCopyForOutcome(state);
  const strong = usesStrongEmphasis(state);

  return (
    <section
      aria-labelledby={HEADING_ID}
      className={`rounded-2xl border p-5 shadow-sm sm:p-6 ${
        strong ? "border-border-strong bg-surface" : "border-border bg-surface"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
            strong
              ? "bg-accent text-accent-foreground"
              : "bg-surface-muted text-foreground"
          }`}
        >
          <LifeBuoy aria-hidden="true" className="h-4 w-4" />
        </span>
        <div className="flex-1">
          <h2
            id={HEADING_ID}
            className="text-base font-semibold text-foreground"
          >
            Support
          </h2>
          <p
            className={`mt-1 text-sm leading-relaxed text-foreground ${
              strong ? "font-medium" : "font-normal"
            }`}
          >
            {supportSignpost.message}
          </p>
          <a
            href={supportSignpost.href}
            className={`mt-3 inline-flex min-h-9 items-center gap-1.5 rounded-md px-2 py-1 text-sm text-foreground underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring ${
              strong ? "font-semibold" : "font-medium"
            }`}
          >
            <span>{supportSignpost.label}</span>
            <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </section>
  );
}
