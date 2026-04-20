"use client";

import type { LandingPageRow } from "@/types";
import type { FormSchemaRow } from "@/types";
import { LiveNorthfieldLanding } from "./LiveNorthfieldLanding";
import { LivePublicLandingUnlocked } from "./LivePublicLandingUnlocked";

type LockedMeta = {
  component_name: string;
  default_content?: unknown;
  default_theme?: unknown;
};

type Props = {
  initialLanding: LandingPageRow;
  clientId: string;
  slug: string;
  formSchema: FormSchemaRow | null;
  termsUrl?: string | null;
  privacyUrl?: string | null;
  templatePreview?: boolean;
  lockedTemplate?: LockedMeta | null;
};

export function LivePublicLanding(props: Props) {
  const { lockedTemplate, ...rest } = props;
  if (rest.initialLanding.is_locked_template && lockedTemplate?.component_name) {
    return (
      <LiveNorthfieldLanding
        initialLanding={rest.initialLanding}
        lockedTemplate={lockedTemplate}
        clientId={rest.clientId}
        formSchema={rest.formSchema}
      />
    );
  }
  return <LivePublicLandingUnlocked {...rest} />;
}
