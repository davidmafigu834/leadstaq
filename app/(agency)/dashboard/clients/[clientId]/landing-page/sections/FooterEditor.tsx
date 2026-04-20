"use client";

import { useLandingBuilder } from "../LandingBuilderContext";
import { usePreviewBridge } from "../PreviewBridgeContext";
import { FieldLabel } from "../components/FieldLabel";
import { SectionScaffold } from "../components/SectionScaffold";
import { builderInputClass, builderTextareaClass } from "../components/builder-input-classes";

export function FooterEditor() {
  const { state, patch, patchFn } = useLandingBuilder();
  const pv = usePreviewBridge();
  const fs = state.footer_socials;

  return (
    <SectionScaffold
      sectionNumber={6}
      sectionCode="FOOTER"
      sectionTitle="Footer"
      sectionSubtitle="Contact info and legal links. Short and clear."
    >
      <div>
        <FieldLabel caption="Phone, email, address. One per line.">Contact info</FieldLabel>
        <textarea
          className={builderTextareaClass}
          maxLength={500}
          rows={5}
          data-editable-path="footer.contact"
          value={state.footer_contact}
          onFocus={() => pv.emitFocus("footer.contact")}
          onBlur={() => pv.emitBlur("footer.contact")}
          onChange={(e) => {
            const v = e.target.value;
            patch({ footer_contact: v });
            pv.emitField("footer.contact", v);
          }}
        />
        <div className="mt-1 text-right text-[11px] text-[var(--text-tertiary)]">{state.footer_contact.length}/500</div>
      </div>
      <div>
        <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
          <input
            type="checkbox"
            checked={fs.enabled}
            onChange={(e) => patchFn((s) => ({ footer_socials: { ...s.footer_socials, enabled: e.target.checked } }))}
          />
          Show social links
        </label>
        {fs.enabled ? (
          <div className="mt-4 space-y-3">
            {(["facebook", "instagram", "linkedin", "youtube"] as const).map((k) => (
              <div key={k}>
                <FieldLabel>{k[0].toUpperCase() + k.slice(1)} URL</FieldLabel>
                <input
                  className={builderInputClass}
                  data-editable-path={`footer.socials.${k}`}
                  value={fs[k]}
                  onFocus={() => pv.emitFocus(`footer.socials.${k}`)}
                  onBlur={() => pv.emitBlur(`footer.socials.${k}`)}
                  onChange={(e) => {
                    const v = e.target.value;
                    patchFn((s) => ({
                      footer_socials: { ...s.footer_socials, [k]: v },
                    }));
                    pv.emitField(`footer.socials.${k}`, v);
                  }}
                />
              </div>
            ))}
          </div>
        ) : null}
      </div>
      <div>
        <FieldLabel caption="If blank, the site will still show an automatic year in the public template where applicable.">Copyright text</FieldLabel>
        <input
          className={builderInputClass}
          data-editable-path="footer.copyright"
          value={state.footer_copyright}
          onFocus={() => pv.emitFocus("footer.copyright")}
          onBlur={() => pv.emitBlur("footer.copyright")}
          onChange={(e) => {
            const v = e.target.value;
            patch({ footer_copyright: v });
            pv.emitField("footer.copyright", v);
          }}
        />
      </div>
      <p className="text-xs text-[var(--text-tertiary)]">Terms and Privacy links come from your agency settings.</p>
    </SectionScaffold>
  );
}
