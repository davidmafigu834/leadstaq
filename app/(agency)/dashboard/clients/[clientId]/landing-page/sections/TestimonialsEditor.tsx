"use client";

import { Star } from "lucide-react";
import { useLandingBuilder } from "../LandingBuilderContext";
import { usePreviewBridge } from "../PreviewBridgeContext";
import { FieldLabel } from "../components/FieldLabel";
import { ImageUpload } from "../components/ImageUpload";
import { RepeaterList } from "../components/RepeaterList";
import { SectionScaffold } from "../components/SectionScaffold";
import { builderInputClass, builderTextareaClass } from "../components/builder-input-classes";
import type { TestimonialItem } from "@/lib/landing-types";

function Stars({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`p-0.5 hover:opacity-80 ${n <= value ? "text-[var(--accent)]" : "text-[var(--text-tertiary)]"}`}
          aria-label={`${n} stars`}
        >
          <Star className={`h-6 w-6 ${n <= value ? "fill-current" : "fill-transparent"}`} strokeWidth={1.5} />
        </button>
      ))}
    </div>
  );
}

export function TestimonialsEditor({
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

  function update(i: number, p: Partial<TestimonialItem>) {
    patchFn((s) => ({
      testimonials: s.testimonials.map((row, idx) => (idx === i ? { ...row, ...p } : row)),
    }));
  }

  return (
    <SectionScaffold
      sectionNumber={5}
      sectionCode="TESTIMONIALS"
      sectionTitle="Testimonials"
      sectionSubtitle="Real words from real clients. Specific beats generic."
    >
      <div>
        <FieldLabel>Testimonials</FieldLabel>
        <RepeaterList<TestimonialItem>
          droppableId="testimonials"
          items={state.testimonials}
          onChange={(next) => patch({ testimonials: next })}
          expandItemId={expandItemId ?? null}
          onExpandConsumed={onExpandConsumed}
          maxItems={8}
          singular="testimonial"
          onAdd={() =>
            patchFn((s) => ({
              testimonials: [
                ...s.testimonials,
                { _id: crypto.randomUUID(), name: "", company: "", quote: "", rating: 5, avatar_url: null },
              ],
            }))
          }
          emptyStateText="Add client quotes with a rating."
          renderPreview={(item) => (
            <span className="line-clamp-2 text-sm text-[var(--text-primary)]">
              <span className="font-medium">{item.name || "Name"}</span>
              {item.company ? <span className="text-[var(--text-tertiary)]"> · {item.company}</span> : null}
              <span className="block text-xs text-[var(--text-secondary)]">{item.quote || "Quote…"}</span>
            </span>
          )}
          renderItem={(item, i) => (
            <div className="space-y-4">
              <div>
                <FieldLabel>Name</FieldLabel>
                <input
                  className={builderInputClass}
                  data-editable-path={`testimonials[${i}].name`}
                  value={item.name}
                  onFocus={() => pv.emitFocus(`testimonials[${i}].name`)}
                  onBlur={() => pv.emitBlur(`testimonials[${i}].name`)}
                  onChange={(e) => {
                    const v = e.target.value;
                    update(i, { name: v });
                    pv.emitField(`testimonials[${i}].name`, v);
                  }}
                />
              </div>
              <div>
                <FieldLabel>Company</FieldLabel>
                <input
                  className={builderInputClass}
                  data-editable-path={`testimonials[${i}].company`}
                  value={item.company}
                  onFocus={() => pv.emitFocus(`testimonials[${i}].company`)}
                  onBlur={() => pv.emitBlur(`testimonials[${i}].company`)}
                  onChange={(e) => {
                    const v = e.target.value;
                    update(i, { company: v });
                    pv.emitField(`testimonials[${i}].company`, v);
                  }}
                />
              </div>
              <div>
                <FieldLabel>Quote</FieldLabel>
                <textarea
                  className={builderTextareaClass}
                  maxLength={300}
                  data-editable-path={`testimonials[${i}].quote`}
                  value={item.quote}
                  onFocus={() => pv.emitFocus(`testimonials[${i}].quote`)}
                  onBlur={() => pv.emitBlur(`testimonials[${i}].quote`)}
                  onChange={(e) => {
                    const v = e.target.value;
                    update(i, { quote: v });
                    pv.emitField(`testimonials[${i}].quote`, v);
                  }}
                  rows={4}
                />
                <div className="mt-1 text-right text-[11px] text-[var(--text-tertiary)]">{item.quote.length}/300</div>
              </div>
              <div>
                <FieldLabel>Rating</FieldLabel>
                <div
                  data-editable-path={`testimonials[${i}].rating`}
                  tabIndex={0}
                  onFocus={() => pv.emitFocus(`testimonials[${i}].rating`)}
                  onBlur={() => pv.emitBlur(`testimonials[${i}].rating`)}
                >
                  <Stars
                    value={item.rating}
                    onChange={(n) => {
                      update(i, { rating: n });
                      pv.emitField(`testimonials[${i}].rating`, n, true);
                    }}
                  />
                </div>
              </div>
              <div>
                <FieldLabel>Avatar</FieldLabel>
                <div data-editable-path={`testimonials[${i}].avatar`}>
                  <ImageUpload
                    clientId={clientId}
                    folder="testimonials"
                    value={item.avatar_url}
                    onChange={(url) => {
                      update(i, { avatar_url: url });
                      pv.emitField(`testimonials[${i}].avatar`, url, true);
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
