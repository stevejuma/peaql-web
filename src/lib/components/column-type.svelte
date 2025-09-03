<script lang="ts">
  import { Decimal, INTEGER, type DType } from "peaql";
  import FileQuestion from "@lucide/svelte/icons/file-question";
  import TypeText from "@lucide/svelte/icons/text";
  import TypeNumber from "@lucide/svelte/icons/binary";
  import TypeBoolean from "@lucide/svelte/icons/check-square";
  import TypeDate from "@lucide/svelte/icons/calendar";
  import TypeDateTime from "@lucide/svelte/icons/clock";
  import { DateTime, Duration } from "luxon";

  let { type }: { type: DType } = $props();
</script>

{#if type === Boolean}
  <TypeBoolean />
{:else if type === DateTime || type === Duration}
  <TypeDateTime />
{:else if type === Date}
  <TypeDate />
{:else if type === Number || type == INTEGER || type === Decimal}
  <TypeNumber />
{:else if type === String}
  <TypeText />
{:else}
  <FileQuestion />
{/if}
