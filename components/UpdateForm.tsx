"use client";

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
  "w-full rounded-md border border-foreground/20 bg-background px-2 py-1.5 text-sm text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";

const actionButtonClassName =
  "inline-flex min-h-6 min-w-6 items-center justify-center rounded-md border border-foreground px-2 py-1 text-sm text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";

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
    <p id={id} className="mt-1 text-xs text-foreground">
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
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-foreground">
        {updateFormCopy.pageTitle}
      </h1>
      <p className="mt-2 text-sm text-foreground">{updateFormCopy.intro}</p>
      <p className="mt-1 text-sm text-foreground">
        {updateFormCopy.requiredNote}
      </p>

      {showErrorSummary && (
        <div
          id={errorSummaryId}
          ref={errorSummaryRef}
          role="alert"
          tabIndex={-1}
          className="mt-6 rounded-lg border border-foreground p-4 text-sm text-foreground"
        >
          <h2 className="font-semibold">{updateFormCopy.errorSummaryTitle}</h2>
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
                      className="underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
                    >
                      {error.message}
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <form action={formAction} className="mt-6 space-y-8">
        <fieldset className="rounded-lg border border-foreground/15 p-4">
          <legend className="px-1 text-base font-semibold text-foreground">
            {updateFormCopy.earnersLegend}
          </legend>
          <p id={amountHintId} className="mt-2 text-xs text-foreground">
            {updateFormCopy.amountHint}
          </p>

          <div className="mt-3 space-y-3">
            <div
              className="hidden gap-2 px-1 text-sm font-medium sm:grid sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto]"
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
                  className="grid gap-2 border-b border-foreground/10 pb-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto] sm:items-start"
                >
                  <div>
                    <label
                      htmlFor={labelId}
                      className="mb-1 block text-sm font-medium sm:sr-only"
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
                      className="mb-1 block text-sm font-medium sm:sr-only"
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
                  <div className="flex min-h-6 items-center">
                    <label className="inline-flex min-h-6 items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        name={`earners.${index}.variable`}
                        defaultChecked={row.variable}
                        aria-label={updateFormCopy.earnerVariable}
                        className="h-6 w-6 rounded border border-foreground/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
                      />
                      <span className="sm:sr-only">
                        {updateFormCopy.earnerVariable}
                      </span>
                    </label>
                  </div>
                  <div className="flex min-h-6 items-center">
                    {earnerRows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeEarnerRow(index)}
                        aria-label={updateFormCopy.removeEarner}
                        className={actionButtonClassName}
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={addEarnerRow}
            className={`mt-3 ${actionButtonClassName}`}
          >
            + {updateFormCopy.addEarner}
          </button>
        </fieldset>

        <fieldset className="rounded-lg border border-foreground/15 p-4">
          <legend className="px-1 text-base font-semibold text-foreground">
            {updateFormCopy.expenditureLegend}
          </legend>

          <div className="mt-3 space-y-3">
            <div
              className="hidden gap-2 px-1 text-sm font-medium sm:grid sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
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
                  className="grid gap-2 border-b border-foreground/10 pb-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-start"
                >
                  <div>
                    <label
                      htmlFor={labelId}
                      className="mb-1 block text-sm font-medium sm:sr-only"
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
                      className="mb-1 block text-sm font-medium sm:sr-only"
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
                  <div className="flex min-h-6 items-center">
                    {expenditureRows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeExpenditureRow(index)}
                        aria-label={updateFormCopy.removeExpenditure}
                        className={actionButtonClassName}
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={addExpenditureRow}
            className={`mt-3 ${actionButtonClassName}`}
          >
            + {updateFormCopy.addExpenditure}
          </button>
        </fieldset>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            className="inline-flex min-h-6 min-w-6 items-center justify-center rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          >
            {updateFormCopy.submit}
          </button>
          <a
            href="/dashboard"
            className="inline-flex min-h-6 min-w-6 items-center justify-center rounded-md border border-foreground px-4 py-2 text-sm font-medium text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          >
            {updateFormCopy.cancel}
          </a>
        </div>
      </form>
    </main>
  );
}
