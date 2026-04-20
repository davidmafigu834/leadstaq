"use client";

import { useLandingBuilder } from "../LandingBuilderContext";
import { usePreviewBridge } from "../PreviewBridgeContext";
import { FieldLabel } from "../components/FieldLabel";
import { ImageUpload } from "../components/ImageUpload";
import { SectionScaffold } from "../components/SectionScaffold";
import { builderInputClass, builderTextareaClass } from "../components/builder-input-classes";

function CharCount({ current, max }: { current: number; max: number }) {
  return (
    <div className="mt-1 text-right text-[11px] text-[var(--text-tertiary)]">
      {current}/{max}
    </div>
  );
}

export function HeroEditor({ clientId }: { clientId: string }) {
  const { state, patch } = useLandingBuilder();
  const pv = usePreviewBridge();

  return (
    <SectionScaffold
      sectionNumber={1}
      sectionCode="HERO"
      sectionTitle="Hero"
      sectionSubtitle="The first thing visitors see. Make it impossible to scroll past."
    >
      <div>
        <FieldLabel caption="The one-line promise. Keep it under 10 words.">Headline</FieldLabel>
        <input
          className={builderInputClass}
          maxLength={80}
          data-editable-path="hero.headline"
          value={state.hero_headline}
          onFocus={() => pv.emitFocus("hero.headline")}
          onBlur={() => pv.emitBlur("hero.headline")}
          onChange={(e) => {
            const v = e.target.value;
            patch({ hero_headline: v });
            pv.emitField("hero.headline", v);
          }}
        />
        <CharCount current={state.hero_headline.length} max={80} />
      </div>
      <div>
        <FieldLabel caption="One sentence of context or proof.">Subheadline</FieldLabel>
        <textarea
          className={builderTextareaClass}
          maxLength={200}
          rows={4}
          data-editable-path="hero.subheadline"
          value={state.hero_subheadline}
          onFocus={() => pv.emitFocus("hero.subheadline")}
          onBlur={() => pv.emitBlur("hero.subheadline")}
          onChange={(e) => {
            const v = e.target.value;
            patch({ hero_subheadline: v });
            pv.emitField("hero.subheadline", v);
          }}
        />
        <CharCount current={state.hero_subheadline.length} max={200} />
      </div>
      <div>
        <FieldLabel caption='Small line above the form. Example: "Get a free quote today."'>CTA above form</FieldLabel>
        <input
          className={builderInputClass}
          maxLength={40}
          data-editable-path="hero.cta_text"
          value={state.cta_text}
          onFocus={() => pv.emitFocus("hero.cta_text")}
          onBlur={() => pv.emitBlur("hero.cta_text")}
          onChange={(e) => {
            const v = e.target.value;
            patch({ cta_text: v });
            pv.emitField("hero.cta_text", v);
          }}
        />
        <CharCount current={state.cta_text.length} max={40} />
      </div>
      <div>
        <FieldLabel caption="Recommended 2400×1400, under 2MB. Will be darkened for text legibility.">Background image</FieldLabel>
        <div data-editable-path="hero.image">
          <ImageUpload
            clientId={clientId}
            folder="hero"
            value={state.hero_image_url}
            onChange={(url) => {
              patch({ hero_image_url: url });
              pv.emitField("hero.image", url, true);
            }}
          />
        </div>
      </div>
      <div>
        <FieldLabel>Text color on hero</FieldLabel>
        <div className="flex gap-2">
          {(["light", "dark"] as const).map((c) => (
            <button
              key={c}
              type="button"
              data-editable-path="hero.text_color"
              onFocus={() => pv.emitFocus("hero.text_color")}
              onBlur={() => pv.emitBlur("hero.text_color")}
              onClick={() => {
                patch({ hero_text_color: c });
                pv.emitField("hero.text_color", c, true);
              }}
              className={`rounded-full px-4 py-2 text-sm font-medium capitalize ${
                state.hero_text_color === c
                  ? "bg-[var(--accent)] text-[var(--accent-ink)]"
                  : "border border-[var(--border)] bg-white text-[var(--text-secondary)]"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
      <div>
        <FieldLabel caption="Dark overlay on the hero image for legibility.">Overlay intensity</FieldLabel>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={0}
            max={80}
            data-editable-path="hero.overlay_opacity"
            value={state.hero_overlay_opacity}
            onFocus={() => pv.emitFocus("hero.overlay_opacity")}
            onBlur={() => pv.emitBlur("hero.overlay_opacity")}
            onChange={(e) => {
              const v = Number(e.target.value);
              patch({ hero_overlay_opacity: v });
              pv.emitField("hero.overlay_opacity", v, true);
            }}
            className="h-2 flex-1 accent-[var(--accent)]"
          />
          <div
            className="h-10 w-14 shrink-0 rounded border border-[var(--border)]"
            style={{
              backgroundImage: `linear-gradient(rgba(10,11,13,${state.hero_overlay_opacity / 100}), rgba(10,11,13,${state.hero_overlay_opacity / 100})), linear-gradient(135deg,#e8e6df,#fafaf7)`,
            }}
            title="Overlay preview"
          />
          <span className="w-8 text-right text-sm text-[var(--text-secondary)]">{state.hero_overlay_opacity}</span>
        </div>
      </div>
    </SectionScaffold>
  );
}
