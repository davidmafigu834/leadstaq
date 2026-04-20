export type EditableFieldSpec = {
  path: string;
  label: string;
  type: "text" | "textarea" | "image" | "color" | "select" | "repeater" | "tag-list" | "link-list";
  group: string;
  maxLength?: number;
  hint?: string;
  optional?: boolean;
  minItems?: number;
  maxItems?: number;
  locked?: "count" | "keys";
  itemSchema?: Array<{
    field: string;
    label: string;
    type: string;
    optional?: boolean;
    maxLength?: number;
    maxItems?: number;
    hint?: string;
  }>;
  options?: Array<{ value: string; label: string }>;
};
