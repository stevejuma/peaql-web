import { onMount } from "svelte";

export default function useLocalStorage<T>(key: string, initialValue: T) {
  let value = $state<T>(initialValue);

  onMount(() => {
    const currentValue = localStorage.getItem(key);
    if (currentValue) value = JSON.parse(currentValue);
  });

  const save = () => {
    if (value) {
      localStorage.setItem(key, JSON.stringify(value));
    } else {
      localStorage.removeItem(key);
    }
  };

  return {
    get value(): T {
      return value;
    },
    reload() {
      const currentValue = localStorage.getItem(key);
      if (currentValue) value = JSON.parse(currentValue);
    },
    set value(v: T) {
      value = v;
      save();
    },
  };
}
