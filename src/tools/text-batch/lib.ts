export type BatchOperation =
  | "trim"
  | "remove-empty"
  | "dedupe"
  | "sort"
  | "reverse"
  | "number"
  | "prefix"
  | "suffix"
  | "replace";

export type BatchSettings = {
  operations: BatchOperation[];
  prefix: string;
  suffix: string;
  find: string;
  replaceWith: string;
  caseSensitive: boolean;
};

export function processLines(input: string, settings: BatchSettings): string {
  let lines = input.replace(/\r\n?/g, "\n").split("\n");
  for (const operation of settings.operations) {
    switch (operation) {
      case "trim":
        lines = lines.map((line) => line.trim());
        break;
      case "remove-empty":
        lines = lines.filter((line) => line.length > 0);
        break;
      case "dedupe": {
        const seen = new Set<string>();
        lines = lines.filter((line) => {
          if (seen.has(line)) return false;
          seen.add(line);
          return true;
        });
        break;
      }
      case "sort":
        lines = [...lines].sort((a, b) => a.localeCompare(b, "zh-CN", { numeric: true }));
        break;
      case "reverse":
        lines = [...lines].reverse();
        break;
      case "number":
        lines = lines.map((line, index) => `${index + 1}. ${line}`);
        break;
      case "prefix":
        lines = lines.map((line) => `${settings.prefix}${line}`);
        break;
      case "suffix":
        lines = lines.map((line) => `${line}${settings.suffix}`);
        break;
      case "replace": {
        if (!settings.find) break;
        const flags = settings.caseSensitive ? "g" : "gi";
        const escaped = settings.find.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const re = new RegExp(escaped, flags);
        lines = lines.map((line) => line.replace(re, settings.replaceWith));
        break;
      }
    }
  }
  return lines.join("\n");
}
