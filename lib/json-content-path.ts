/**
 * Get/set nested values on plain JSON objects using paths like:
 * `hero.headline_line_1`, `hero.meta_stats[0].label`, `theme.primary_color`
 */

export function parseContentPath(path: string): (string | number)[] {
  const result: (string | number)[] = [];
  let key = "";
  let i = 0;
  while (i < path.length) {
    const c = path[i]!;
    if (c === ".") {
      if (key) result.push(key);
      key = "";
      i++;
      continue;
    }
    if (c === "[") {
      if (key) {
        result.push(key);
        key = "";
      }
      const j = path.indexOf("]", i);
      if (j < 0) break;
      const n = path.slice(i + 1, j);
      result.push(Number(n));
      i = j + 1;
      continue;
    }
    key += c;
    i++;
  }
  if (key) result.push(key);
  return result;
}

export function getByContentPath(root: unknown, path: string): unknown {
  const parts = parseContentPath(path);
  let cur: unknown = root;
  for (const p of parts) {
    if (cur == null) return undefined;
    if (typeof p === "number") {
      cur = (cur as unknown[])[p];
    } else {
      cur = (cur as Record<string, unknown>)[p];
    }
  }
  return cur;
}

export function setByContentPath<T extends Record<string, unknown>>(root: T, path: string, value: unknown): T {
  const parts = parseContentPath(path);
  if (parts.length === 0) return root;
  const clone = structuredClone(root) as Record<string, unknown>;
  let cur: unknown = clone;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i]!;
    const nextP = parts[i + 1]!;
    if (typeof p === "number") {
      const arr = cur as unknown[];
      while (arr.length <= p) arr.push(null);
      if (arr[p] == null || typeof arr[p] !== "object") {
        arr[p] = typeof nextP === "number" ? [] : {};
      }
      cur = arr[p];
    } else {
      const o = cur as Record<string, unknown>;
      if (o[p] == null || typeof o[p] !== "object") {
        o[p] = typeof nextP === "number" ? [] : {};
      }
      cur = o[p];
    }
  }
  const last = parts[parts.length - 1]!;
  if (typeof last === "number") {
    const arr = cur as unknown[];
    while (arr.length <= last) arr.push(null);
    arr[last] = value;
  } else {
    (cur as Record<string, unknown>)[last] = value;
  }
  return clone as T;
}
