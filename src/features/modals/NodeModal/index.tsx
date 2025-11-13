import React from "react";
import {
  Modal,
  Stack,
  Text,
  ScrollArea,
  Flex,
  CloseButton,
  Button,
  Group,
  Textarea,
} from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";

import useJson from "../../../store/useJson";
import useGraph from "../../editor/views/GraphView/stores/useGraph";
import type { NodeData } from "../../../types/graph";

const normalizeNodeData = (nodeRows: any[]) => {
  if (!nodeRows || nodeRows.length === 0) return "{}";
  if (nodeRows.length === 1 && !nodeRows[0].key) return `${nodeRows[0].value}`;

  const obj: any = {};
  nodeRows.forEach(row => {
    if (row.type !== "array" && row.type !== "object" && row.key) {
      obj[row.key] = row.value;
    }
  });

  return JSON.stringify(obj, null, 2);
};

const jsonPathToString = (path?: NodeData["path"]) => {
  if (!path || path.length === 0) return "$";
  const segments = path.map(seg =>
    typeof seg === "number" ? seg : `"${seg}"`
  );
  return `$[${segments.join("][")}]`;
};

export const NodeModal = ({ opened, onClose }: any) => {
  const nodeData = useGraph(state => state.selectedNode);
  const setJson = useJson(state => state.setJson);

  const [editing, setEditing] = React.useState(false);

  // Local edit buffer
  const [localValue, setLocalValue] = React.useState("");

  React.useEffect(() => {
    if (!nodeData) return;
    setLocalValue(normalizeNodeData(nodeData.text ?? []));
    setEditing(false);
  }, [nodeData]);

  if (!nodeData) return null;

  // Save changes to JSON
  const handleSave = () => {
    let root: any;

    try {
      root = JSON.parse(useJson.getState().getJson());
    } catch (e) {
      console.error("Invalid JSON structure:", e);
      return;
    }

    const path = nodeData.path ?? [];

    const parseInput = (text: string) => {
      try {
        return JSON.parse(text);
      } catch {
        return text; // fallback to string
      }
    };

    if (path.length === 0) {
      const parsed = parseInput(localValue);
      setJson(JSON.stringify(parsed, null, 2));
      setEditing(false);
      onClose?.();
      return;
    }

    let parent = root;
    for (let i = 0; i < path.length - 1; i++) {
      parent = parent[path[i]];
      if (parent === undefined) break;
    }

    const last = path[path.length - 1];
    const parsed = parseInput(localValue);

    if (parent && last !== undefined) {
      parent[last] = parsed;
    }

    setJson(JSON.stringify(root, null, 2));
    setEditing(false);
    onClose?.();
  };

  return (
    <Modal size="auto" opened={opened} onClose={onClose} centered>
      <Stack pb="sm" gap="sm">

        {/* ---- TOP BAR ---- */}
        <Flex justify="space-between" align="center">
          <Text fw={500}>Node Details</Text>

          <Group gap={8}>
            {!editing ? (
              <Button size="xs" variant="outline" onClick={() => setEditing(true)}>
                Edit
              </Button>
            ) : (
              <>
                <Button size="xs" onClick={handleSave}>
                  Save
                </Button>
                <Button size="xs" variant="default" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </>
            )}

            <CloseButton onClick={onClose} />
          </Group>
        </Flex>

        {/* ---- JSON PATH ---- */}
        <Text fz="xs" fw={500}>JSON Path</Text>
        <ScrollArea.Autosize mah={250} maw={600}>
          <CodeHighlight
            code={jsonPathToString(nodeData.path)}
            miw={350}
            mah={100}
            language="json"
            withCopyButton
          />
        </ScrollArea.Autosize>

        {/* ---- VALUE ---- */}
        <Text fz="xs" fw={500}>Value</Text>

        {!editing ? (
          <ScrollArea.Autosize mah={250} maw={600}>
            <CodeHighlight
              code={localValue}
              miw={350}
              mah={200}
              language="json"
              withCopyButton
            />
          </ScrollArea.Autosize>
        ) : (
          <Textarea
            minRows={6}
            value={localValue}
            onChange={e => setLocalValue(e.currentTarget.value)}
            styles={{ input: { fontFamily: "monospace" } }}
            autoFocus
          />
        )}
      </Stack>
    </Modal>
  );
};