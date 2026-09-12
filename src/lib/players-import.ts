import * as XLSX from "xlsx";

export const IMPORT_COLUMNS = [
  "nombre_completo",
  "nombre_camiseta",
  "dorsal",
  "posicion",
] as const;

export const INITIAL_PASSWORD = "Vikingos";

export type ImportRow = {
  key: string;
  line: number;
  fullName: string;
  shirtName: string;
  jersey: number | null;
  position: string;
  username: string;
  errors: string[];
  warnings: string[];
};

/** Genera y descarga la plantilla oficial .xlsx */
export function downloadTemplate() {
  const wb = XLSX.utils.book_new();
  const players = XLSX.utils.aoa_to_sheet([[...IMPORT_COLUMNS]]);
  players["!cols"] = [{ wch: 32 }, { wch: 22 }, { wch: 10 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, players, "JUGADORES");

  const help = XLSX.utils.aoa_to_sheet([
    ["Columna", "Qué se captura", "Ejemplo"],
    ["nombre_completo", "Nombre real completo del jugador", "Juan Carlos Pérez López"],
    ["nombre_camiseta", "Nombre que aparecerá en la camiseta", "JUAN CARLOS"],
    ["dorsal", "Número deportivo (solo números)", "23"],
    ["posicion", "Posición principal (se puede cambiar después)", "Defensa"],
    [],
    ["Captura un jugador por fila en la hoja JUGADORES. No borres la fila de títulos."],
    ["El usuario de acceso se genera con la primera palabra del nombre completo."],
    ["La contraseña inicial de todos los jugadores es: Vikingos"],
    ["La fotografía se agrega después desde Jugadores → Editar."],
  ]);
  help["!cols"] = [{ wch: 20 }, { wch: 46 }, { wch: 26 }];
  XLSX.utils.book_append_sheet(wb, help, "INSTRUCCIONES");

  XLSX.writeFile(wb, "Plantilla_Jugadores_Vikingos_FC.xlsx");
}

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

/** Usuario sugerido: primera palabra del nombre completo, sin acentos ni signos. */
export function suggestUsername(fullName: string) {
  const first = fullName.trim().split(/\s+/)[0] ?? "";
  const clean = first
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9]/g, "");
  return clean ? clean.charAt(0).toUpperCase() + clean.slice(1) : "";
}

export const usernameKey = (u: string) => norm(u).replace(/[^a-z0-9]/g, "");

/** Lee el .xlsx y devuelve las filas capturadas (sin validar). */
export async function parseWorkbook(file: File): Promise<ImportRow[]> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const sheetName =
    wb.SheetNames.find((n) => norm(n) === "jugadores") ??
    wb.SheetNames.find((n) => norm(n) !== "instrucciones") ??
    wb.SheetNames[0];
  if (!sheetName) throw new Error("El archivo no contiene ninguna hoja de cálculo.");
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[sheetName]!, {
    defval: "",
  });

  const first = raw[0];
  if (!first) throw new Error("La hoja JUGADORES no tiene jugadores capturados.");
  const headerMap = new Map(Object.keys(first).map((k) => [norm(k).replace(/\s+/g, "_"), k]));
  const missing = IMPORT_COLUMNS.filter((c) => !headerMap.has(c));
  if (missing.length)
    throw new Error(
      `El archivo no tiene las columnas requeridas: ${missing.join(", ")}. Descarga la plantilla oficial.`,
    );

  const val = (r: Record<string, unknown>, col: string) =>
    String(r[headerMap.get(col)!] ?? "").trim();

  return raw
    .map((r, i) => {
      const fullName = val(r, "nombre_completo");
      const shirtName = val(r, "nombre_camiseta");
      const dorsal = val(r, "dorsal");
      const position = val(r, "posicion");
      if (!fullName && !shirtName && !dorsal && !position) return null;
      const jersey = /^\d{1,3}$/.test(dorsal) ? Number(dorsal) : null;
      return {
        key: `row-${i}`,
        line: i + 2,
        fullName,
        shirtName,
        jersey,
        position,
        username: suggestUsername(fullName),
        errors: [],
        warnings: [],
        _dorsal: dorsal,
      } as ImportRow & { _dorsal: string };
    })
    .filter((r): r is ImportRow & { _dorsal: string } => r !== null)
    .map(({ _dorsal, ...row }) => {
      if (_dorsal && row.jersey === null) row.errors.push("Dorsal inválido");
      return row;
    });
}

/** Revalida todas las filas contra el archivo y contra los datos ya existentes. */
export function validateRows(
  rows: ImportRow[],
  existing: {
    usernames: string[];
    activeJerseys: Map<number, string>;
    playerNames: string[];
  },
): ImportRow[] {
  const takenUsers = new Set(existing.usernames.map(usernameKey));
  const names = new Set(existing.playerNames.map(norm));
  const userCount = new Map<string, number>();
  const jerseyCount = new Map<number, number>();
  for (const r of rows) {
    const uk = usernameKey(r.username);
    if (uk) userCount.set(uk, (userCount.get(uk) ?? 0) + 1);
    if (r.jersey !== null) jerseyCount.set(r.jersey, (jerseyCount.get(r.jersey) ?? 0) + 1);
  }

  return rows.map((r) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!r.fullName) errors.push("Falta el nombre completo");
    if (!r.shirtName) errors.push("Falta el nombre de camiseta");
    if (r.jersey === null) errors.push("Dorsal obligatorio y numérico");
    if (!r.position) errors.push("Falta la posición");

    const uk = usernameKey(r.username);
    if (!uk || uk.length < 2) errors.push("Usuario inválido");
    else if (takenUsers.has(uk)) errors.push("USUARIO DUPLICADO");
    else if ((userCount.get(uk) ?? 0) > 1) errors.push("USUARIO REPETIDO EN EL ARCHIVO");

    if (r.jersey !== null && (jerseyCount.get(r.jersey) ?? 0) > 1)
      errors.push("Dorsal repetido en el archivo");
    if (r.jersey !== null && existing.activeJerseys.has(r.jersey))
      warnings.push(`El dorsal ${r.jersey} ya lo usa ${existing.activeJerseys.get(r.jersey)}`);
    if (r.fullName && names.has(norm(r.fullName)))
      warnings.push("Ya existe un jugador con este nombre");

    return { ...r, errors, warnings };
  });
}
