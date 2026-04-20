"use client";

import { Draggable, Droppable } from "@hello-pangea/dnd";
import { Eye, EyeOff, GripVertical, Settings } from "lucide-react";
import type { EditorPanel } from "@/lib/landing-types";
import type { SectionId } from "@/lib/landing-constants";
import { useLandingBuilder } from "../LandingBuilderContext";

const LABELS: Record<SectionId, string> = {
  hero: "Hero",
  about: "About",
  services: "Services",
  projects: "Projects",
  testimonials: "Testimonials",
  footer: "Footer",
};

export function SectionsSidebar({
  active,
  onSelect,
}: {
  active: EditorPanel;
  onSelect: (id: EditorPanel) => void;
}) {
  const { state, patchFn } = useLandingBuilder();

  function toggleVis(id: SectionId, e: React.MouseEvent) {
    e.stopPropagation();
    patchFn((s) => ({
      section_visibility: { ...s.section_visibility, [id]: !s.section_visibility[id] },
    }));
  }

  return (
    <aside className="flex h-full w-[240px] shrink-0 flex-col overflow-y-auto border-r border-[var(--border)] bg-[var(--surface-card)]">
      <div className="px-5 pt-4">
        <div className="font-mono text-[11px] uppercase tracking-wide text-[var(--text-tertiary)]">Sections</div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-0 pb-4 pt-2">
        <Droppable droppableId="section-order">
          {(dropProvided) => (
            <ul ref={dropProvided.innerRef} {...dropProvided.droppableProps} className="space-y-0">
              {state.section_order.map((sid, index) => {
                const hidden = !state.section_visibility[sid];
                return (
                  <Draggable key={sid} draggableId={`section::${sid}`} index={index}>
                    {(dragProvided, snapshot) => (
                      <li
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        className={`group relative list-none border-l-2 ${
                          active === sid ? "border-[var(--accent)] bg-[var(--surface-card-alt)]" : "border-transparent"
                        } ${hidden ? "opacity-50" : ""} ${snapshot.isDragging ? "bg-[var(--surface-card-alt)] shadow-md" : ""}`}
                      >
                        <div className="flex h-11 items-stretch">
                          <span
                            className="flex w-8 shrink-0 cursor-grab items-center justify-center opacity-0 transition group-hover:opacity-100"
                            {...dragProvided.dragHandleProps}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <GripVertical className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
                          </span>
                          <button
                            type="button"
                            onClick={() => onSelect(sid)}
                            className={`flex min-w-0 flex-1 items-center justify-between gap-2 pr-3 text-left text-[13px] font-medium ${
                              active === sid ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"
                            }`}
                          >
                            <span>{LABELS[sid]}</span>
                            <span
                              role="button"
                              tabIndex={0}
                              className="shrink-0 p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                              onClick={(e) => toggleVis(sid, e)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  toggleVis(sid, e as unknown as React.MouseEvent);
                                }
                              }}
                            >
                              {hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </span>
                          </button>
                        </div>
                      </li>
                    )}
                  </Draggable>
                );
              })}
              {dropProvided.placeholder}
            </ul>
          )}
        </Droppable>
        <div className="mx-3 my-3 border-t border-[var(--border)]" />
        <button
          type="button"
          onClick={() => onSelect("global-settings")}
          className={`flex h-11 w-full items-center gap-2 border-l-2 pl-5 pr-3 text-left text-[13px] font-medium ${
            active === "global-settings"
              ? "border-[var(--accent)] bg-[var(--surface-card-alt)] text-[var(--text-primary)]"
              : "border-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-card-alt)]/60"
          }`}
        >
          <Settings className="h-4 w-4 text-[var(--text-tertiary)]" />
          Global settings
        </button>
      </div>
    </aside>
  );
}
