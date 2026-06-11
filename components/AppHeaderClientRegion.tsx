"use client";

import {
  CircleUserRound,
  Gauge,
  History,
  LifeBuoy,
  PencilLine,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { switchPersona } from "../src/app/(main)/actions";

/**
 * The non-brand region of `<AppHeader />` — the primary nav, the active-persona
 * chip, and the right-side action (Switch persona / Support fallback).
 *
 * Rendered as a client component so a single `usePathname()` call can drive
 * two interleaved decisions: (a) which nav link should carry `aria-current="page"`,
 * and (b) whether to suppress the persona-aware UI entirely on `/` (the
 * persona picker — where we deliberately do not know "who the user is" yet,
 * so showing a persona chip would be misleading).
 *
 * The server `<AppHeader />` reads the persona cookie and hands the minimal
 * data needed (`hasPersona`, `firstName`) here; the client never reads the
 * cookie directly.
 */
type Props = {
  hasPersona: boolean;
  hasSnapshots: boolean;
  firstName: string | null;
};

export function AppHeaderClientRegion({
  hasPersona,
  hasSnapshots,
  firstName,
}: Props) {
  const pathname = usePathname();
  const onPersonaPicker = pathname === "/";
  const showPersonaUi = hasPersona && !onPersonaPicker;

  return (
    <>
      {showPersonaUi && (
        <nav
          aria-label="Primary"
          className="order-3 -mx-1 flex w-full items-center gap-1 overflow-x-auto sm:order-none sm:ml-4 sm:w-auto sm:overflow-visible"
        >
          <NavLink
            href="/dashboard"
            currentPath={pathname}
            icon={<Gauge aria-hidden="true" className="h-4 w-4" />}
          >
            Dashboard
          </NavLink>
          {/* New-customer (no-data) state: Update + History point at empty
              surfaces. The hero's renamed "Add my income & outgoings" CTA is
              the only first-submission path until at least one snapshot exists. */}
          {hasSnapshots && (
            <>
              <NavLink
                href="/dashboard/update"
                currentPath={pathname}
                icon={<PencilLine aria-hidden="true" className="h-4 w-4" />}
              >
                Update
              </NavLink>
              <NavLink
                href="/history"
                currentPath={pathname}
                icon={<History aria-hidden="true" className="h-4 w-4" />}
              >
                History
              </NavLink>
            </>
          )}
          <NavLink
            href="/support"
            currentPath={pathname}
            icon={<LifeBuoy aria-hidden="true" className="h-4 w-4" />}
          >
            Support
          </NavLink>
        </nav>
      )}

      <div className="ml-auto flex items-center gap-2 text-sm">
        {showPersonaUi && firstName ? (
          <>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-muted px-3 py-1 text-xs text-muted">
              <CircleUserRound aria-hidden="true" className="h-3.5 w-3.5" />
              <span className="font-medium text-foreground">{firstName}</span>
            </span>
            <form action={switchPersona} className="contents">
              <button
                type="submit"
                className="inline-flex min-h-6 cursor-pointer items-center rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
              >
                Switch persona
              </button>
            </form>
          </>
        ) : (
          <a
            href="/support"
            className="inline-flex min-h-6 items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            <LifeBuoy aria-hidden="true" className="h-3.5 w-3.5" />
            <span>Support</span>
          </a>
        )}
      </div>
    </>
  );
}

function NavLink({
  href,
  currentPath,
  icon,
  children,
}: {
  href: string;
  currentPath: string | null;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const isActive =
    currentPath === href ||
    (href !== "/" &&
      currentPath !== null &&
      currentPath.startsWith(`${href}/`));

  const stateClasses = isActive
    ? "bg-surface-muted text-foreground"
    : "text-muted hover:bg-surface-muted hover:text-foreground";

  return (
    <a
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={`inline-flex min-h-6 shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring ${stateClasses}`}
    >
      {icon}
      <span>{children}</span>
    </a>
  );
}
