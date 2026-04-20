"use client";

import { Draggable, Droppable } from "@hello-pangea/dnd";
import { ChevronDown, ChevronRight, GripVertical, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function RepeaterList<T extends { _id: string }>({
  droppableId,
  items,
  onChange,
  renderItem,
  renderPreview,
  singular,
  onAdd,
  maxItems,
  emptyStateText = "Nothing here yet.",
  expandItemId,
  onExpandConsumed,
  /** Fixed item count: hide add/remove; reorder still allowed. */
  readOnlyCount = false,
}: {
  droppableId: string;
  items: T[];
  onChange: (next: T[]) => void;
  renderItem: (item: T, index: number) => React.ReactNode;
  renderPreview: (item: T, index: number) => React.ReactNode;
  singular: string;
  onAdd: () => void;
  maxItems: number;
  emptyStateText?: string;
  /** When set to an item _id, that row opens (e.g. preview click). */
  expandItemId?: string | null;
  onExpandConsumed?: () => void;
  readOnlyCount?: boolean;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const onConsumedRef = useRef(onExpandConsumed);
  onConsumedRef.current = onExpandConsumed;

  useEffect(() => {
    if (!expandItemId) return;
    if (!items.some((it) => it._id === expandItemId)) return;
    setExpandedId(expandItemId);
    onConsumedRef.current?.();
  }, [expandItemId, items]);

  function removeAt(i: number) {
    const next = items.filter((_, idx) => idx !== i);
    onChange(next);
    setExpandedId(null);
  }

  function toggleExpand(id: string) {
    setExpandedId((e) => (e === id ? null : id));
  }

  const atMax = items.length >= maxItems;

  return (
    <div className="space-y-2">
      <Droppable droppableId={droppableId}>
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
            {items.length === 0 ? (
              <p className="py-6 text-center text-sm text-[var(--text-tertiary)]">{emptyStateText}</p>
            ) : null}
            {items.map((item, index) => (
              <Draggable key={item._id} draggableId={`${droppableId}::${item._id}`} index={index}>
                {(dragProvided, snapshot) => (
                  <div
                    ref={dragProvided.innerRef}
                    {...dragProvided.draggableProps}
                    className={`rounded-lg border border-[var(--border)] bg-white ${snapshot.isDragging ? "shadow-md ring-2 ring-[var(--accent)]" : ""}`}
                  >
                    <div className="flex items-center gap-1 border-b border-[var(--border)] px-2 py-2">
                      <span
                        className="cursor-grab p-1 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                        {...dragProvided.dragHandleProps}
                        aria-label="Drag to reorder"
                      >
                        <GripVertical className="h-4 w-4" />
                      </span>
                      <button
                        type="button"
                        className="flex min-w-0 flex-1 items-center gap-2 px-1 text-left"
                        onClick={() => toggleExpand(item._id)}
                      >
                        {expandedId === item._id ? (
                          <ChevronDown className="h-4 w-4 shrink-0 text-[var(--text-tertiary)]" />
                        ) : (
                          <ChevronRight className="h-4 w-4 shrink-0 text-[var(--text-tertiary)]" />
                        )}
                        <div className="min-w-0 flex-1">{renderPreview(item, index)}</div>
                      </button>
                      {readOnlyCount ? null : (
                        <button
                          type="button"
                          className="p-1 text-[var(--text-tertiary)] hover:text-[var(--danger)]"
                          onClick={() => removeAt(index)}
                          aria-label="Remove"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    {expandedId === item._id ? <div className="space-y-4 p-4">{renderItem(item, index)}</div> : null}
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
      {readOnlyCount ? null : (
        <button
          type="button"
          disabled={atMax}
          onClick={onAdd}
          className="flex w-full items-center justify-center rounded-lg border border-dashed border-[var(--border-strong)] py-3 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--surface-card-alt)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          + Add {singular}
        </button>
      )}
    </div>
  );
}
