<script lang="ts">
  import * as Sidebar from "$lib/components/ui/sidebar/index.js";
  import * as Collapsible from "$lib/components/ui/collapsible/index.js";
  import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
  import Database from "@lucide/svelte/icons/database";
  import Columns from "@lucide/svelte/icons/columns-3";
  import Ellipsis from "@lucide/svelte/icons/ellipsis-vertical";
  import Delete from "@lucide/svelte/icons/circle-x";

  import SquareFunction from "@lucide/svelte/icons/square-function";
  import { Table } from "peaql";
  import ColumnType from "./column-type.svelte";
  import { DateTime } from "luxon";
  import { cn } from "$lib/utils";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
  import { Button } from "$lib/components/ui/button";
  let {
    tables,
    showHistory,
    queryHistory = $bindable([]),
    onChange
  }: {
    tables: Array<Table>;
    showHistory: boolean;
    queryHistory: Array<{query: string; runtime: number; rows: number; date: number; error?: any; }>;
    onChange: (query: string) => void;
  } = $props();

  function deleteHistory(evt: MouseEvent, index: number) {
    queryHistory.splice(index, 1);
    evt.preventDefault();
    evt.stopImmediatePropagation();
    evt.stopPropagation();
  }

</script>

<Sidebar.Root>
  <Sidebar.Content>
  {#if showHistory}
    <Sidebar.Group class="px-0">
      <Sidebar.GroupLabel>Query History</Sidebar.GroupLabel>
      <Sidebar.GroupContent>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              {#snippet child({ props })}
                <Sidebar.MenuAction {...props}>
                  <Ellipsis />
                </Sidebar.MenuAction>
              {/snippet}
            </DropdownMenu.Trigger>
            <DropdownMenu.Content side="right" align="start">
              <DropdownMenu.Item>
                <span>Clear History</span>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        {#each queryHistory as history, i (history.date)}
        {@const date = DateTime.fromMillis(history.date)}
             <a
              href="##"
              onclick={() => onChange(history.query)}
              class={cn("group/del relative hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex flex-col items-start gap-2 whitespace-nowrap border-b p-4 text-sm leading-tight last:border-b-0", {
                "bg-destructive/20 hover:bg-destructive/20": history.error
              })}
            >
              <div class="flex w-full items-center gap-2">
                <span class="text-xs">
                  {history.rows} row(s) {history.runtime.toFixed(2)} ms</span>
                <span class="ml-auto text-xs">{date.toFormat("yyyy-MM-dd HH:mm")}</span>
              </div>
              <span class="line-clamp-2 w-[260px] whitespace-break-spaces text-xs font-mono">
                {history.query.replaceAll("\n", " ").trim()}
                <Button onclick={evt => deleteHistory(evt, i)} size="xs" class="opacity-0 absolute bottom-1 right-1 group-hover/del:opacity-100">
                  <Delete />
                </Button>
              </span>
            </a>
        {/each}
      </Sidebar.GroupContent>
    </Sidebar.Group>
  {:else}
    <Sidebar.Group>
      <Sidebar.GroupLabel>Tables</Sidebar.GroupLabel>
      <Sidebar.GroupContent class="w-full">
        <Sidebar.Menu class="w-full">
          {#each tables as table (table.name)}
            {@render treeTable({ table })}
          {/each}
        </Sidebar.Menu>
      </Sidebar.GroupContent>
    </Sidebar.Group>
  {/if}
  </Sidebar.Content>
</Sidebar.Root>

{#snippet treeTable({ table }: { table: Table })}
  <Sidebar.MenuItem class="w-full">
    <Collapsible.Root
      class="group/collapsible [&[data-state=open]>button>svg:first-child]:rotate-90 w-full"
    >
      <Collapsible.Trigger class="w-full">
        {#snippet child({ props })}
          <Sidebar.MenuButton {...props}>
            <ChevronRightIcon className="transition-transform" />
            <Database />
            <span>{table.name}</span>
          </Sidebar.MenuButton>
           <Sidebar.MenuBadge>{table.rows.length}</Sidebar.MenuBadge>
        {/snippet}
      </Collapsible.Trigger>
      <Collapsible.Content class="w-full">
        <Sidebar.MenuSub class="w-full">
          <Sidebar.MenuSubItem class="w-full">
            <Collapsible.Root
              class="group/collapsible [&[data-state=open]>button>svg:first-child]:rotate-90 w-full"
            >
              <Collapsible.Trigger class="w-full">
                {#snippet child({ props })}
                  <Sidebar.MenuButton {...props}>
                    <ChevronRightIcon className="transition-transform" />
                    <Columns />
                    <span>Columns</span>
                  </Sidebar.MenuButton>
                {/snippet}
              </Collapsible.Trigger>
              <Collapsible.Content class="w-full">
                <Sidebar.MenuSub>
                  {#each table.columns as [name, column]}
                    <Sidebar.MenuSubItem class="w-full">
                      <Sidebar.MenuSubButton
                        class="overflow-visible text-nowrap"
                      >
                        <ColumnType type={column.type} />
                        {name}
                      </Sidebar.MenuSubButton>
                    </Sidebar.MenuSubItem>
                  {/each}
                </Sidebar.MenuSub>
              </Collapsible.Content>
            </Collapsible.Root>
          </Sidebar.MenuSubItem>
          {#if table.constraints.length}
            <Sidebar.MenuSubItem class="w-full">
              <Collapsible.Root
                class="group/collapsible [&[data-state=open]>button>svg:first-child]:rotate-90 w-full"
              >
                <Collapsible.Trigger class="w-full">
                  {#snippet child({ props })}
                    <Sidebar.MenuButton {...props}>
                      <ChevronRightIcon className="transition-transform" />
                      <SquareFunction />
                      <span>Constraints</span>
                    </Sidebar.MenuButton>
                  {/snippet}
                </Collapsible.Trigger>
                <Collapsible.Content class="w-full">
                  <Sidebar.MenuSub class="w-full">
                    {#each table.constraints as constraint}
                      <Sidebar.MenuSubItem class="w-full">
                        <Sidebar.MenuSubButton
                          class="overflow-hidden text-nowrap w-full text-ellipsis break-all"
                          title={constraint.expr.expr?.toString()}
                        >
                          {`${constraint.name} ${constraint.column ?? ""}`.trim()}
                        </Sidebar.MenuSubButton>
                      </Sidebar.MenuSubItem>
                    {/each}
                  </Sidebar.MenuSub>
                </Collapsible.Content>
              </Collapsible.Root>
            </Sidebar.MenuSubItem>
          {/if}
        </Sidebar.MenuSub>
      </Collapsible.Content>
    </Collapsible.Root>
  </Sidebar.MenuItem>
{/snippet}
