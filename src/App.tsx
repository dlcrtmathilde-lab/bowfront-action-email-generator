/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Copy,
  Check,
  Sparkles,
  Upload,
  AlertCircle,
  Calendar,
  Users,
  Clock,
  HelpCircle,
  FileText,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Info,
  Edit3,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ACCEPTANCE_PRESETS, Preset } from './presets';

interface TaskItem {
  number: number;
  owner: string;
  task: string;
  due: string;
  isPastDue: boolean;
  isTbd: boolean;
}

interface GenerateResult {
  isMissingNotes: boolean;
  email: string;
  notesToUser: string;
  meetingDateFound: string;
  taskCount: number;
  openQuestionsCount: number;
  pastDueCount: number;
  tbdCount: number;
  absentMembers: string[];
  tasks: TaskItem[];
}

export default function App() {
  const [notes, setNotes] = useState<string>('');
  const [activePresetId, setActivePresetId] = useState<string>('');
  const [senderName, setSenderName] = useState<string>('Mathilde');
  const [todayDate, setTodayDate] = useState<string>('Thursday, Oct 29, 2026');
  const [meetingDateOverride, setMeetingDateOverride] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [isEditingEmail, setIsEditingEmail] = useState<boolean>(false);
  const [editedEmail, setEditedEmail] = useState<string>('');
  const [dragActive, setDragActive] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLTextAreaElement>(null);

  // Load preset helper
  const handleSelectPreset = (preset: Preset) => {
    setActivePresetId(preset.id);
    setNotes(preset.notes);
    if (preset.todayDate) {
      setTodayDate(preset.todayDate);
    }
    if (preset.meetingDate) {
      setMeetingDateOverride(preset.meetingDate);
    } else {
      setMeetingDateOverride('');
    }
    setResult(null);
    setError(null);
    setIsEditingEmail(false);
  };

  const handleLoadSample = () => {
    handleSelectPreset(ACCEPTANCE_PRESETS[0]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setNotes(text);
        setActivePresetId('');
        setResult(null);
      };
      reader.readAsText(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type === 'text/plain' || file.name.endsWith('.txt'))) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setNotes(text);
        setActivePresetId('');
        setResult(null);
      };
      reader.readAsText(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
  };

  const generateEmail = async () => {
    // If the user clicks the button with an empty box, don't call Gemini.
    if (!notes || notes.trim().length === 0) {
      setError('Please paste your meeting notes first.');
      setResult(null);
      return;
    }

    setLoading(true);
    setError(null);
    setCopied(false);
    setIsEditingEmail(false);

    try {
      const res = await fetch('/api/generate-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notes,
          todayDate,
          senderName,
          meetingDateOverride: meetingDateOverride.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with status ${res.status}`);
      }

      const data: GenerateResult = await res.json();
      setResult(data);
      setEditedEmail(data.email);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while generating the action email.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyEmail = () => {
    const textToCopy = isEditingEmail ? editedEmail : (result?.email || '');
    if (!textToCopy) return;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(textToCopy)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2400);
        })
        .catch(() => {
          fallbackCopy(textToCopy);
        });
    } else {
      fallbackCopy(textToCopy);
    }
  };

  const fallbackCopy = (text: string) => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  // Keyboard shortcut Ctrl/Cmd + Enter to trigger generation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        generateEmail();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [notes, todayDate, senderName, meetingDateOverride]);

  const activePreset = ACCEPTANCE_PRESETS.find((p) => p.id === activePresetId);

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col">
      {/* Top Header / Branding */}
      <header className="border-b border-stone-200 bg-white sticky top-0 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 via-orange-600 to-stone-900 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              B
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-stone-900 tracking-tight text-lg">
                  Bowfront Creative
                </h1>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200/60 uppercase tracking-wide">
                  Calgary Team
                </span>
              </div>
              <p className="text-xs text-stone-500 font-medium">
                Weekly Meeting Action-Item Email Synthesizer
              </p>
            </div>
          </div>

          {/* Quick Team Reference Tooltip & Metadata */}
          <div className="flex items-center gap-4 text-xs text-stone-600">
            <div className="hidden md:flex items-center gap-1.5 bg-stone-100 px-3 py-1.5 rounded-lg border border-stone-200/80">
              <Users className="w-3.5 h-3.5 text-orange-600" />
              <span className="font-semibold text-stone-700">Team:</span>
              <span>Priya, Dana, Marcus, Jen, Theo (Riley)</span>
            </div>
            <div className="flex items-center gap-1.5 bg-stone-100 px-3 py-1.5 rounded-lg border border-stone-200/80">
              <Clock className="w-3.5 h-3.5 text-stone-500" />
              <span className="font-semibold text-stone-700">Today:</span>
              <span className="truncate max-w-[140px]">{todayDate}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Acceptance Test Presets Ribbon */}
      <div className="bg-stone-100/80 border-b border-stone-200 py-2.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-700 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Acceptance Test Presets:</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap w-full md:w-auto">
            {ACCEPTANCE_PRESETS.map((preset, index) => {
              const isSelected = activePresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className={`text-xs px-2.5 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 border ${
                    isSelected
                      ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                      : 'bg-white text-stone-700 hover:bg-stone-50 border-stone-200 hover:border-stone-300'
                  }`}
                  title={preset.description}
                >
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isSelected ? 'bg-orange-500 text-white' : 'bg-stone-200 text-stone-700'
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span>{preset.name.replace(/Acceptance \d: /, '')}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Input Meeting Notes */}
        <section className="lg:col-span-5 flex flex-col gap-4">
          <div
            className={`bg-white rounded-2xl border ${
              dragActive ? 'border-orange-500 ring-2 ring-orange-200' : 'border-stone-200'
            } shadow-xs p-5 flex flex-col gap-4 relative transition-all`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            {/* Input Header */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-orange-600" />
                <h2 className="font-bold text-stone-900 text-sm tracking-tight">
                  Team Meeting Notes
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="text-xs px-2.5 py-1 rounded-lg bg-orange-50 border border-orange-200/90 hover:bg-orange-100 text-orange-900 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  title="Fill input box with sample Bowfront meeting notes"
                >
                  <Sparkles className="w-3.5 h-3.5 text-orange-600" />
                  <span>Try a sample</span>
                </button>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".txt"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs px-2.5 py-1 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-600 hover:text-stone-900 font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Upload .txt file"
                >
                  <Upload className="w-3.5 h-3.5 text-stone-500" />
                  <span>Upload .txt</span>
                </button>

                {notes && (
                  <button
                    type="button"
                    onClick={() => {
                      setNotes('');
                      setActivePresetId('');
                      setResult(null);
                    }}
                    className="text-xs p-1 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    title="Clear notes"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Empty notes guidance banner */}
            {!notes && (
              <div className="bg-orange-50/70 border border-orange-200/80 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                <div className="flex items-center gap-2 text-stone-800">
                  <Sparkles className="w-4 h-4 text-orange-600 shrink-0" />
                  <span>
                    New here? Load sample Bowfront meeting notes to test immediately.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="shrink-0 text-xs px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer self-start sm:self-auto"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Try a sample</span>
                </button>
              </div>
            )}

            {/* Active Preset Banner (if selected) */}
            {activePreset && (
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 text-xs flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-amber-900">{activePreset.name}</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-100/90 text-amber-800 font-medium text-[10px]">
                    {activePreset.badge}
                  </span>
                </div>
                <p className="text-amber-800/90 text-[11px] leading-relaxed">
                  {activePreset.description}
                </p>
                <div className="mt-1 pt-1 border-t border-amber-200/60 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-amber-900">
                  {activePreset.keyVerifications.map((v, i) => (
                    <span key={i} className="inline-flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-amber-600" />
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Textarea */}
            <div className="relative">
              <textarea
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value);
                  setActivePresetId('');
                  if (error) setError(null);
                }}
                rows={14}
                placeholder="Paste weekly meeting notes here (or drag & drop a .txt file)...

Example:
Date: Tuesday, Oct 20, 2026
Attendees: Priya, Dana, Marcus, Jen, Theo
- Jen: Finalize copy deck for Kettle & Crumb - due Mon Oct 19
- Dana: QA testing on Foothills Physio - due tomorrow
- Marcus: Revised branding guidelines - due Friday"
                className="w-full text-xs font-mono bg-stone-50/70 border border-stone-200 rounded-xl p-3.5 text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-y leading-relaxed"
              />
              <div className="flex items-center justify-between mt-1 text-[11px] text-stone-400 px-1 font-mono">
                <span>{notes.length} characters</span>
                <span>{notes.split('\n').filter((l) => l.trim()).length} lines</span>
              </div>
            </div>

            {/* Quick Settings & Controls Toggle */}
            <div className="border-t border-stone-100 pt-3 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center justify-between text-xs text-stone-600 hover:text-stone-900 font-medium py-1"
              >
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-stone-500" />
                  <span>Sender & Date Context</span>
                </span>
                {showAdvanced ? (
                  <ChevronUp className="w-4 h-4 text-stone-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-stone-400" />
                )}
              </button>

              {showAdvanced && (
                <div className="bg-stone-50 rounded-xl p-3 border border-stone-200/80 flex flex-col gap-2.5 text-xs">
                  <div>
                    <label className="block text-stone-600 font-semibold mb-1">
                      Sender Name (Email Sign-off)
                    </label>
                    <input
                      type="text"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder="e.g. Mathilde"
                      className="w-full bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-600 font-semibold mb-1">
                      Reference "Today" Date (for Past Due Checks)
                    </label>
                    <input
                      type="text"
                      value={todayDate}
                      onChange={(e) => setTodayDate(e.target.value)}
                      placeholder="e.g. Thursday, Oct 29, 2026"
                      className="w-full bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-orange-500"
                    />
                    <span className="text-[10px] text-stone-500 block mt-0.5">
                      Tasks with deadlines prior to this date get flagged with "⚠️ past due".
                    </span>
                  </div>

                  <div>
                    <label className="block text-stone-600 font-semibold mb-1">
                      Meeting Date Override (Optional)
                    </label>
                    <input
                      type="text"
                      value={meetingDateOverride}
                      onChange={(e) => setMeetingDateOverride(e.target.value)}
                      placeholder="Auto-detected from notes if blank (e.g. Tuesday, Oct 20, 2026)"
                      className="w-full bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Clear Warning / Error Alert */}
            {error && (
              <div
                className={`rounded-xl p-3 flex items-start gap-2.5 text-xs font-medium animate-in fade-in duration-150 ${
                  error === 'Please paste your meeting notes first.'
                    ? 'bg-amber-50 border border-amber-300 text-amber-900 shadow-2xs'
                    : 'bg-red-50 border border-red-200 text-red-800'
                }`}
              >
                <AlertCircle
                  className={`w-4 h-4 shrink-0 mt-0.5 ${
                    error === 'Please paste your meeting notes first.'
                      ? 'text-amber-600'
                      : 'text-red-600'
                  }`}
                />
                <div className="flex-1">
                  <span className="font-semibold">{error}</span>
                </div>
              </div>
            )}

            {/* Primary Action Button */}
            <button
              type="button"
              onClick={generateEmail}
              disabled={loading}
              className={`w-full py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-sm ${
                loading
                  ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
                  : 'bg-stone-900 hover:bg-stone-800 text-white active:scale-[0.99] cursor-pointer'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing Notes with Gemini...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-orange-400" />
                  <span>Generate Action Email</span>
                  <span className="text-stone-400 text-xs font-normal ml-1 hidden sm:inline">
                    (⌘+Enter)
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Skill Rules Cheat-Sheet */}
          <div className="bg-white rounded-2xl border border-stone-200 p-4 text-xs text-stone-600 flex flex-col gap-2">
            <div className="flex items-center gap-1.5 font-bold text-stone-800">
              <Info className="w-3.5 h-3.5 text-orange-600" />
              <span>Bowfront Agency Skill Rules</span>
            </div>
            <ul className="space-y-1.5 text-[11px] text-stone-600 list-disc list-inside">
              <li>
                <strong className="text-stone-800">Team:</strong> Priya, Dana, Marcus, Jen, Theo (Riley). Initials replaced with full names.
              </li>
              <li>
                <strong className="text-stone-800">Clients:</strong> Keep names as written (Kettle & Crumb, Foothills Physio).
              </li>
              <li>
                <strong className="text-stone-800">Absentees:</strong> Only add absentee line if notes explicitly mention they were absent/away.
              </li>
              <li>
                <strong className="text-stone-800">Relative Dates:</strong> Converted via meeting date. "end of next week" = Friday of next week.
              </li>
              <li>
                <strong className="text-stone-800">TBD & Past Due:</strong> Missing owner → "TBD:". Missing deadline → "Due TBD". Every TBD gets an open question. Past due dates flagged with ⚠️.
              </li>
              <li>
                <strong className="text-stone-800">Zero Hallucination:</strong> Never invent tasks, dates, or members.
              </li>
            </ul>
          </div>
        </section>

        {/* Right Column: Output Email & Clarification Notes */}
        <section className="lg:col-span-7 flex flex-col gap-4">
          {error && (
            <div
              className={`rounded-2xl p-4 flex items-start gap-3 text-xs ${
                error === 'Please paste your meeting notes first.'
                  ? 'bg-amber-50 border border-amber-300 text-amber-900 shadow-xs'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}
            >
              <AlertCircle
                className={`w-4 h-4 shrink-0 mt-0.5 ${
                  error === 'Please paste your meeting notes first.'
                    ? 'text-amber-600'
                    : 'text-red-600'
                }`}
              />
              <div>
                <p className="font-semibold">
                  {error === 'Please paste your meeting notes first.'
                    ? 'Notes Required'
                    : 'Generation Error'}
                </p>
                <p
                  className={`mt-0.5 ${
                    error === 'Please paste your meeting notes first.'
                      ? 'text-amber-800 font-medium'
                      : 'text-red-700'
                  }`}
                >
                  {error}
                </p>
              </div>
            </div>
          )}

          {/* Empty Notes Safety Check Response */}
          {result?.isMissingNotes && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-stone-900 flex flex-col gap-3 shadow-xs">
              <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <span>Notes Required — No Meeting Notes Found</span>
              </div>
              <p className="text-xs text-amber-900 leading-relaxed">
                {result.notesToUser}
              </p>
              <div className="bg-white/80 rounded-xl p-3 border border-amber-200/60 text-xs text-stone-700 space-y-1.5">
                <p className="font-semibold text-stone-800">Skill Safety Rule Enforced:</p>
                <p>
                  "Never write the email if no notes are given: ask for the notes instead. Never invent names, dates, times, tasks or reminders."
                </p>
              </div>
            </div>
          )}

          {/* Generated Result Display */}
          {result && !result.isMissingNotes && (
            <div className="flex flex-col gap-4">
              {/* Quality & Rule Verification Badges */}
              <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-stone-900 text-xs tracking-tight">
                      Skill Compliance & Verification
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-stone-500">
                    Meeting: {result.meetingDateFound || 'Identified'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="bg-stone-50 border border-stone-200/80 rounded-xl p-2.5 flex flex-col">
                    <span className="text-[10px] text-stone-500 uppercase font-semibold">
                      Tasks Extracted
                    </span>
                    <span className="text-base font-bold text-stone-900 mt-0.5">
                      {result.taskCount}
                    </span>
                  </div>

                  <div className="bg-stone-50 border border-stone-200/80 rounded-xl p-2.5 flex flex-col">
                    <span className="text-[10px] text-stone-500 uppercase font-semibold">
                      Past Due Flagged
                    </span>
                    <span
                      className={`text-base font-bold mt-0.5 ${
                        result.pastDueCount > 0 ? 'text-amber-700' : 'text-stone-700'
                      }`}
                    >
                      {result.pastDueCount}
                    </span>
                  </div>

                  <div className="bg-stone-50 border border-stone-200/80 rounded-xl p-2.5 flex flex-col">
                    <span className="text-[10px] text-stone-500 uppercase font-semibold">
                      TBD Items
                    </span>
                    <span
                      className={`text-base font-bold mt-0.5 ${
                        result.tbdCount > 0 ? 'text-blue-700' : 'text-stone-700'
                      }`}
                    >
                      {result.tbdCount}
                    </span>
                  </div>

                  <div className="bg-stone-50 border border-stone-200/80 rounded-xl p-2.5 flex flex-col">
                    <span className="text-[10px] text-stone-500 uppercase font-semibold">
                      Absent Members
                    </span>
                    <span className="text-xs font-semibold text-stone-800 mt-1 truncate">
                      {result.absentMembers && result.absentMembers.length > 0
                        ? result.absentMembers.join(', ')
                        : 'None noted'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Ready-to-Send Email Container */}
              <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden flex flex-col">
                {/* Email Action Header */}
                <div className="bg-stone-900 text-white px-5 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-orange-400" />
                    <span className="font-bold text-xs uppercase tracking-wider text-stone-200">
                      Plain-Text Action Email (Ready to Copy)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingEmail(!isEditingEmail)}
                      className={`text-xs px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1.5 transition-colors ${
                        isEditingEmail
                          ? 'bg-orange-600 text-white border-orange-500'
                          : 'bg-stone-800 hover:bg-stone-700 text-stone-200 border-stone-700'
                      }`}
                      title="Edit email before copying"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{isEditingEmail ? 'Done Editing' : 'Edit'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyEmail}
                      className={`text-xs px-3.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                        copied
                          ? 'bg-emerald-600 text-white'
                          : 'bg-orange-500 hover:bg-orange-600 text-white'
                      }`}
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Email</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Plain-Text Email Canvas */}
                <div className="p-5 bg-white">
                  {isEditingEmail ? (
                    <textarea
                      ref={emailRef}
                      value={editedEmail}
                      onChange={(e) => setEditedEmail(e.target.value)}
                      rows={16}
                      className="w-full text-xs font-mono bg-stone-50 border border-stone-200 rounded-xl p-4 text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500 leading-relaxed resize-y"
                    />
                  ) : (
                    <pre className="text-xs font-mono text-stone-900 whitespace-pre-wrap font-normal leading-relaxed select-all bg-stone-50/60 p-4 rounded-xl border border-stone-200/80">
                      {editedEmail || result.email}
                    </pre>
                  )}
                </div>

                {/* Bottom Action Bar Directly Under Email Text */}
                <div className="border-t border-stone-200 bg-stone-50/80 px-5 py-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs text-stone-500 font-mono">
                    <span>
                      {((isEditingEmail ? editedEmail : result.email) || '').split('\n').filter((l) => l.trim()).length} lines
                    </span>
                    <span>•</span>
                    <span>Ready to paste directly into your email client</span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {copied && (
                      <span className="text-xs font-semibold text-emerald-800 bg-emerald-100 border border-emerald-300 px-3 py-1.5 rounded-lg flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-150">
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>Copied!</span>
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={handleCopyEmail}
                      className={`text-xs px-4 py-2 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-xs cursor-pointer ${
                        copied
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-300'
                          : 'bg-stone-900 hover:bg-stone-800 text-white active:scale-[0.98]'
                      }`}
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 text-white" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 text-orange-400" />
                          <span>Copy email</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Note to the User About Anything Unclear (Required Output) */}
              <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4.5 shadow-xs flex flex-col gap-2">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs tracking-tight">
                  <HelpCircle className="w-4 h-4 text-amber-600" />
                  <span>Notes & Clarifications for the Sender</span>
                </div>
                <div className="text-xs text-amber-900/90 leading-relaxed whitespace-pre-line font-medium pl-6">
                  {result.notesToUser}
                </div>
              </div>

              {/* Structured Task Breakdown Card */}
              {result.tasks && result.tasks.length > 0 && (
                <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-stone-900 text-xs">
                      Extracted Tasks Breakdown ({result.tasks.length})
                    </span>
                    <span className="text-[11px] text-stone-500">
                      Sorted chronologically (earliest first, TBD last)
                    </span>
                  </div>

                  <div className="divide-y divide-stone-100 text-xs">
                    {result.tasks.map((t) => (
                      <div
                        key={t.number}
                        className="py-2.5 flex items-start justify-between gap-3"
                      >
                        <div className="flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-stone-100 text-stone-700 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                            {t.number}
                          </span>
                          <div>
                            <span className="font-bold text-stone-900">{t.owner}: </span>
                            <span className="text-stone-700">{t.task}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {t.isPastDue && (
                            <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-800 font-semibold text-[10px] border border-red-200">
                              ⚠️ Past Due
                            </span>
                          )}
                          {t.isTbd && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-semibold text-[10px] border border-amber-200">
                              TBD
                            </span>
                          )}
                          <span className="text-stone-600 font-mono text-[11px]">{t.due}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Placeholder When No Generation Yet */}
          {!result && !loading && (
            <div className="bg-white rounded-2xl border border-stone-200 p-8 shadow-xs flex flex-col items-center text-center justify-center min-h-[420px] gap-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200/60 flex items-center justify-center text-orange-600 shadow-inner">
                <FileText className="w-6 h-6" />
              </div>
              <div className="max-w-md">
                <h3 className="font-bold text-stone-900 text-base mb-1">
                  Ready to Turn Meeting Notes into Email
                </h3>
                <p className="text-xs text-stone-500 leading-relaxed">
                  Select one of the 5 acceptance presets above, click <strong className="text-stone-800">"Try a sample"</strong>, or paste your own messy notes on the left. Click{' '}
                  <strong className="text-stone-800">"Generate Action Email"</strong> to produce the exact plain-text email with quality verification.
                </p>
                <div className="mt-3 flex justify-center">
                  <button
                    type="button"
                    onClick={handleLoadSample}
                    className="text-xs px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold flex items-center gap-2 transition-all shadow-xs cursor-pointer active:scale-[0.98]"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                    <span>Try a sample</span>
                  </button>
                </div>
              </div>

              <div className="w-full max-w-md bg-stone-50 rounded-xl p-3.5 border border-stone-200/80 text-left text-xs text-stone-600 space-y-1 font-mono">
                <div className="text-stone-400 text-[10px] uppercase font-bold tracking-wider mb-1">
                  Email Format Output:
                </div>
                <div>Subject: Action items – [Ddd, Mon D]</div>
                <div className="text-stone-500">Hi all, here are [weekday]'s action items...</div>
                <div className="text-orange-700">1. [Owner]: [Task]. Due [Ddd, Mon D]</div>
                <div className="text-stone-500">Open questions / Next meeting</div>
                <div className="text-stone-500">Thanks, [Name]</div>
              </div>
            </div>
          )}

          {/* Loading Skeleton */}
          {loading && (
            <div className="bg-white rounded-2xl border border-stone-200 p-8 shadow-xs flex flex-col gap-4 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="h-5 bg-stone-200 rounded-md w-1/3" />
                <div className="h-8 bg-stone-200 rounded-lg w-24" />
              </div>
              <div className="space-y-3 mt-4">
                <div className="h-4 bg-stone-100 rounded-md w-3/4" />
                <div className="h-4 bg-stone-100 rounded-md w-full" />
                <div className="h-4 bg-stone-100 rounded-md w-5/6" />
                <div className="h-4 bg-stone-100 rounded-md w-2/3" />
                <div className="h-4 bg-stone-100 rounded-md w-4/5" />
              </div>
              <div className="h-24 bg-stone-100 rounded-xl mt-4" />
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white py-3 px-4 sm:px-6 lg:px-8 mt-auto text-xs text-stone-500 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-stone-700">Bowfront Creative</span>
          <span>•</span>
          <span>Internal Agency Tool</span>
          <span>•</span>
          <span>Strict Zero-Hallucination Email Synthesizer</span>
        </div>
        <div className="text-stone-400">
          Powered by Gemini 3.8 Flash • Strictly Client-Side Display (No Gmail/Drive Sync)
        </div>
      </footer>
    </div>
  );
}
