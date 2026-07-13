/**
 * Tiny CSV export helper — turns rows into a downloaded .csv, no dependencies.
 * Used for compliance/training reports a manager or EHS can hand to an auditor.
 */

function escapeCell(v: unknown): string {
  const s = v == null ? "" : String(v);
  // Quote if it contains a comma, quote, or newline.
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Build a CSV string from headers + rows (array of objects keyed by header). */
export function toCsv(headers: string[], rows: Record<string, unknown>[]): string {
  const head = headers.map(escapeCell).join(",");
  const body = rows.map(r => headers.map(h => escapeCell(r[h])).join(",")).join("\n");
  return `${head}\n${body}`;
}

/** Trigger a browser download of a CSV string. */
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
