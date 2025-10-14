import React, { useState } from "react";
import {
  Briefcase, Clock, DollarSign, CheckCircle, X, Mail,
  Palette, Code, Scale, Shield, Inbox, TrendingUp,
  Target, GraduationCap, PenTool, MoreHorizontal
} from "lucide-react";

const CATEGORY_CONFIG = {
  design: { icon: Palette, label: "Design", color: "text-purple-600", bg: "bg-purple-50" },
  development: { icon: Code, label: "Development", color: "text-blue-600", bg: "bg-blue-50" },
  legal: { icon: Scale, label: "Legal", color: "text-amber-600", bg: "bg-amber-50" },
  security: { icon: Shield, label: "Security", color: "text-red-600", bg: "bg-red-50" },
  "office-admin": { icon: Inbox, label: "Office Admin", color: "text-gray-600", bg: "bg-gray-50" },
  marketing: { icon: TrendingUp, label: "Marketing", color: "text-green-600", bg: "bg-green-50" },
  strategy: { icon: Target, label: "Strategy", color: "text-indigo-600", bg: "bg-indigo-50" },
  education: { icon: GraduationCap, label: "Education", color: "text-cyan-600", bg: "bg-cyan-50" },
  copywriting: { icon: PenTool, label: "Copywriting", color: "text-pink-600", bg: "bg-pink-50" },
  other: { icon: MoreHorizontal, label: "Other", color: "text-slate-600", bg: "bg-slate-50" }
};

export default function GigCard({
  data = {
    gig_title: "Untitled Gig",
    gig_description: "No description provided",
    timeline: "TBD",
    budget: "TBD",
    skills_required: [],
    category: "other",
    success_criteria: []
  },
  setData = () => {}
}) {
  const { gig_title, gig_description, timeline, budget, skills_required, category = "other", success_criteria = [] } = data;
  const categoryConfig = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.other;
  const CategoryIcon = categoryConfig.icon;
  const [newSkill, setNewSkill] = useState("");
  const [newCriteria, setNewCriteria] = useState("");
  const [email, setEmail] = useState("");
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // null | 'success' | 'error'

  function handleInitialSave() {
    setShowEmailInput(true);
  }

  async function handleConfirmSave() {
    setSaving(true);
    setSaveStatus(null);

    try {
      const result = await window.openai?.callTool("save-gig", {
        gig_title: data.gig_title,
        gig_description: data.gig_description,
        timeline: data.timeline || "TBD",
        budget: data.budget || "TBD",
        skills_required: data.skills_required || [],
        category: data.category || "other",
        success_criteria: data.success_criteria || [],
        email: email || undefined
      });

      console.log("✅ Gig saved successfully:", result);
      setSaveStatus('success');

      // Reset success message after 3 seconds
      setTimeout(() => {
        setSaveStatus(null);
        setShowEmailInput(false);
        setEmail("");
      }, 3000);
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
          <div className={`p-3 rounded-xl ${categoryConfig.bg}`}>
            <CategoryIcon className={`h-6 w-6 ${categoryConfig.color}`} />
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
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryConfig.bg} ${categoryConfig.color}`}>
                {categoryConfig.label}
              </span>
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

      {/* Success Criteria */}
      <div className="px-6 py-4 border-t border-black/5">
        <h3 className="text-xs font-semibold text-black/50 uppercase tracking-wider mb-3">Success Criteria</h3>
        <div className="space-y-2 mb-3">
          {success_criteria && success_criteria.length > 0 && success_criteria.map((criteria, i) => (
            <div
              key={i}
              className="flex items-start gap-2 p-2 rounded-lg bg-green-50 text-sm text-black/80 hover:bg-green-100 transition-colors"
            >
              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span className="flex-1">{criteria}</span>
              <button
                onClick={() => {
                  const newCriteria = success_criteria.filter((_, idx) => idx !== i);
                  setData({ ...data, success_criteria: newCriteria });
                }}
                className="hover:text-red-600 transition-colors"
                aria-label="Remove criteria"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newCriteria}
            onChange={(e) => setNewCriteria(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newCriteria.trim()) {
                setData({ ...data, success_criteria: [...(success_criteria || []), newCriteria.trim()] });
                setNewCriteria("");
              }
            }}
            className="flex-1 px-3 py-1.5 text-sm border border-black/10 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            placeholder="Add success criteria (press Enter)"
          />
          <button
            onClick={() => {
              if (newCriteria.trim()) {
                setData({ ...data, success_criteria: [...(success_criteria || []), newCriteria.trim()] });
                setNewCriteria("");
              }
            }}
            className="px-4 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
          >
            Add
          </button>
        </div>
      </div>

      {/* Skills */}
      <div className="px-6 py-4 border-t border-black/5">
        <h3 className="text-xs font-semibold text-black/50 uppercase tracking-wider mb-3">Skills Required</h3>
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
        <div className="flex items-center justify-end gap-3">
          {showEmailInput && (
            <div className="flex-1 max-w-xs flex items-center gap-2 px-4 py-2 bg-white border border-black/10 rounded-full">
              <Mail className="h-4 w-4 text-black/40" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-transparent border-none focus:outline-none text-sm text-black"
                placeholder="your@email.com"
              />
            </div>
          )}
          <button
            type="button"
            onClick={showEmailInput ? handleConfirmSave : handleInitialSave}
            disabled={saving || (showEmailInput && !email.trim())}
            className="cursor-pointer inline-flex items-center justify-center rounded-full bg-blue-600 text-white px-6 py-2.5 text-sm font-medium hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {saving ? "Saving..." : saveStatus === 'success' ? "✓ Saved!" : saveStatus === 'error' ? "✗ Failed" : showEmailInput ? "Confirm" : "Save Gig"}
          </button>
        </div>
      </div>
    </div>
  );
}
