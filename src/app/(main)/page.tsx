import { ArrowRight, Compass, ShieldCheck, UsersRound } from "lucide-react";
import type { OutcomeState } from "../../../lib/affordability/types";
import { personas } from "../../../lib/personas";
import { selectPersona } from "./actions";

const personaTagLabels: Record<OutcomeState, string> = {
  surplus: "Surplus",
  breakeven: "Breakeven",
  shortfall: "Shortfall",
  "zero-income": "Zero income",
  "no-data": "New customer",
};

function describePersona(label: string): { name: string; context: string } {
  const [namePart, ...rest] = label.split("—");
  const name = (namePart ?? label).trim();
  const context = rest.join("—").trim();
  return { name, context: context.length > 0 ? context : "Demo persona" };
}

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-12">
      <section className="fade-in-up rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted">
          <Compass aria-hidden="true" className="h-4 w-4" />
          <span>Demo entry point</span>
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Pick a customer to explore.
        </h1>
        <p className="mt-3 max-w-prose text-base text-muted">
          Each persona is a synthetic snapshot of a household&apos;s monthly
          income and outgoings. Choose one to see how the affordability surface
          reads for that situation.
        </p>
        <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-surface-muted px-3 py-1 text-xs font-medium text-muted">
          <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" />
          <span>No real customer data — personas are fictional.</span>
        </p>
      </section>

      <form action={selectPersona} className="mt-8 space-y-6">
        <fieldset className="rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-6">
          <legend className="flex items-center gap-2 px-1 text-base font-semibold text-foreground">
            <UsersRound aria-hidden="true" className="h-4 w-4 text-muted" />
            <span>Persona</span>
          </legend>
          <p className="mt-2 px-1 text-sm text-muted">
            Select one to continue. You can switch personas at any time from the
            top navigation.
          </p>

          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {personas.map((persona, index) => {
              const { name, context } = describePersona(persona.label);
              const inputId = `persona-${persona.id}`;
              return (
                <li key={persona.id} className="list-none">
                  <label
                    htmlFor={inputId}
                    className="group flex h-full cursor-pointer items-start gap-3 rounded-xl border border-border bg-surface p-4 transition-colors hover:border-border-strong hover:bg-surface-muted focus-within:border-foreground focus-within:ring-2 focus-within:ring-focus-ring/40 has-checked:border-foreground has-checked:bg-surface-muted"
                  >
                    <input
                      id={inputId}
                      type="radio"
                      name="personaId"
                      value={persona.id}
                      required
                      defaultChecked={index === 0}
                      className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                    />
                    <span className="flex flex-1 flex-col gap-1">
                      <span className="flex flex-wrap items-baseline gap-2">
                        <span className="text-base font-semibold text-foreground">
                          {name}
                        </span>
                        <span className="text-xs font-medium uppercase tracking-wide text-muted">
                          {personaTagLabels[persona.expectedOutcome]}
                        </span>
                      </span>
                      <span className="text-sm leading-snug text-muted">
                        {context}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </fieldset>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted">
            Selecting a persona stores only an opaque persona id in a cookie.
          </p>
          <button
            type="submit"
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-accent px-5 py-2 text-sm font-semibold text-accent-foreground transition-colors hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            <span>Continue to dashboard</span>
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      </form>
    </main>
  );
}
