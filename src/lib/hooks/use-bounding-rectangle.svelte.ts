import { onMount } from "svelte";

const useBoundingRect = () => {
  let ref = $state<HTMLElement>();
  let rect: DOMRect = $state()!;

  const update = () => {
    if (!ref) return;
    rect = ref.getBoundingClientRect();
  };

  onMount(() => {
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update);
    update();
  });

  return {
    get ref() {
      return ref;
    },
    get rect() {
      return rect;
    },
    set ref(el) {
      ref = el;
    },
    update,
  };
};

export default useBoundingRect;
