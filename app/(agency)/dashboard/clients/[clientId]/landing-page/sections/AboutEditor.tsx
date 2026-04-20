"use client";

import { useLandingBuilder } from "../LandingBuilderContext";
import { usePreviewBridge } from "../PreviewBridgeContext";
import { FieldLabel } from "../components/FieldLabel";
import { ImageUpload } from "../components/ImageUpload";
import { RepeaterList } from "../components/RepeaterList";
import { SectionScaffold } from "../components/SectionScaffold";
import { builderInputClass, builderTextareaTallClass } from "../components/builder-input-classes";
import type { AboutStatItem } from "@/lib/landing-types";

export function AboutEditor({
  clientId,
  expandStatId,
  onExpandStatConsumed,
}: {
  clientId: string;
  expandStatId?: string | null;
  onExpandStatConsumed?: () => void;
}) {
  const { state, patch, patchFn } = useLandingBuilder();
  const pv = usePreviewBridge();

  function updateStat(i: number, p: Partial<AboutStatItem>) {
    patchFn((s) => ({
      about_stats: s.about_stats.map((row, idx) => (idx === i ? { ...row, ...p } : row)),
    }));
  }

  return (
    <SectionScaffold
      sectionNumber={2}
      sectionCode="ABOUT"
      sectionTitle="About"
      sectionSubtitle="Tell visitors who you are and why they should trust you."
    >
      <div>
        <FieldLabel>Company name</FieldLabel>
        <input
          className={builderInputClass}
          data-editable-path="about.company_name"
          value={state.about_company_name}
          onFocus={() => pv.emitFocus("about.company_name")}
          onBlur={() => pv.emitBlur("about.company_name")}
          onChange={(e) => {
            const v = e.target.value;
            patch({ about_company_name: v });
            pv.emitField("about.company_name", v);
          }}
        />
      </div>
      <div>
        <FieldLabel>Tagline</FieldLabel>
        <input
          className={builderInputClass}
          data-editable-path="about.tagline"
          value={state.about_tagline}
          onFocus={() => pv.emitFocus("about.tagline")}
          onBlur={() => pv.emitBlur("about.tagline")}
          onChange={(e) => {
            const v = e.target.value;
            patch({ about_tagline: v });
            pv.emitField("about.tagline", v);
          }}
        />
      </div>
      <div>
        <FieldLabel>Body</FieldLabel>
        <textarea
          className={builderTextareaTallClass}
          data-editable-path="about.text"
          value={state.about_text}
          onFocus={() => pv.emitFocus("about.text")}
          onBlur={() => pv.emitBlur("about.text")}
          onChange={(e) => {
            const v = e.target.value;
            patch({ about_text: v });
            pv.emitField("about.text", v);
          }}
          rows={8}
        />
      </div>
      <div>
        <FieldLabel>Image</FieldLabel>
        <ImageUpload clientId={clientId} folder="about" value={state.about_image_url} onChange={(url) => patch({ about_image_url: url })} />
      </div>
      <div>
        <FieldLabel caption="Up to four short proof points.">Stats</FieldLabel>
        <RepeaterList<AboutStatItem>
          droppableId="about-stats"
          items={state.about_stats}
          onChange={(next) => patch({ about_stats: next })}
          expandItemId={expandStatId ?? null}
          onExpandConsumed={onExpandStatConsumed}
          maxItems={4}
          singular="stat"
          onAdd={() =>
            patchFn((s) => ({
              about_stats: [...s.about_stats, { _id: crypto.randomUUID(), label: "", value: "" }],
            }))
          }
          emptyStateText="Add stats like years in business or projects completed."
          renderPreview={(item) => (
            <span className="truncate text-sm text-[var(--text-primary)]">
              <span className="font-medium">{item.label || "Label"}</span>
              <span className="text-[var(--text-tertiary)]"> · </span>
              <span>{item.value || "Value"}</span>
            </span>
          )}
          renderItem={(item, i) => (
            <div className="space-y-4">
              <div>
                <FieldLabel>Label</FieldLabel>
                <input
                  className={builderInputClass}
                  data-editable-path={`about.stats[${i}].label`}
                  value={item.label}
                  onFocus={() => pv.emitFocus(`about.stats[${i}].label`)}
                  onBlur={() => pv.emitBlur(`about.stats[${i}].label`)}
                  onChange={(e) => {
                    const v = e.target.value;
                    updateStat(i, { label: v });
                    pv.emitField(`about.stats[${i}].label`, v);
                  }}
                />
              </div>
              <div>
                <FieldLabel>Value</FieldLabel>
                <input
                  className={builderInputClass}
                  data-editable-path={`about.stats[${i}].value`}
                  value={item.value}
                  onFocus={() => pv.emitFocus(`about.stats[${i}].value`)}
                  onBlur={() => pv.emitBlur(`about.stats[${i}].value`)}
                  onChange={(e) => {
                    const v = e.target.value;
                    updateStat(i, { value: v });
                    pv.emitField(`about.stats[${i}].value`, v);
                  }}
                />
              </div>
            </div>
          )}
        />
      </div>
    </SectionScaffold>
  );
}
