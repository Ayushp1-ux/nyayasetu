// client/components/QuestionSnapshot.tsx
import React from "react";

export type QuestionSnapshotData = {
  id?: string;
  title: string | null;
  description: string | null;
  category: string | null;
  contact_method?: string | null;
  urgency?: string | null;
  file_url?: string | null;
  created_at?: string | null;
};

export const QuestionSnapshot: React.FC<{ question: QuestionSnapshotData }> = ({
  question,
}) => {
  const { title, description, category, contact_method, urgency, created_at } =
    question;

  return (
    <div className="rounded-xl bg-slate-800/80 border border-slate-700 p-3 mb-2">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold text-slate-50 line-clamp-1">
          {title && title.trim().length > 0 ? title : "Untitled issue"}
        </h3>
        <span className="px-2 py-0.5 rounded-full text-xs bg-blue-500/15 text-blue-300 border border-blue-500/40">
          {category && category.trim().length > 0 ? category : "General"}
        </span>
      </div>

      {/* Short description */}
      {description && (
        <p className="mt-1 text-xs text-slate-300 line-clamp-2">
          {description}
        </p>
      )}

      {/* Chips */}
      <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-300">
        {contact_method && (
          <span className="px-2 py-0.5 rounded-full bg-slate-900/60 border border-slate-600">
            Contact: {contact_method}
          </span>
        )}

        {urgency && (
          <span className="px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/40 text-red-300">
            Urgency: {urgency}
          </span>
        )}

        {created_at && (
          <span className="px-2 py-0.5 rounded-full bg-slate-900/60 border border-slate-600">
            {new Date(created_at).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );
};
