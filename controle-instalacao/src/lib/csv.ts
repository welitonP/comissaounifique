/** Serialização CSV compatível com o Excel em português (separador ";"). */

const SEPARATOR = ";";

function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const text = String(value);
  if (text.includes('"') || text.includes(SEPARATOR) || /[\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers.join(SEPARATOR)];
  for (const row of rows) lines.push(row.map(escapeCell).join(SEPARATOR));
  // BOM: sem ele o Excel abre os acentos quebrados.
  return `\ufeff${lines.join("\r\n")}\r\n`;
}

/** Divide uma linha respeitando aspas; aceita "," ou ";" como separador. */
function splitLine(line: string, separator: string): string[] {
  const cells: string[] = [];
  let current = "";
  let quoted = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (quoted) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === separator) {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells.map((cell) => cell.trim());
}

export type CsvTable = { headers: string[]; rows: Record<string, string>[] };

export function parseCsv(input: string): CsvTable {
  const text = input.replace(/^\ufeff/, "").replace(/\r\n?/g, "\n").trim();
  if (!text) return { headers: [], rows: [] };

  const lines = text.split("\n").filter((line) => line.trim().length > 0);
  const first = lines[0];
  // Escolhe o separador que aparece mais no cabeçalho.
  const separator = (first.match(/;/g)?.length ?? 0) >= (first.match(/,/g)?.length ?? 0) ? ";" : ",";

  const headers = splitLine(first, separator).map((header) => normalizeHeader(header));
  const rows: Record<string, string>[] = [];

  for (const line of lines.slice(1)) {
    const cells = splitLine(line, separator);
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = cells[index] ?? "";
    });
    rows.push(row);
  }

  return { headers, rows };
}

/** "Nº", "N.", "Numero" e "número" viram todos "numero". */
export function normalizeHeader(header: string): string {
  return header
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .replace(/^n$|^no$|^num$/, "numero");
}

export function csvResponse(filename: string, body: string): Response {
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
