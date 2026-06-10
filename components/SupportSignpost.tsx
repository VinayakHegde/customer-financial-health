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
      className="rounded-lg border border-foreground/15 p-4"
    >
      <h2
        id={HEADING_ID}
        className={`text-base ${strong ? "font-semibold" : "font-medium"} text-foreground`}
      >
        Support
      </h2>
      <p
        className={`mt-2 text-sm leading-relaxed text-foreground ${strong ? "font-semibold" : "font-normal"}`}
      >
        {supportSignpost.message}
      </p>
      <a
        href={supportSignpost.href}
        className={`mt-3 inline-flex min-h-6 min-w-6 items-center text-sm text-foreground underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground ${strong ? "font-semibold" : "font-medium"}`}
      >
        {supportSignpost.label}
      </a>
    </section>
  );
}
