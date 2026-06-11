"use client";

import { Check, Copy, Link2, Share2 } from "lucide-react";
import {
  useActionState,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { createShareLinkAction } from "../src/app/(main)/dashboard/share/actions";

/**
 * Server-Action result shape for `createShareLinkAction`. Kept inline (not
 * exported from the action module) because the action module is a
 * `'use server'` boundary; importing types across that boundary is
 * permitted but inlining keeps the action file's surface narrow.
 */
export type ShareSnapshotFormState =
  | { ok: true; url: string; expiresAt: string }
  | { ok: false; errors: { field: string; message: string }[] }
  | null;

export type ShareSnapshotFormProps = {
  snapshotId: string;
  /** Optional injected state for unit tests (T66) — bypasses useActionState. */
  initialState?: ShareSnapshotFormState;
};

function formatExpiry(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * The Server Action returns a relative path (`/share/<token>`) so the
 * action stays free of host-resolution concerns and the on-the-wire payload
 * matches the shape T56 / T59 / T60 / T67 already assert against.
 *
 * The customer copies this link out of band (email, message, etc.) so the
 * recipient needs the absolute URL to follow it. The post-mint state only
 * appears after the Server Action round-trip (production) or via the
 * `initialState` prop (T66) — both run after hydration, so it is safe to
 * read `window.location.origin`. SSR fallback returns the path unchanged
 * (no markup mismatch — `useEffect` re-runs once mounted).
 */
function buildAbsoluteUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  if (typeof window === "undefined") {
    return path;
  }
  return `${window.location.origin}${path}`;
}

const COPY_FEEDBACK_MS = 2000;

export function ShareSnapshotForm({
  snapshotId,
  initialState = null,
}: ShareSnapshotFormProps) {
  const [state, formAction] = useActionState<ShareSnapshotFormState, FormData>(
    createShareLinkAction,
    initialState,
  );
  const expiryDescriptionId = useId();
  const errorId = useId();
  const inputId = useId();
  const statusId = useId();

  const [absoluteUrl, setAbsoluteUrl] = useState<string>(() =>
    state?.ok ? buildAbsoluteUrl(state.url) : "",
  );

  useEffect(() => {
    setAbsoluteUrl(state?.ok ? buildAbsoluteUrl(state.url) : "");
  }, [state]);

  type CopyStatus = "idle" | "copied" | "error";
  const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle");
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset the inline status whenever a fresh URL replaces the previous one.
  // Keeps the screen-reader announcement scoped to the current copy attempt.
  useEffect(() => {
    setCopyStatus("idle");
  }, []);

  // Auto-clear the "Copied" / "Press Ctrl+C" confirmation after a short
  // window so the button label returns to its idle state and the polite
  // live-region announcement does not linger.
  useEffect(() => {
    if (copyStatus === "idle") return;
    const timer = window.setTimeout(() => {
      setCopyStatus("idle");
    }, COPY_FEEDBACK_MS);
    return () => window.clearTimeout(timer);
  }, [copyStatus]);

  const handleCopy = useCallback(async () => {
    const value = absoluteUrl || (state?.ok ? state.url : "");
    if (!value) return;

    // Clipboard API is gated on secure contexts (https / localhost). On
    // older browsers or non-secure contexts we fall back to selecting the
    // input so the customer can press Ctrl/Cmd+C themselves — better than
    // an opaque failure with no recovery path.
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        setCopyStatus("copied");
        return;
      }
    } catch {
      // fall through to the manual-select fallback
    }
    if (inputRef.current) {
      inputRef.current.select();
      inputRef.current.setSelectionRange(0, value.length);
    }
    setCopyStatus("error");
  }, [absoluteUrl, state]);

  const generic =
    state && !state.ok
      ? state.errors.find((error) => error.field === "_")?.message
      : undefined;

  return (
    <section className="rounded-2xl border border-border bg-surface-muted p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface text-muted ring-1 ring-border"
        >
          <Share2 aria-hidden="true" className="h-4 w-4" />
        </span>
        <div className="flex-1">
          <h2 className="text-base font-semibold text-foreground">
            Share this snapshot
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            Create a private link the recipient can open in any browser. The
            link expires after 24 hours.
          </p>

          {state?.ok ? (
            <div className="mt-3">
              <label
                htmlFor={inputId}
                className="block text-xs font-medium uppercase tracking-wide text-muted"
              >
                Share link
              </label>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  ref={inputRef}
                  id={inputId}
                  type="text"
                  readOnly
                  value={absoluteUrl || state.url}
                  aria-describedby={`${expiryDescriptionId} ${statusId}`}
                  className="min-h-10 flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground tabular-nums focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  aria-describedby={statusId}
                  className="inline-flex min-h-10 min-w-[6rem] shrink-0 items-center justify-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                >
                  {copyStatus === "copied" ? (
                    <>
                      <Check aria-hidden="true" className="h-4 w-4" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy aria-hidden="true" className="h-4 w-4" />
                      <span>Copy link</span>
                    </>
                  )}
                </button>
              </div>
              <output id={statusId} aria-live="polite" className="sr-only">
                {copyStatus === "copied"
                  ? "Link copied to clipboard."
                  : copyStatus === "error"
                    ? "Could not copy automatically. The link is selected — press Ctrl or Cmd plus C to copy."
                    : ""}
              </output>
              <p id={expiryDescriptionId} className="mt-2 text-xs text-muted">
                Expires on {formatExpiry(state.expiresAt)}.
              </p>
            </div>
          ) : (
            <form action={formAction} className="mt-3">
              <input type="hidden" name="snapshotId" value={snapshotId} />
              <button
                type="submit"
                aria-describedby={generic ? errorId : undefined}
                className="inline-flex min-h-10 min-w-[6rem] items-center justify-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-colors hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
              >
                <Link2 aria-hidden="true" className="h-4 w-4" />
                <span>Create share link</span>
              </button>
              {generic && (
                <p
                  id={errorId}
                  role="alert"
                  className="mt-2 text-sm text-foreground"
                >
                  {generic}
                </p>
              )}
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
