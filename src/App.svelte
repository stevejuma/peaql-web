<script lang="ts">
  import "@fontsource-variable/source-code-pro";
  import AppSidebar from "$lib/components/app-sidebar.svelte";
  import * as Sidebar from "$lib/components/ui/sidebar/index.js";
  import * as Resizable from "$lib/components/ui/resizable/index.js";
  import * as Menubar from "$lib/components/ui/menubar/index.js";

  import "./app.css";
  import SqlEditor from "$lib/components/sql-editor.svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import Execute from "@lucide/svelte/icons/play";
  import {
    createDatabase,
    CreateTableExpression,
    Expression,
    InsertExpression,
    ParseError,
    StatementError,
    StatementExpression,
    type CreateDatabaseProperties,
    type DType,
  } from "peaql";
  import QueryResults from "$lib/components/data-table/query-results.svelte";
  import { onMount, untrack } from "svelte";
  import * as Tabs from "$lib/components/ui/tabs/index.js";
  import * as Alert from "$lib/components/ui/alert/index.js";
  import AlertCircleIcon from "@lucide/svelte/icons/alert-circle";
  import { format } from "sql-formatter";
  import { Text } from "@codemirror/state";
  import useLocalStorage from "$lib/hooks/use-local-storage.svelte";
  import useIdbStorage from "$lib/use-db-storage.svelte";
  import ScrollArea from "$lib/components/ui/scroll-area/scroll-area.svelte";
  import { clear } from "idb-keyval";
  import demoSQL from "./lib/demo.sql?raw";
  import { Toggle } from "$lib/components/ui/toggle/index.js";
  import { DateTime } from "luxon";
  import { DEFAULT_DB, DEFAULT_QUERY } from "./dataset";
  import "../node_modules/github-fork-ribbon-css/gh-fork-ribbon.css";

  type Response = [Array<{ name: symbol; type: DType }>, Array<Array<unknown>>];
  type QueryResponse = {
    query: string;
    error?: any;
    results: Response;
    runtime: number;
    rows: number;
  };

  let showHistory: boolean = $state(false);

  let datasource: any = useIdbStorage("datasource", {});

  let db = $derived.by(() => {
    try {
      return createDatabase($state.snapshot(datasource.value));
    } catch (e) {
      return createDatabase(DEFAULT_DB);
    }
  });

  let selectedTab: "output" | "messages" = $state("output");

  let query = useLocalStorage("query", "");
  let queryHistory = useLocalStorage<
    Array<{
      query: string;
      runtime: number;
      rows: number;
      date: number;
      error?: any;
    }>
  >("queryHistory", []);
  let tables = $derived([...db.tables.values()]);

  function isDDL(expr: Expression) {
    return (
      expr instanceof CreateTableExpression ||
      expr instanceof InsertExpression ||
      (expr instanceof StatementExpression && expr.statements.some(isDDL))
    );
  }

  function saveDb() {
    const data: Record<string, CreateDatabaseProperties> = {};
    for (const [key, value] of db.tables.entries()) {
      data[key] = { data: value.toJSON() };
    }
    datasource.value = data;
  }

  function clearDatabase() {
    clear();
    query.value = "";
  }

  function updateHistory(results: QueryResponse) {
    const index = queryHistory.value.findIndex(
      (it) => it.query === results.query,
    );
    if (index !== -1) {
      queryHistory.value.splice(index, 1);
    }
    const value = [
      {
        query: results.query,
        runtime: results.runtime,
        rows: results.rows,
        date: DateTime.now().toMillis(),
        error: results.error,
      },
      ...queryHistory.value,
    ].slice(0, 50);
    queryHistory.value = value;
  }

  function executeQuery(query: string): QueryResponse {
    const startTime = performance.now();
    try {
      const statement = db.prepare(query);
      const response = db.execute(statement);
      const results: Response = Array.isArray(response) ?  response as Response : [[{name: "-", type: Object}], [[response]]];
      selectedTab = "output";
      if (isDDL(statement.expr)) {
        saveDb();
      }
      const result = {
        query,
        results,
        runtime: performance.now() - startTime,
        rows: results[1].length,
      };
      updateHistory(result);
      console.log(results);
      return result;
    } catch (error) {
      selectedTab = "messages";
      const result = {
        rows: 0,
        query,
        results: [[], []] as [
          Array<{ name: symbol; type: DType }>,
          Array<Array<unknown>>,
        ],
        runtime: performance.now() - startTime,
        error,
      };
      updateHistory(result);
      return result;
    }
  }

  let response: QueryResponse = $state({
    query: "",
    results: [[], [[]]],
    rows: 0,
    runtime: 0,
  });

  function errorMessage(error: any, qs: string) {
    let message: string = "";
    const query = Text.of(qs.split("\n"));

    if (error instanceof ParseError) {
      const pos = error.options.position;
      const line = query.lineAt(pos.from);
      message += `ERROR: ${error.message}\nLINE ${line.number}: ${query.sliceString(pos.from, Math.min(pos.to, line.to))}\n\nCHARACTER: ${pos.from}\n`;
    } else if (error instanceof StatementError) {
      message += error.statement.errors
        .map((err) => errorMessage(err, error.statement.query))
        .filter((it) => it.trim().length)
        .join("\n");
    } else if (
      "expression" in error &&
      error.expression instanceof Expression
    ) {
      const expr = error.expression as Expression;
      const line = query.lineAt(expr.parseInfo.pos);
      message += `ERROR: ${error.message}\nLINE ${line.number}: ${query.sliceString(expr.parseInfo.pos, line.to)}\n\nCHARACTER: ${expr.parseInfo.pos}\n`;
    } else {
      message += `ERROR: ${error}`;
    }

    console.log("err", error);
    return message;
  }

  function onDocChange(value: string) {
    query.value = value;
  }

  function resetDatabase() {
    clear().then(() => {
      executeQuery(demoSQL);
      query.value = DEFAULT_QUERY;
    });
  }

  $effect(() => {
    if (datasource.loaded === 1) {
      setTimeout(() => {
        response = executeQuery(query.value);
      });
    }
  })
