import React from "react";
import { Briefcase, Clock, DollarSign, CheckCircle } from "lucide-react";

export default function GigCard({
  gig_title = "Untitled Gig",
  gig_description = "No description provided",
  timeline = "TBD",
  budget = "TBD",
  skills_required = []
}) {
  return (
    <div className="w-full max-w-2xl border border-black/10 rounded-2xl sm:rounded-3xl overflow-hidden bg-white shadow-sm">
      {/* Header */}
      <div className="px-6 py-5 border-b border-black/5">
        <div className="flex items-start gap-3">
          <div className="p-3 rounded-xl bg-blue-50">
            <Briefcase className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold text-black truncate">
              {gig_title}
            </h2>
            <div className="flex items-center gap-4 mt-2 text-sm text-black/60">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{timeline}</span>
              </div>
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                <span>{budget}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="px-6 py-5">
        <p className="text-sm text-black/80 whitespace-pre-wrap">
          {gig_description}
        </p>
      </div>

      {/* Skills */}
      {skills_required && skills_required.length > 0 && (
        <div className="px-6 py-4 border-t border-black/5">
          <div className="flex flex-wrap gap-2">
            {skills_required.map((skill, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-sm text-black/70"
              >
                <CheckCircle className="h-3 w-3" />
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-6 py-4 border-t border-black/5 bg-gray-50">
        <button
          type="button"
          className="w-full sm:w-auto cursor-pointer inline-flex items-center justify-center rounded-full bg-blue-600 text-white px-6 py-2.5 text-sm font-medium hover:bg-blue-700 active:bg-blue-800"
        >
          Post Gig
        </button>
      </div>
    </div>
  );
}
