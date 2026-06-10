import { framingNotice } from "../lib/affordability/framing";

const HEADING_ID = "framing-notice-heading";

export function FramingNotice() {
  const { headline, body, supportLink } = framingNotice();

  return (
    <aside
      aria-labelledby={HEADING_ID}
      className="mt-6 rounded-lg border border-foreground/15 p-4"
    >
      <h2 id={HEADING_ID} className="text-base font-semibold text-foreground">
        {headline}
      </h2>
      <p className="mt-2 text-sm font-normal leading-relaxed text-foreground">
        {body}
      </p>
      <a
        href={supportLink.href}
        className="mt-3 inline-flex min-h-6 min-w-6 items-center text-sm font-medium text-foreground underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
      >
        {supportLink.label}
      </a>
    </aside>
  );
}