</script>
<a class="github-fork-ribbon" href="https://github.com/stevejuma/peaql" data-ribbon="Fork me on GitHub" title="Fork me on GitHub">Fork me on GitHub</a>
<Sidebar.Provider style={`--sidebar-width: 300px;`}>
  <AppSidebar
    {showHistory}
    bind:queryHistory={queryHistory.value}
    {tables}
    onChange={(qs) => {
      query.value = qs;
    }}
  />
  <main class="w-full h-full relative">
    <div class="flex flex-row border-b-1">
      <div class="w-[45px]">
        <Sidebar.Trigger class="mx-1 my-1" />
      </div>
      <div class="my-1 flex flex-row items-center gap-1">
        <Menubar.Root>
          <Menubar.Menu>
            <Menubar.Trigger>Edit</Menubar.Trigger>
            <Menubar.Content>
              <Menubar.Item
                disabled={!!response.error}
                onclick={() => (query.value = format(query.value))}
                >Format</Menubar.Item
              >
            </Menubar.Content>
          </Menubar.Menu>
          <Menubar.Menu>
            <Menubar.Trigger>DB</Menubar.Trigger>
            <Menubar.Content>
              <Menubar.Item onclick={() => clearDatabase()}>Drop Database</Menubar.Item>
              <Menubar.Item onclick={() => resetDatabase()}>Reset Database</Menubar.Item>
              <Menubar.Item onclick={() => (query.value = demoSQL)}
                >Demo SQL</Menubar.Item
              >
            </Menubar.Content>
          </Menubar.Menu>
        </Menubar.Root>
        <Button onclick={() => (response = executeQuery(query.value))}>
          <Execute />
        </Button>
        <Toggle aria-label="toggle query history" bind:pressed={showHistory}>
          Query History
        </Toggle>
      </div>
    </div>
    <Resizable.PaneGroup direction="vertical" class="h-full min-h-svh">
      <Resizable.Pane defaultSize={45}>
        <ScrollArea orientation="both" class="h-full">
          <SqlEditor bind:content={query.value} {onDocChange} />
        </ScrollArea>
      </Resizable.Pane>
      <Resizable.Handle withHandle />
      <Resizable.Pane defaultSize={55} class="p-2">
        <Tabs.Root bind:value={selectedTab} class="h-full w-full">
          <Tabs.List>
            <Tabs.Trigger value="output">Data Output</Tabs.Trigger>
            <Tabs.Trigger value="messages">Messages</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="output" class="h-full w-full"> 
              <QueryResults results={response.results} />
          </Tabs.Content>
          <Tabs.Content value="messages" class="h-full">
            {#if response.error}
              <Alert.Root
                variant="destructive"
                class="h-[calc(100%_-_6rem)] overflow-auto"
              >
                <AlertCircleIcon />
                <Alert.Description
                  class="font-mono whitespace-pre overflow-auto"
                >
                  {errorMessage(response.error, response.query)}
                </Alert.Description>
              </Alert.Root>
            {:else}
              <div class="font-mono text-sm px-2 py-1">
                <div>
                  Successfully run. Total query runtime: {response.runtime.toFixed(
                    2,
                  )} msec
                </div>
                <div>{response.rows} rows affected.</div>
              </div>
            {/if}
          </Tabs.Content>
        </Tabs.Root>
      </Resizable.Pane>
    </Resizable.PaneGroup>
  </main>
</Sidebar.Provider>
