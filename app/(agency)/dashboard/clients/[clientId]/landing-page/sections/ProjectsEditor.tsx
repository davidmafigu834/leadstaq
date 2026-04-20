"use client";

import Image from "next/image";
import { useLandingBuilder } from "../LandingBuilderContext";
import { usePreviewBridge } from "../PreviewBridgeContext";
import { FieldLabel } from "../components/FieldLabel";
import { ImageUpload } from "../components/ImageUpload";
import { RepeaterList } from "../components/RepeaterList";
import { SectionScaffold } from "../components/SectionScaffold";
import { builderInputClass, builderTextareaClass } from "../components/builder-input-classes";
import type { ProjectItem } from "@/lib/landing-types";

export function ProjectsEditor({
  clientId,
  expandItemId,
  onExpandConsumed,
}: {
  clientId: string;
  expandItemId?: string | null;
  onExpandConsumed?: () => void;
}) {
  const { state, patch, patchFn } = useLandingBuilder();
  const pv = usePreviewBridge();

  function update(i: number, p: Partial<ProjectItem>) {
    patchFn((s) => ({
      projects: s.projects.map((row, idx) => (idx === i ? { ...row, ...p } : row)),
    }));
  }

  return (
    <SectionScaffold
      sectionNumber={4}
      sectionCode="PROJECTS"
      sectionTitle="Projects"
      sectionSubtitle="Show the work. Past projects build instant credibility."
    >
      <div>
        <FieldLabel>Projects</FieldLabel>
        {state.projects.length > 0 ? (
          <div className="mb-4 grid grid-cols-2 gap-2">
            {state.projects.map((p) => (
              <div key={p._id} className="flex gap-2 rounded border border-[var(--border)] bg-[var(--surface-card-alt)] p-2">
                <div className="relative h-[60px] w-20 shrink-0 overflow-hidden rounded bg-[var(--border)]">
                  {p.image_url ? (
                    <Image src={p.image_url} alt="" fill className="object-cover" sizes="80px" unoptimized={p.image_url.includes("127.0.0.1")} />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-[var(--text-primary)]">{p.title || "Untitled"}</p>
                  <p className="truncate text-[11px] text-[var(--text-tertiary)]">{p.location || "—"}</p>
                </div>
              </div>
            ))}
          </div>
        ) : null}
        <RepeaterList<ProjectItem>
          droppableId="projects"
          items={state.projects}
          onChange={(next) => patch({ projects: next })}
          expandItemId={expandItemId ?? null}
          onExpandConsumed={onExpandConsumed}
          maxItems={12}
          singular="project"
          onAdd={() =>
            patchFn((s) => ({
              projects: [
                ...s.projects,
                { _id: crypto.randomUUID(), title: "", location: "", value: "", description: "", image_url: "" },
              ],
            }))
          }
          emptyStateText="Add completed projects with a hero image each."
          renderPreview={(item) => (
            <div className="flex items-center gap-2">
              <div className="relative h-[60px] w-20 shrink-0 overflow-hidden rounded bg-[var(--border)]">
                {item.image_url ? (
                  <Image src={item.image_url} alt="" fill className="object-cover" sizes="80px" unoptimized={item.image_url.includes("127.0.0.1")} />
                ) : null}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{item.title || "Untitled"}</p>
                <p className="truncate text-xs text-[var(--text-tertiary)]">{item.location || "—"}</p>
              </div>
            </div>
          )}
          renderItem={(item, i) => (
            <div className="space-y-4">
              <div>
                <FieldLabel>Title</FieldLabel>
                <input
                  className={builderInputClass}
                  data-editable-path={`projects[${i}].title`}
                  value={item.title}
                  onFocus={() => pv.emitFocus(`projects[${i}].title`)}
                  onBlur={() => pv.emitBlur(`projects[${i}].title`)}
                  onChange={(e) => {
                    const v = e.target.value;
                    update(i, { title: v });
                    pv.emitField(`projects[${i}].title`, v);
                  }}
                />
              </div>
              <div>
                <FieldLabel>Location</FieldLabel>
                <input
                  className={builderInputClass}
                  data-editable-path={`projects[${i}].location`}
                  value={item.location}
                  onFocus={() => pv.emitFocus(`projects[${i}].location`)}
                  onBlur={() => pv.emitBlur(`projects[${i}].location`)}
                  onChange={(e) => {
                    const v = e.target.value;
                    update(i, { location: v });
                    pv.emitField(`projects[${i}].location`, v);
                  }}
                />
              </div>
              <div>
                <FieldLabel caption="Optional headline metric.">Value</FieldLabel>
                <input
                  className={builderInputClass}
                  data-editable-path={`projects[${i}].value`}
                  value={item.value}
                  onFocus={() => pv.emitFocus(`projects[${i}].value`)}
                  onBlur={() => pv.emitBlur(`projects[${i}].value`)}
                  onChange={(e) => {
                    const v = e.target.value;
                    update(i, { value: v });
                    pv.emitField(`projects[${i}].value`, v);
                  }}
                />
              </div>
              <div>
                <FieldLabel>Description</FieldLabel>
                <textarea
                  className={builderTextareaClass}
                  maxLength={300}
                  data-editable-path={`projects[${i}].description`}
                  value={item.description}
                  onFocus={() => pv.emitFocus(`projects[${i}].description`)}
                  onBlur={() => pv.emitBlur(`projects[${i}].description`)}
                  onChange={(e) => {
                    const v = e.target.value;
                    update(i, { description: v });
                    pv.emitField(`projects[${i}].description`, v);
                  }}
                  rows={4}
                />
                <div className="mt-1 text-right text-[11px] text-[var(--text-tertiary)]">{item.description.length}/300</div>
              </div>
              <div>
                <FieldLabel caption="Required on the public page.">Project image</FieldLabel>
                <div data-editable-path={`projects[${i}].image`}>
                  <ImageUpload
                    clientId={clientId}
                    folder="projects"
                    value={item.image_url || null}
                    onChange={(url) => {
                      const u = url ?? "";
                      update(i, { image_url: u });
                      pv.emitField(`projects[${i}].image`, u, true);
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        />
      </div>
    </SectionScaffold>
  );
}
