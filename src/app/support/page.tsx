export default function SupportPage() {
  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <h1 className="text-2xl font-semibold text-foreground">Support</h1>
      <p className="mt-4 text-sm leading-relaxed text-foreground">
        Our support team can help you talk through your financial assessment and
        what your numbers mean for you.
      </p>
      <a
        href="/"
        className="mt-6 inline-flex min-h-6 min-w-6 items-center text-sm font-medium text-foreground underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
      >
        Back to persona picker
      </a>
    </main>
  );
}
