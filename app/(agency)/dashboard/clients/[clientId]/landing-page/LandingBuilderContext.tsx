"use client";

import { createContext, useCallback, useContext, useMemo, useReducer } from "react";
import type { LandingFormState } from "@/lib/landing-types";

type Combined = { draft: LandingFormState; saved: LandingFormState };

type Action =
  | { type: "HYDRATE_BOTH"; payload: LandingFormState }
  | { type: "PATCH"; payload: Partial<LandingFormState> }
  | { type: "PATCH_FN"; fn: (s: LandingFormState) => Partial<LandingFormState> }
  | { type: "MARK_SAVED"; payload: LandingFormState }
  | { type: "RESET_DRAFT" };

function reducer(state: Combined, action: Action): Combined {
  switch (action.type) {
    case "HYDRATE_BOTH":
      return { draft: action.payload, saved: action.payload };
    case "PATCH":
      return { ...state, draft: { ...state.draft, ...action.payload } };
    case "PATCH_FN":
      return { ...state, draft: { ...state.draft, ...action.fn(state.draft) } };
    case "MARK_SAVED":
      return { draft: action.payload, saved: action.payload };
    case "RESET_DRAFT":
      return { ...state, draft: structuredClone(state.saved) };
    default:
      return state;
  }
}

type Ctx = {
  state: LandingFormState;
  saved: LandingFormState;
  dispatch: React.Dispatch<Action>;
  patch: (p: Partial<LandingFormState>) => void;
  patchFn: (fn: (s: LandingFormState) => Partial<LandingFormState>) => void;
  hydrate: (s: LandingFormState) => void;
  markSaved: (s: LandingFormState) => void;
  resetToSaved: () => void;
};

const LandingBuilderContext = createContext<Ctx | null>(null);

export function LandingBuilderProvider({
  initial,
  children,
}: {
  initial: LandingFormState;
  children: React.ReactNode;
}) {
  const [combined, dispatch] = useReducer(reducer, { draft: initial, saved: initial });

  const patch = useCallback((p: Partial<LandingFormState>) => {
    dispatch({ type: "PATCH", payload: p });
  }, []);

  const patchFn = useCallback((fn: (s: LandingFormState) => Partial<LandingFormState>) => {
    dispatch({ type: "PATCH_FN", fn });
  }, []);

  const hydrate = useCallback((s: LandingFormState) => {
    dispatch({ type: "HYDRATE_BOTH", payload: s });
  }, []);

  const markSaved = useCallback((s: LandingFormState) => {
    dispatch({ type: "MARK_SAVED", payload: s });
  }, []);

  const resetToSaved = useCallback(() => {
    dispatch({ type: "RESET_DRAFT" });
  }, []);

  const value = useMemo(
    () => ({
      state: combined.draft,
      saved: combined.saved,
      dispatch,
      patch,
      patchFn,
      hydrate,
      markSaved,
      resetToSaved,
    }),
    [combined.draft, combined.saved, patch, patchFn, hydrate, markSaved, resetToSaved]
  );

  return <LandingBuilderContext.Provider value={value}>{children}</LandingBuilderContext.Provider>;
}

export function useLandingBuilder() {
  const c = useContext(LandingBuilderContext);
  if (!c) throw new Error("useLandingBuilder outside provider");
  return c;
}

export function useLandingDirty() {
  const { state, saved } = useLandingBuilder();
  return JSON.stringify(state) !== JSON.stringify(saved);
}
