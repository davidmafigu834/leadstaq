import { z } from "zod";
import { northfieldContentSchema, northfieldThemeSchema } from "@/lib/templates/northfield/schema";

/** Agency PATCH body when `landing_pages.is_locked_template` is true (Northfield). */
export const lockedNorthfieldLandingPatchSchema = z.object({
  template_content: northfieldContentSchema,
  template_theme: northfieldThemeSchema,
  published: z.boolean().optional(),
  seo_title: z.string().max(70).optional().nullable(),
  seo_description: z.string().max(160).optional().nullable(),
  og_image_url: z.union([z.string().url(), z.null()]).optional(),
  custom_domain: z.string().optional().nullable(),
});

export type LockedNorthfieldLandingPatch = z.infer<typeof lockedNorthfieldLandingPatchSchema>;
