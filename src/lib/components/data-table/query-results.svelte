<script lang="ts">
  import type { DType } from "peaql";
  import DataTable from "./data-table.svelte";
  import type { ColumnDef } from "@tanstack/table-core";
  let {
    results,
  }: {
    results: [Array<{ name: symbol; type: DType }>, Array<Array<unknown>>];
  } = $props();
  let [columnDef, dataSet] = $derived(results);
  let columns: Array<ColumnDef<Array<any>>> = $derived.by(() => {
    const cols = columnDef.map((col, id) => {
      const colDef: ColumnDef<any> = {
        id: `${col.name.description}_${id}`,
        header: col.name.description ?? col.name.toString(),
        accessorFn: (row) => {
          return row[id];
        },
      };
      return colDef;
    });
    return cols;
  });
</script>

<DataTable {columns} data={dataSet} />
