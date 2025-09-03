import { get, set, del, clear } from "idb-keyval";
import { onMount } from "svelte";

const useIdbStorage = (key: string, initialValue: any) => {
  let value = $state(initialValue);
  let loaded = $state(-1);

  onMount(() => {
    get(key).then((currentValue) => {
      if (currentValue) {
        try {
          const data = JSON.parse(currentValue);
          value = data;
          loaded = 1;
        } catch (e) {
          loaded = 0;
        }
      }
    });
  });

  const save = () => {
    if (value) {
      set(key, JSON.stringify(value));
    } else {
      del(key);
    }
  };

  return {
    get loaded() {
      return loaded;
    },
    get value() {
      return value;
    },
    set value(v: string) {
      value = v;
      save();
    },
  };
};

export default useIdbStorage;
