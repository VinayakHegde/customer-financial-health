"use client";

import {
  AlertTriangle,
  ArrowLeft,
  ClipboardList,
  Plus,
  Save,
  Trash2,
  Wallet,
} from "lucide-react";
import {
  useActionState,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  IncomeAndExpenditure,
  ValidationError,
} from "../lib/affordability/types";
import { updateFormCopy } from "../lib/update/copy";
import { fieldPathToDomId } from "../lib/update/fieldIds";
import type { UpdateSnapshotState } from "../lib/update/types";
import { BackToDashboardLink } from "./BackToDashboardLink";

type UpdateFormProps = {
  prefill?: IncomeAndExpenditure;
  initialEarnerCount?: number;
  action: (
    prevState: UpdateSnapshotState | null,
    formData: FormData,
  ) => Promise<UpdateSnapshotState>;
  /** Injected server state for unit tests (T24, T25, T37). */
  serverState?: UpdateSnapshotState | null;
};

type EarnerRow = {
  id: string;
  label: string;
  amount: string;
  variable: boolean;
};

type ExpenditureRow = {
  id: string;
  label: string;
  amount: string;
};

const inputClassName =
  "w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted/70 focus-visible:border-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";

const ghostButtonClassName =
  "inline-flex min-h-9 items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";

const removeButtonClassName =
  "inline-flex h-9 min-h-9 min-w-9 items-center justify-center rounded-md border border-border bg-surface text-muted transition-colors hover:border-border-strong hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";

function formatPenceForInput(pence: number): string {
  return (pence / 100).toFixed(2);
}

function createEarnerRow(
  values: Partial<Omit<EarnerRow, "id">> = {},
): EarnerRow {
  return {
    id: crypto.randomUUID(),
    label: values.label ?? "",
    amount: values.amount ?? "",
    variable: values.variable ?? false,
  };
}

function createExpenditureRow(
  values: Partial<Omit<ExpenditureRow, "id">> = {},
): ExpenditureRow {
  return {
    id: crypto.randomUUID(),
    label: values.label ?? "",
    amount: values.amount ?? "",
  };
}

function buildEarnerRows(
  prefill: IncomeAndExpenditure | undefined,
  initialEarnerCount: number,
): EarnerRow[] {
  if (prefill && prefill.earners.length > 0) {
    return prefill.earners.map((earner) =>
      createEarnerRow({
        label: earner.label,
        amount: formatPenceForInput(earner.amountPence),
        variable: earner.variable === true,
      }),
    );
  }

  return Array.from({ length: initialEarnerCount }, () => createEarnerRow());
}

function buildExpenditureRows(
  prefill: IncomeAndExpenditure | undefined,
): ExpenditureRow[] {
  if (prefill && prefill.expenditure.length > 0) {
    return prefill.expenditure.map((line) =>
      createExpenditureRow({
        label: line.label,
        amount: formatPenceForInput(line.amountPence),
      }),
    );
  }

  return [createExpenditureRow()];
}

function validationFieldToInputPath(field: string): string {
  return field.replace(/\.amountPence$/, ".amount");
}

function errorMessageForField(
  errors: ValidationError[],
  fieldPath: string,
): string | undefined {
  const normalized = validationFieldToInputPath(fieldPath);
  const match = errors.find(
    (error) => validationFieldToInputPath(error.field) === normalized,
  );
  return match?.message;
}

function FieldError({
  id,
  message,
}: {
  id: string | undefined;
  message: string | undefined;
}) {
  if (!message || !id) {
    return null;
  }

  return (
    <p id={id} className="mt-1 text-xs font-medium text-foreground">
      {message}
    </p>
  );
}

