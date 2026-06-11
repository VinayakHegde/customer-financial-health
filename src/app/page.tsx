import { personas } from "../../lib/personas";
import { selectPersona } from "./actions";

export default function Home() {
  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <h1 className="text-2xl font-semibold text-foreground">
        Customer Financial Health
      </h1>
      <p className="mt-2 text-sm text-foreground">
        Choose a persona to explore the affordability dashboard.
      </p>
      <form action={selectPersona} className="mt-6 space-y-4">
        <div>
          <label htmlFor="personaId" className="block text-sm font-medium text-foreground">
            Persona
          </label>
          <select
            id="personaId"
            name="personaId"
            required
            className="mt-2 w-full rounded-md border border-foreground/20 bg-background px-3 py-2 text-sm text-foreground"
          >
            <option value="">Select a persona</option>
            {personas.map((persona) => (
              <option key={persona.id} value={persona.id}>
                {persona.label}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="inline-flex min-h-6 min-w-6 items-center justify-center rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
        >
          Continue to dashboard
        </button>
      </form>
    </main>
  );
}
