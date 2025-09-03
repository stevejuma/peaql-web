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
  import { onMount } from "svelte";
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

  const DEFAULT_DB = {
    peaql: {
      data: {
        name: "peaql",
        columns: [
          {
            name: "album_id",
            type: "integer",
          },
          {
            name: "title",
            type: "string",
          },
          {
            name: "artist_id",
            type: "integer",
          },
        ],
        constraints: [
          {
            column: "album_id",
            expr: "album_id IS NOT NULL",
            name: "not-null",
          },
          {
            column: "title",
            expr: "title IS NOT NULL",
            name: "not-null",
          },
          {
            column: "artist_id",
            expr: "artist_id IS NOT NULL",
            name: "not-null",
          },
          {
            column: "artist_id",
            expr: "artist_id > 0",
            name: "album_artist_id_check",
          },
          {
            column: undefined,
            expr: "length(title) > 0",
            name: "name_not_empty",
          },
          {
            column: undefined,
            expr: "artist_id < 10",
            name: "album_artist_id_check",
          },
        ],
        data: [
          {
            album_id: 1,
            artist_id: 1,
            title: "For Those About To Rock We Salute You",
          },
          {
            album_id: 2,
            artist_id: 2,
            title: "Balls to the Wall",
          },
        ],
      },
    },
  };

  type QueryResponse = {
    query: string;
    error?: any;
    results: [Array<{ name: symbol; type: DType }>, Array<Array<unknown>>];
    runtime: number;
    rows: number;
  };

  let showHistory: boolean = $state(false);

  let datasource: any = useIdbStorage("datasource", DEFAULT_DB);

  let db = $derived.by(() => {
    try {
      return createDatabase(datasource.value);
    } catch (e) {
      return createDatabase(DEFAULT_DB);
    }
  });

  let selectedTab: "output" | "messages" = $state("output");

  let query = useLocalStorage("query", "select * from peaql");
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
    datasource.value = DEFAULT_DB;
    query.value = "SELECT * FROM peaql";
    executeQuery(query.value);
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
      const results = db.execute(statement);
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
      query.value = `select
  playlist.name,
  count(artist.artist_id)
from
  playlist
  join playlist_track pt on pt.playlist_id = playlist.playlist_id
  join track on track.track_id = pt.track_id
  join album on album.album_id = track.album_id
  join artist on artist.artist_id = album.artist_id
group by
  1
order by
  2 desc`;
    });
  }

  onMount(() => {
    setTimeout(() => {
      if (datasource.loaded == 1) {
        response = executeQuery(query.value);
      } else {
        response = executeQuery("SELECT * from peaql");
      }
    });
  });
</script>

<Sidebar.Provider style="--sidebar-width: 300px;">
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
              <Menubar.Item onclick={() => clearDatabase()}>Clear</Menubar.Item>
              <Menubar.Item onclick={() => resetDatabase()}>Reset</Menubar.Item>
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
      <Resizable.Pane defaultSize={55}>
        <ScrollArea orientation="both" class="h-full">
          <SqlEditor bind:content={query.value} {onDocChange} />
        </ScrollArea>
      </Resizable.Pane>
      <Resizable.Handle />
      <Resizable.Pane defaultSize={45} class="p-2">
        <Tabs.Root bind:value={selectedTab} class="h-full w-full">
          <Tabs.List>
            <Tabs.Trigger value="output">Data Output</Tabs.Trigger>
            <Tabs.Trigger value="messages">Messages</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="output" class="h-full">
            <ScrollArea class="h-[calc(100%_-_6rem)]">
              <QueryResults results={response.results} />
            </ScrollArea>
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
