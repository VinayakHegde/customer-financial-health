import { ArrowLeft, LifeBuoy, Mail, Phone } from "lucide-react";

export default function SupportPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-10">
      <section className="fade-in-up rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted">
          <LifeBuoy aria-hidden="true" className="h-4 w-4" />
          <span>Help &amp; contact</span>
        </div>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Support
        </h1>
        <p className="mt-2 text-sm text-muted">We&apos;re here to help.</p>
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-foreground">
          Our support team can help you talk through your financial assessment
          and what your numbers mean for you. This page is a placeholder for the
          demo — in a live product it would link to chat, phone, or email
          channels.
        </p>

        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          <li className="flex items-start gap-3 rounded-xl border border-border bg-surface-muted p-4 text-sm text-foreground">
            <Mail aria-hidden="true" className="mt-0.5 h-4 w-4 text-muted" />
            <div>
              <p className="font-medium">Email</p>
              <p className="text-muted">support@example.com (demo)</p>
            </div>
          </li>
          <li className="flex items-start gap-3 rounded-xl border border-border bg-surface-muted p-4 text-sm text-foreground">
            <Phone aria-hidden="true" className="mt-0.5 h-4 w-4 text-muted" />
            <div>
              <p className="font-medium">Phone</p>
              <p className="text-muted">0800 000 0000 (demo)</p>
            </div>
          </li>
        </ul>

        <a
          href="/"
          className="mt-6 inline-flex min-h-10 items-center gap-2 rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          <span>Back to persona picker</span>
        </a>
      </section>
    </main>
  );
}
