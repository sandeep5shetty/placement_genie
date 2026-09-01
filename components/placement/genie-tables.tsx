import type { GenieTable } from "@/lib/placement/parse-genie";

function cellClassName(cell: string) {
  const upper = cell.toUpperCase();
  if (upper.includes("MISSING")) {
    return "px-3 py-2 font-medium text-destructive";
  }
  if (upper.includes("HAS") || upper.includes("MEETS")) {
    return "px-3 py-2 font-medium text-emerald-600 dark:text-emerald-400";
  }
  return "px-3 py-2 text-foreground";
}

function GenieTableView({ table }: { table: GenieTable }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border/50 bg-card/30 shadow-[var(--shadow-card)]">
      <table className="w-full min-w-[20rem] border-collapse text-left text-[12px]">
        <thead>
          <tr className="border-b border-border/50 bg-muted/40">
            {table.headers.map((header) => (
              <th
                className="px-3 py-2 font-medium text-muted-foreground"
                key={header}
                scope="col"
              >
                {header.replaceAll("_", " ")}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row) => (
            <tr
              className="border-b border-border/40 last:border-0"
              key={row.join("|")}
            >
              {row.map((cell, cellIndex) => {
                const header = table.headers.at(cellIndex) ?? "value";
                return (
                  <td className={cellClassName(cell)} key={`${header}-${cell}`}>
                    {cell}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function GenieTables({ tables }: { tables: GenieTable[] }) {
  if (tables.length === 0) {
    return null;
  }

  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
      {tables.map((table) => (
        <GenieTableView key={table.headers.join("|")} table={table} />
      ))}
    </div>
  );
}