export function UpdateForm({
  prefill,
  initialEarnerCount = 1,
  action,
  serverState,
}: UpdateFormProps) {
  const amountHintId = useId();
  const errorSummaryId = useId();
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const [actionState, formAction] = useActionState(action, null);
  const state = serverState !== undefined ? serverState : actionState;

  const [earnerRows, setEarnerRows] = useState<EarnerRow[]>(() =>
    buildEarnerRows(prefill, initialEarnerCount),
  );
  const [expenditureRows, setExpenditureRows] = useState<ExpenditureRow[]>(() =>
    buildExpenditureRows(prefill),
  );

  const errors = state?.ok === false ? state.errors : [];
  const showErrorSummary = errors.length > 0;

  const fieldErrorIds = useMemo(() => {
    const ids = new Map<string, string>();
    for (const error of errors) {
      const inputPath = validationFieldToInputPath(error.field);
      ids.set(inputPath, `${fieldPathToDomId(inputPath)}-error`);
    }
    return ids;
  }, [errors]);

  useEffect(() => {
    if (showErrorSummary) {
      errorSummaryRef.current?.focus();
    }
  }, [showErrorSummary]);

  function addEarnerRow() {
    setEarnerRows((rows) => [...rows, createEarnerRow()]);
  }

  function removeEarnerRow(index: number) {
    setEarnerRows((rows) => rows.filter((_, rowIndex) => rowIndex !== index));
  }

  function addExpenditureRow() {
    setExpenditureRows((rows) => [...rows, createExpenditureRow()]);
  }

  function removeExpenditureRow(index: number) {
    setExpenditureRows((rows) =>
      rows.filter((_, rowIndex) => rowIndex !== index),
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-10">
      <BackToDashboardLink />

      <header className="fade-in-up mt-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          Edit your figures
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {updateFormCopy.pageTitle}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          {updateFormCopy.intro}
        </p>
        <p className="mt-1 text-xs text-muted">{updateFormCopy.requiredNote}</p>
      </header>

      {showErrorSummary && (
        <div
          id={errorSummaryId}
          ref={errorSummaryRef}
          role="alert"
          tabIndex={-1}
          className="fade-in-up mt-6 rounded-2xl border border-border-strong bg-surface-muted p-4 text-sm text-foreground shadow-sm"
        >
          <div className="flex items-start gap-2">
            <AlertTriangle
              aria-hidden="true"
              className="mt-0.5 h-4 w-4 text-foreground"
            />
            <div>
              <h2 className="font-semibold">
                {updateFormCopy.errorSummaryTitle}
              </h2>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {errors.map((error) => {
                  const inputPath = validationFieldToInputPath(error.field);
                  const targetId = fieldPathToDomId(inputPath);
                  return (
                    <li key={`${error.field}-${error.message}`}>
                      {error.field === "_" ? (
                        error.message
                      ) : (
                        <a
                          href={`#${targetId}`}
                          className="underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                        >
                          {error.message}
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      )}

      <form action={formAction} className="mt-6 space-y-6">
        <fieldset className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6">
          <legend className="flex items-center gap-2 px-1 text-base font-semibold text-foreground">
            <Wallet aria-hidden="true" className="h-4 w-4 text-muted" />
            <span>{updateFormCopy.earnersLegend}</span>
          </legend>
          <p id={amountHintId} className="mt-2 px-1 text-xs text-muted">
            {updateFormCopy.amountHint}
          </p>

          <div className="mt-4 space-y-3">
            <div
              className="hidden gap-3 px-1 text-xs font-medium uppercase tracking-wide text-muted sm:grid sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto]"
              aria-hidden="true"
            >
              <span>{updateFormCopy.nameColumn}</span>
              <span>{updateFormCopy.amountColumn}</span>
              <span>{updateFormCopy.variableColumn}</span>
              <span className="sr-only">{updateFormCopy.actionsColumn}</span>
            </div>

            {earnerRows.map((row, index) => {
              const labelPath = `earners.${index}.label`;
              const amountPath = `earners.${index}.amount`;
              const labelId = fieldPathToDomId(labelPath);
              const amountId = fieldPathToDomId(amountPath);
              const labelErrorId = fieldErrorIds.get(labelPath);
              const amountErrorId = fieldErrorIds.get(amountPath);
              const labelError = errorMessageForField(errors, labelPath);
              const amountError = errorMessageForField(errors, amountPath);

              return (
                <div
                  key={row.id}
                  className="grid gap-3 rounded-xl border border-border bg-surface-muted p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto] sm:items-start sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0"
                >
                  <div>
                    <label
                      htmlFor={labelId}
                      className="mb-1 block text-xs font-medium text-muted sm:sr-only"
                    >
                      {updateFormCopy.earnerLabel}
                    </label>
                    <input
                      id={labelId}
                      name={labelPath}
                      type="text"
                      defaultValue={row.label}
                      required
                      aria-invalid={labelError ? true : undefined}
                      aria-describedby={labelErrorId ? labelErrorId : undefined}
                      className={inputClassName}
                    />
                    <FieldError id={labelErrorId} message={labelError} />
                  </div>
                  <div>
                    <label
                      htmlFor={amountId}
                      className="mb-1 block text-xs font-medium text-muted sm:sr-only"
                    >
                      {updateFormCopy.earnerAmount}
                    </label>
                    <input
                      id={amountId}
                      name={amountPath}
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      defaultValue={row.amount}
                      required
                      aria-invalid={amountError ? true : undefined}
                      aria-describedby={
                        amountError
                          ? `${amountHintId} ${amountErrorId}`
                          : amountHintId
                      }
                      className={inputClassName}
                    />
                    <FieldError id={amountErrorId} message={amountError} />
                  </div>
                  <div className="flex min-h-9 items-center">
                    <label className="inline-flex min-h-9 items-center gap-2 text-sm text-foreground">
                      <input
                        type="checkbox"
                        name={`earners.${index}.variable`}
                        defaultChecked={row.variable}
                        aria-label={updateFormCopy.earnerVariable}
                        className="h-6 w-6 rounded border border-border accent-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                      />
                      <span className="sm:sr-only">
                        {updateFormCopy.earnerVariable}
                      </span>
                    </label>
                  </div>
                  <div className="flex min-h-9 items-center">
                    {earnerRows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeEarnerRow(index)}
                        aria-label={updateFormCopy.removeEarner}
                        className={removeButtonClassName}
                      >
                        <Trash2 aria-hidden="true" className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={addEarnerRow}
              className={ghostButtonClassName}
            >
              <Plus aria-hidden="true" className="h-3.5 w-3.5" />
              <span>{updateFormCopy.addEarner}</span>
            </button>
          </div>
        </fieldset>

        <fieldset className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6">
          <legend className="flex items-center gap-2 px-1 text-base font-semibold text-foreground">
            <ClipboardList aria-hidden="true" className="h-4 w-4 text-muted" />
            <span>{updateFormCopy.expenditureLegend}</span>
          </legend>

          <div className="mt-4 space-y-3">
            <div
              className="hidden gap-3 px-1 text-xs font-medium uppercase tracking-wide text-muted sm:grid sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
              aria-hidden="true"
            >
              <span>{updateFormCopy.nameColumn}</span>
              <span>{updateFormCopy.amountColumn}</span>
              <span className="sr-only">{updateFormCopy.actionsColumn}</span>
            </div>

            {expenditureRows.map((row, index) => {
              const labelPath = `expenditure.${index}.label`;
              const amountPath = `expenditure.${index}.amount`;
              const labelId = fieldPathToDomId(labelPath);
              const amountId = fieldPathToDomId(amountPath);
              const labelErrorId = fieldErrorIds.get(labelPath);
              const amountErrorId = fieldErrorIds.get(amountPath);
              const labelError = errorMessageForField(errors, labelPath);
              const amountError = errorMessageForField(errors, amountPath);

              return (
                <div
                  key={row.id}
                  className="grid gap-3 rounded-xl border border-border bg-surface-muted p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-start sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0"
                >
                  <div>
                    <label
                      htmlFor={labelId}
                      className="mb-1 block text-xs font-medium text-muted sm:sr-only"
                    >
                      {updateFormCopy.expenditureLabel}
                    </label>
                    <input
                      id={labelId}
                      name={labelPath}
                      type="text"
                      defaultValue={row.label}
                      required
                      aria-invalid={labelError ? true : undefined}
                      aria-describedby={labelErrorId ? labelErrorId : undefined}
                      className={inputClassName}
                    />
                    <FieldError id={labelErrorId} message={labelError} />
                  </div>
                  <div>
                    <label
                      htmlFor={amountId}
                      className="mb-1 block text-xs font-medium text-muted sm:sr-only"
                    >
                      {updateFormCopy.expenditureAmount}
                    </label>
                    <input
                      id={amountId}
                      name={amountPath}
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      defaultValue={row.amount}
                      required
                      aria-invalid={amountError ? true : undefined}
                      aria-describedby={
                        amountError
                          ? `${amountHintId} ${amountErrorId}`
                          : amountHintId
                      }
                      className={inputClassName}
                    />
                    <FieldError id={amountErrorId} message={amountError} />
                  </div>
                  <div className="flex min-h-9 items-center">
                    {expenditureRows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeExpenditureRow(index)}
                        aria-label={updateFormCopy.removeExpenditure}
                        className={removeButtonClassName}
                      >
                        <Trash2 aria-hidden="true" className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={addExpenditureRow}
              className={ghostButtonClassName}
            >
              <Plus aria-hidden="true" className="h-3.5 w-3.5" />
              <span>{updateFormCopy.addExpenditure}</span>
            </button>
          </div>
        </fieldset>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
          <a
            href="/dashboard"
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            <span>{updateFormCopy.cancel}</span>
          </a>
          <button
            type="submit"
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-accent px-5 py-2 text-sm font-semibold text-accent-foreground transition-colors hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            <Save aria-hidden="true" className="h-4 w-4" />
            <span>{updateFormCopy.submit}</span>
          </button>
        </div>
      </form>
    </main>
  );
}
