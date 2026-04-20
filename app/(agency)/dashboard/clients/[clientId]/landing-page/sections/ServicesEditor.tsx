"use client";

import * as Icons from "lucide-react";
import { useLandingBuilder } from "../LandingBuilderContext";
import { usePreviewBridge } from "../PreviewBridgeContext";
import { FieldLabel } from "../components/FieldLabel";
import { RepeaterList } from "../components/RepeaterList";
import { SectionScaffold } from "../components/SectionScaffold";
import { SERVICE_ICON_KEYS } from "@/lib/landing-constants";
import { builderInputClass, builderTextareaClass } from "../components/builder-input-classes";
import type { ServiceItem } from "@/lib/landing-types";

function IconPreview({ name }: { name: string }) {
  const Cmp = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[name] ?? Icons.Sparkles;
  return <Cmp className="h-4 w-4 shrink-0 text-[var(--text-primary)]" />;
}

export function ServicesEditor({
  expandItemId,
  onExpandConsumed,
}: {
  expandItemId?: string | null;
  onExpandConsumed?: () => void;
}) {
  const { state, patch, patchFn } = useLandingBuilder();
  const pv = usePreviewBridge();

  function update(i: number, p: Partial<ServiceItem>) {
    patchFn((s) => ({
      services: s.services.map((row, idx) => (idx === i ? { ...row, ...p } : row)),
    }));
  }

  return (
    <SectionScaffold
      sectionNumber={3}
      sectionCode="SERVICES"
      sectionTitle="Services"
      sectionSubtitle="What do you offer? Keep it scannable."
    >
      <div>
        <FieldLabel>Services</FieldLabel>
        <RepeaterList<ServiceItem>
          droppableId="services"
          items={state.services}
          onChange={(next) => patch({ services: next })}
          expandItemId={expandItemId ?? null}
          onExpandConsumed={onExpandConsumed}
          maxItems={6}
          singular="service"
          onAdd={() =>
            patchFn((s) => ({
              services: [...s.services, { _id: crypto.randomUUID(), title: "", description: "", icon: "Sparkles" }],
            }))
          }
          emptyStateText="List your core services."
          renderPreview={(item) => (
            <div className="flex items-center gap-2">
              <IconPreview name={item.icon} />
              <span className="truncate text-sm font-medium text-[var(--text-primary)]">{item.title || "Untitled service"}</span>
            </div>
          )}
          renderItem={(item, i) => (
            <div className="space-y-4">
              <div>
                <FieldLabel>Title</FieldLabel>
                <input
                  className={builderInputClass}
                  maxLength={50}
                  data-editable-path={`services[${i}].title`}
                  value={item.title}
                  onFocus={() => pv.emitFocus(`services[${i}].title`)}
                  onBlur={() => pv.emitBlur(`services[${i}].title`)}
                  onChange={(e) => {
                    const v = e.target.value;
                    update(i, { title: v });
                    pv.emitField(`services[${i}].title`, v);
                  }}
                />
                <div className="mt-1 text-right text-[11px] text-[var(--text-tertiary)]">{item.title.length}/50</div>
              </div>
              <div>
                <FieldLabel>Description</FieldLabel>
                <textarea
                  className={builderTextareaClass}
                  maxLength={200}
                  data-editable-path={`services[${i}].description`}
                  value={item.description}
                  onFocus={() => pv.emitFocus(`services[${i}].description`)}
                  onBlur={() => pv.emitBlur(`services[${i}].description`)}
                  onChange={(e) => {
                    const v = e.target.value;
                    update(i, { description: v });
                    pv.emitField(`services[${i}].description`, v);
                  }}
                  rows={4}
                />
                <div className="mt-1 text-right text-[11px] text-[var(--text-tertiary)]">{item.description.length}/200</div>
              </div>
              <div>
                <FieldLabel>Icon</FieldLabel>
                <div className="relative">
                  <select
                    className={builderInputClass + " appearance-none pr-8"}
                    data-editable-path={`services[${i}].icon`}
                    value={item.icon}
                    onFocus={() => pv.emitFocus(`services[${i}].icon`)}
                    onBlur={() => pv.emitBlur(`services[${i}].icon`)}
                    onChange={(e) => {
                      const v = e.target.value;
                      update(i, { icon: v });
                      pv.emitField(`services[${i}].icon`, v, true);
                    }}
                  >
                    {SERVICE_ICON_KEYS.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
                    <IconPreview name={item.icon} />
                  </span>
                </div>
              </div>
            </div>
          )}
        />
      </div>
    </SectionScaffold>
  );
}
