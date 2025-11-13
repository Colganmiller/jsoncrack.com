import { create } from "zustand";
import useGraph from "../features/editor/views/GraphView/stores/useGraph";

interface JsonActions {
  setJson: (json: string) => void;
  getJson: () => string;
  clear: () => void;
  updateNodeValue: (path: (string | number)[], value: string) => void;
}

const initialStates = {
  json: "{}",
  loading: true,
};

export type JsonStates = typeof initialStates;

const setValueByPath = (obj: any, path: (string | number)[], value: any) => {
  let current = obj;
  for (let i = 0; i < path.length - 1; i++) {
    current = current[path[i]];
  }
  if (path.length > 0) {
    current[path[path.length - 1]] = value;
  }
  return obj;
};

const useJson = create<JsonStates & JsonActions>()((set, get) => ({
  ...initialStates,
  getJson: () => get().json,
  setJson: json => {
    set({ json, loading: false });
    useGraph.getState().setGraph(json);
  },
  clear: () => {
    set({ json: "", loading: false });
    useGraph.getState().clearGraph();
  },
  updateNodeValue: (path, value) => {
    try {
      const currentJson = JSON.parse(get().json);
      const updatedJson = setValueByPath(currentJson, path, value);
      const newJsonString = JSON.stringify(updatedJson, null, 2);
      set({ json: newJsonString });
      useGraph.getState().setGraph(newJsonString);
    } catch (error) {
      console.error("Error updating node value:", error);
    }

    
  },
}));

export default useJson;
