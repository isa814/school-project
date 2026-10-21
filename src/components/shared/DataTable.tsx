import type { ReactNode } from "react";
import { DataTableClient, type ClientColumn, type ClientRow } from "@/components/shared/DataTableClient";

export type Column<T> = {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number;
  className?: string;
};

/**
 * Server-side table wrapper. It runs the column functions on the server and passes only
 * serializable data (pre-rendered cells, sort keys, search text) to the client table.
 */
export function DataTable<T extends { id: string }>({
  columns, rows, searchPlaceholder = "Search…", searchText, pageSize = 10, emptyTitle = "Nothing here yet", emptyDescription,
}: {
  columns: Column<T>[];
  rows: T[];
  searchPlaceholder?: string;
  searchText?: (row: T) => string;
  pageSize?: number;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  const clientColumns: ClientColumn[] = columns.map((c) => ({ key: c.key, header: c.header, className: c.className, sortable: Boolean(c.sortValue) }));
  const clientRows: ClientRow[] = rows.map((row) => {
    const cells: Record<string, ReactNode> = {};
    const sort: Record<string, string | number> = {};
    for (const c of columns) {
      cells[c.key] = c.cell(row);
      if (c.sortValue) sort[c.key] = c.sortValue(row);
    }
    return { id: row.id, cells, sort, search: searchText ? searchText(row) : "" };
  });
  return (
    <DataTableClient
      columns={clientColumns}
      rows={clientRows}
      searchPlaceholder={searchPlaceholder}
      hasSearch={Boolean(searchText)}
      pageSize={pageSize}
      emptyTitle={emptyTitle}
      emptyDescription={emptyDescription}
    />
  );
}
