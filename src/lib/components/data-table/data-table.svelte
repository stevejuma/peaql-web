<script lang="ts" generics="TData, TValue">
  import { type ColumnDef, getCoreRowModel } from "@tanstack/table-core";
  import {
    createSvelteTable,
    FlexRender,
  } from "$lib/components/ui/data-table/index.js";
  import * as Table from "$lib/components/ui/table/index.js";
  import { Decimal } from "peaql";
  import { createVirtualizer } from "$lib/hooks/virtual.svelte";
  import ScrollArea from "$lib/components/ui/scroll-area/scroll-area.svelte";
    import { DateTime } from "luxon";

  type DataTableProps<TData, TValue> = {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
  };

   const table = createSvelteTable({
    get data() {
      return data;
    },
    get columns() {
      return columns;
    },
    getCoreRowModel: getCoreRowModel(),
  });

  let { data, columns }: DataTableProps<TData, TValue> = $props();
  let tableContainerRef: HTMLDivElement | null = $state(null);
  let rows = $derived(table.getRowModel().rows);

  let virtualizer = createVirtualizer({
    get count() {
      return rows.length;
    },
    getScrollElement: () => tableContainerRef,
    estimateSize: () => 37,
    overscan: 5,
  });

  $effect(() => {
    virtualizer.setOptions({ count: rows.length });
  });

  let [paddingTop, paddingBottom] = $derived.by(() => {
    const items = virtualizer.getVirtualItems();
    return items.length > 0
      ? [
          Math.max(0, items[0].start - virtualizer.options.scrollMargin),
          Math.max(0, virtualizer.getTotalSize() - items[items.length - 1].end),
        ]
      : [0, 0];
  });

</script>
<ScrollArea orientation="both" class="w-full border-t" style="height: calc(100% - 100px);" bind:ref={tableContainerRef}>
<div class="relative" style="height: {virtualizer.getTotalSize() + 37}px;">
    <Table.Root class="w-full rounded-md border">
      <Table.Header class="sticky top-0 bg-secondary text-foreground">
        {#each table.getHeaderGroups() as headerGroup}
          <Table.Row>
            {#each headerGroup.headers as header}
              <Table.Head colspan={header.colSpan}>
                {#if !header.isPlaceholder}
                  <FlexRender
                    content={header.column.columnDef.header}
                    context={header.getContext()}
                  />
                {/if}
              </Table.Head>
            {/each}
          </Table.Row>
        {/each}
      </Table.Header>
      <Table.Body>
        {#if paddingTop}
          <Table.Row>
            <Table.Cell
              colspan={columns.length}
              style="height: {paddingTop}px;}"
            ></Table.Cell>
          </Table.Row>
        {/if}
         {#each  virtualizer.getVirtualItems() as virtualRow (virtualRow.key)}
          {@const row = rows[virtualRow.index]}
          {#if row}
          <Table.Row data-state={row.getIsSelected() && "selected"} class="h-[37px]">
            {#each row.getVisibleCells() as cell (cell.id)}
              <Table.Cell>
                {@const value = cell.getValue()}
                {#if value instanceof DateTime}
                   <input class="font-mono" type="datetime-local" disabled  value={value.toISO()?.substring(0, 16)} />
                {:else}
                   <span>{value}</span>
                {/if}
              </Table.Cell>
            {/each}
          </Table.Row>
          {/if}
        {:else}
          <Table.Row>
            <Table.Cell colspan={columns.length} class="h-24 text-center">
              No results.
            </Table.Cell>
          </Table.Row>
        {/each}
        {#if paddingBottom}
          <Table.Row>
            <Table.Cell
              colspan={columns.length}
              style="height: {paddingBottom}px;"
            ></Table.Cell>
          </Table.Row>
        {/if}
      </Table.Body>
    </Table.Root>
</div>
</ScrollArea>
