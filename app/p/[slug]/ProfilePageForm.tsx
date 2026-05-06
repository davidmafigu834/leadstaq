"use client";

import { useState } from "react";
import { ArrowRight, ArrowLeft, CheckCircle, Loader2 } from "lucide-react";

type FormFieldDef = {
  id: string;
  field_type: string;
  label: string;
  placeholder?: string | null;
  options?: string[] | null;
  is_required?: boolean | null;
  maps_to?: string | null;
  display_order?: number | null;
};

type FormStepDef = {
  id: string;
  step_number: number;
  title: string;
  form_fields?: FormFieldDef[];
};

const DEFAULT_STEPS: FormStepDef[] = [
  {
    id: "default-1",
    step_number: 1,
    title: "What can we help you with?",
    form_fields: [
      {
        id: "project_type",
        field_type: "select",
        label: "Type of project",
        is_required: false,
        maps_to: "project_type",
        options: ["Construction", "Solar", "Renovation", "Fencing", "Electrical", "Plumbing", "Landscaping", "Other"],
      },
      {
        id: "budget",
        field_type: "select",
        label: "Budget range",
        is_required: false,
        maps_to: "budget",
        options: ["Under $5,000", "$5,000 – $20,000", "$20,000 – $50,000", "$50,000 – $100,000", "Over $100,000"],
      },
    ],
  },
  {
    id: "default-2",
    step_number: 2,
    title: "Tell us about your project",
    form_fields: [
      {
        id: "notes",
        field_type: "textarea",
        label: "Project description",
        placeholder: "Describe what you need done...",
        is_required: false,
        maps_to: "notes",
      },
      {
        id: "timeline",
        field_type: "select",
        label: "Ideal timeline",
        is_required: false,
        maps_to: "timeline",
        options: ["As soon as possible", "Within 1 month", "1–3 months", "3–6 months", "Flexible"],
      },
    ],
  },
  {
    id: "default-3",
    step_number: 3,
    title: "How do we reach you?",
    form_fields: [
      { id: "name", field_type: "text", label: "Full name", placeholder: "Your full name", is_required: true, maps_to: "name" },
      { id: "phone", field_type: "phone", label: "Phone number", placeholder: "+1 555 000 0000", is_required: true, maps_to: "phone" },
      { id: "email", field_type: "email", label: "Email address", placeholder: "you@example.com", is_required: false, maps_to: "email" },
    ],
  },
];

export function ProfilePageForm({
  clientId,
  accentColor,
  ctaText,
  formSteps,
}: {
  clientId: string;
  accentColor: string;
  ctaText: string;
  formSteps: FormStepDef[];
}) {
  const steps = formSteps.length > 0 ? formSteps : DEFAULT_STEPS;
  const totalSteps = steps.length;

  const [currentStep, setCurrentStep] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitName, setSubmitName] = useState("");

  const step = steps[currentStep]!;
  const fields = [...(step.form_fields ?? [])].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    for (const f of fields) {
      if (f.is_required && !values[f.id]?.trim()) {
        newErrors[f.id] = `${f.label} is required`;
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleNext() {
    if (!validate()) return;
    if (currentStep < totalSteps - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      await handleSubmit();
    }
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const formData: Record<string, unknown> = { ...values };
      const res = await fetch("/api/public/submit-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, formData }),
      });
      if (res.ok) {
        setSubmitName(values["name"] ?? "");
        setSubmitted(true);
      }
    } catch {
      // silent
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <CheckCircle className="mb-4 h-14 w-14 text-green-500" strokeWidth={1.5} />
        <h3 className="mb-2 text-2xl font-semibold text-gray-900">
          Thanks{submitName ? `, ${submitName}` : ""}!
        </h3>
        <p className="text-gray-600">We&apos;ll be in touch shortly.</p>
      </div>
    );
  }

  const isLast = currentStep === totalSteps - 1;

  return (
    <div>
      <div className="mb-8 flex items-center gap-2">
        {steps.map((_, i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-all"
            style={{ backgroundColor: i <= currentStep ? accentColor : "#E5E7EB" }}
          />
        ))}
      </div>

      <p className="mb-1 font-mono text-xs uppercase tracking-[0.12em] text-gray-400">
        Step {currentStep + 1} of {totalSteps}
      </p>
      <h3 className="mb-6 text-xl font-semibold text-gray-900">{step.title}</h3>

      <div className="space-y-5">
        {fields.map((field) => (
          <div key={field.id}>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              {field.label}
              {field.is_required && <span className="ml-1 text-red-500">*</span>}
            </label>
            {field.field_type === "select" ? (
              <select
                value={values[field.id] ?? ""}
                onChange={(e) => {
                  setValues((v) => ({ ...v, [field.id]: e.target.value }));
                  setErrors((er) => ({ ...er, [field.id]: "" }));
                }}
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm focus:border-gray-400 focus:outline-none"
              >
                <option value="">Select an option…</option>
                {(field.options ?? []).map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : field.field_type === "textarea" ? (
              <textarea
                rows={4}
                placeholder={field.placeholder ?? ""}
                value={values[field.id] ?? ""}
                onChange={(e) => {
                  setValues((v) => ({ ...v, [field.id]: e.target.value }));
                  setErrors((er) => ({ ...er, [field.id]: "" }));
                }}
                className="w-full resize-none rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm focus:border-gray-400 focus:outline-none"
              />
            ) : (
              <input
                type={field.field_type === "phone" ? "tel" : field.field_type === "email" ? "email" : "text"}
                placeholder={field.placeholder ?? ""}
                value={values[field.id] ?? ""}
                onChange={(e) => {
                  setValues((v) => ({ ...v, [field.id]: e.target.value }));
                  setErrors((er) => ({ ...er, [field.id]: "" }));
                }}
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm focus:border-gray-400 focus:outline-none"
              />
            )}
            {errors[field.id] && (
              <p className="mt-1 text-xs text-red-500">{errors[field.id]}</p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-center gap-4">
        {currentStep > 0 && (
          <button
            type="button"
            onClick={() => setCurrentStep((s) => s - 1)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        )}
        <button
          type="button"
          onClick={handleNext}
          disabled={submitting}
          className="ml-auto flex items-center gap-2 rounded-lg px-8 py-3 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ backgroundColor: accentColor, color: "#000" }}
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isLast ? (
            ctaText
          ) : (
            <>Next <ArrowRight className="h-4 w-4" /></>
          )}
        </button>
      </div>
    </div>
  );
}
