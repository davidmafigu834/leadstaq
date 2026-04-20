"use client";

import { Suspense } from "react";
import { AgencyLeadDrawer } from "./AgencyLeadDrawer";

export function AgencyLeadDrawerHost() {
  return (
    <Suspense fallback={null}>
      <AgencyLeadDrawer />
    </Suspense>
  );
}
