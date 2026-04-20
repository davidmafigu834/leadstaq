export type BuilderToPreviewMessage =
  | { type: "FIELD_UPDATED"; path: string; value: unknown }
  | { type: "FIELD_FOCUSED"; path: string }
  | { type: "FIELD_BLURRED"; path: string }
  | { type: "SECTION_VISIBILITY_CHANGED"; section: string; visible: boolean }
  | { type: "SECTION_REORDER"; order: string[] }
  | { type: "FULL_STATE_SYNC"; state: Record<string, unknown> };

export type PreviewToBuilderMessage =
  | { type: "READY" }
  | {
      type: "ELEMENT_CLICKED";
      path: string;
      boundingRect: { top: number; left: number; width: number; height: number };
    }
  | { type: "ELEMENT_HOVERED"; path: string | null };

export type PreviewMessage = BuilderToPreviewMessage | PreviewToBuilderMessage;

export const PREVIEW_MESSAGE_NAMESPACE = "leadstaq_preview_v1";

export type WrappedMessage<T> = {
  namespace: typeof PREVIEW_MESSAGE_NAMESPACE;
  payload: T;
};

export function wrapMessage<T>(payload: T): WrappedMessage<T> {
  return { namespace: PREVIEW_MESSAGE_NAMESPACE, payload };
}

export function unwrapMessage<T>(data: unknown): T | null {
  if (!data || typeof data !== "object") return null;
  const o = data as { namespace?: unknown; payload?: unknown };
  if (o.namespace !== PREVIEW_MESSAGE_NAMESPACE) return null;
  return o.payload as T;
}
