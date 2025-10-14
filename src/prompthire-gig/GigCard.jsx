import React, { useState } from "react";
import { Briefcase, Clock, DollarSign, CheckCircle, X } from "lucide-react";

export default function GigCard({
  data = {
    gig_title: "Untitled Gig",
    gig_description: "No description provided",
    timeline: "TBD",
    budget: "TBD",
    skills_required: []
  },
  setData = () => {}
}) {
  const { gig_title, gig_description, timeline, budget, skills_required } = data;
  const [newSkill, setNewSkill] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // null | 'success' | 'error'

  async function handleSaveGig() {
    setSaving(true);
    setSaveStatus(null);

    try {
      const result = await window.openai?.callTool("save-gig", {
        gig_title: data.gig_title,
        gig_description: data.gig_description,
        timeline: data.timeline || "TBD",
        budget: data.budget || "TBD",
        skills_required: data.skills_required || []
      });

      console.log("✅ Gig saved successfully:", result);
      setSaveStatus('success');

      // Reset success message after 3 seconds
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error) {
      console.error("❌ Failed to save gig:", error);
      setSaveStatus('error');

      // Reset error message after 3 seconds
      setTimeout(() => setSaveStatus(null), 3000);
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="w-full max-w-2xl border border-black/10 rounded-2xl sm:rounded-3xl overflow-hidden bg-white shadow-sm">
      {/* Header */}
      <div className="px-6 py-5 border-b border-black/5">
        <div className="flex items-start gap-3">
          <div className="p-3 rounded-xl bg-blue-50">
            <Briefcase className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={gig_title}
              onChange={(e) => setData({ ...data, gig_title: e.target.value })}
              className="text-xl font-semibold text-black w-full bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 rounded px-2 -mx-2"
              placeholder="Untitled Gig"
            />
            <div className="flex items-center gap-4 mt-2 text-sm text-black/60">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 flex-shrink-0" />
                <input
                  type="text"
                  value={timeline}
                  onChange={(e) => setData({ ...data, timeline: e.target.value })}
                  className="bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 rounded px-1 -mx-1 min-w-0"
                  placeholder="TBD"
                />
              </div>
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4 flex-shrink-0" />
                <input
                  type="text"
                  value={budget}
                  onChange={(e) => setData({ ...data, budget: e.target.value })}
                  className="bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 rounded px-1 -mx-1 min-w-0"
                  placeholder="TBD"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="px-6 py-5">
        <textarea
          value={gig_description}
          onChange={(e) => setData({ ...data, gig_description: e.target.value })}
          className="text-sm text-black/80 whitespace-pre-wrap w-full bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 rounded px-2 -mx-2 resize-y min-h-[100px]"
          placeholder="No description provided"
        />
      </div>

      {/* Skills */}
      <div className="px-6 py-4 border-t border-black/5">
        <div className="flex flex-wrap gap-2 mb-3">
          {skills_required && skills_required.length > 0 && skills_required.map((skill, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-sm text-black/70 hover:bg-gray-200 transition-colors"
            >
              <CheckCircle className="h-3 w-3" />
              {skill}
              <button
                onClick={() => {
                  const newSkills = skills_required.filter((_, idx) => idx !== i);
                  setData({ ...data, skills_required: newSkills });
                }}
                className="ml-1 hover:text-red-600 transition-colors"
                aria-label="Remove skill"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newSkill.trim()) {
                setData({ ...data, skills_required: [...(skills_required || []), newSkill.trim()] });
                setNewSkill("");
              }
            }}
            className="flex-1 px-3 py-1.5 text-sm border border-black/10 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            placeholder="Add a skill (press Enter)"
          />
          <button
            onClick={() => {
              if (newSkill.trim()) {
                setData({ ...data, skills_required: [...(skills_required || []), newSkill.trim()] });
                setNewSkill("");
              }
            }}
            className="px-4 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
          >
            Add
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 py-4 border-t border-black/5 bg-gray-50">
        <button
          type="button"
          onClick={handleSaveGig}
          disabled={saving}
          className="w-full sm:w-auto cursor-pointer inline-flex items-center justify-center rounded-full bg-blue-600 text-white px-6 py-2.5 text-sm font-medium hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {saving ? "Saving..." : saveStatus === 'success' ? "✓ Saved!" : saveStatus === 'error' ? "✗ Failed" : "Save Gig"}
        </button>
      </div>
    </div>
  );
}
