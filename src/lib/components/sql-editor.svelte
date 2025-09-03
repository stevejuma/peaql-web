<script lang="ts">
  import { sql } from "@codemirror/lang-sql";
  import { EditorState } from "@codemirror/state";
  import { EditorView, placeholder, ViewUpdate } from "@codemirror/view";
  import { basicSetup } from "codemirror";

  let {
    content = $bindable(""),
    onDocChange,
  }: {
    content: string;
    onDocChange: (value: string) => void;
  } = $props();

  let editorView!: EditorView;

  function codeMirror(el: HTMLElement, content: string) {
    editorView = new EditorView({
      state: EditorState.create({
        doc: content,
        extensions: [
          basicSetup,
          placeholder("...enter a SQL query."),
          sql(),
          EditorView.updateListener.of((v: ViewUpdate) => {
            if (v.docChanged) {
              onDocChange(v.state.doc.toString());
            }
          }),
        ],
      }),
      parent: el,
    });
    return {
      update: (content: string) => {
        const current = editorView.state.doc.toString();
        if (current === content) {
          return;
        }
        editorView.dispatch({
          changes: [
            { from: 0, to: editorView.state.doc.length, insert: content },
          ],
        });
      },
    };
  }
</script>

<div class="h-full">
  <div class="cm-scroller h-full">
    <div class="cm-sizer h-full">
      <div use:codeMirror={content} class="h-full"></div>
    </div>
  </div>
</div>
