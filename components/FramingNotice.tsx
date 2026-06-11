import { ArrowRight, Info } from "lucide-react";
import { framingNotice } from "../lib/affordability/framing";

const HEADING_ID = "framing-notice-heading";

export function FramingNotice() {
  const { headline, body, supportLink } = framingNotice();

  return (
    <aside
      aria-labelledby={HEADING_ID}
      className="mt-6 rounded-2xl border border-border bg-surface-muted p-5 sm:p-6"
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface text-muted ring-1 ring-border"
        >
          <Info aria-hidden="true" className="h-4 w-4" />
        </span>
        <div className="flex-1">
          <h2
            id={HEADING_ID}
            className="text-base font-semibold text-foreground"
          >
            {headline}
          </h2>
          <p className="mt-2 text-sm font-normal leading-relaxed text-foreground">
            {body}
          </p>
          <a
            href={supportLink.href}
            className="mt-3 inline-flex min-h-9 items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-foreground underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            <span>{supportLink.label}</span>
            <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </aside>
  );
}
