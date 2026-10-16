import React, { useState } from 'react';
import { FileText, Copy, Check, Search, Sparkles, Clock, ArrowRight } from 'lucide-react';
import { VideoProject, ViralClip } from '../types';
import { formatSecondsToTime } from '../services/videoExporter';

interface TranscriptViewProps {
  project: VideoProject | null;
  onOpenStudio: (clip: ViralClip) => void;
}

export const TranscriptView: React.FC<TranscriptViewProps> = ({
  project,
  onOpenStudio,
}) => {
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  if (!project) {
    return (
      <div className="p-8 text-center text-zinc-500">
        No project loaded. Import a video first.
      </div>
    );
  }

  const transcript = project.fullTranscript || 'Transcript is being processed...';
  const clips = project.clips || [];

  const handleCopy = () => {
    navigator.clipboard.writeText(transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-violet-400" />
            <span>AI Speech-to-Text Transcript</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Full spoken audio transcript automatically synchronized with 9:16 viral clip timestamps.
          </p>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold self-start sm:self-auto transition-colors"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'Copied Transcript!' : 'Copy Full Transcript'}</span>
        </button>
      </div>

      {/* Detected Viral Moments quick jump bar */}
      <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-violet-300">
          <Sparkles className="w-4 h-4 text-violet-400" />
          <span>High-Retention Segments Extracted from this Transcript:</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {clips.map((clip) => (
            <button
              key={clip.id}
              onClick={() => onOpenStudio(clip)}
              className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 hover:border-violet-500/50 hover:bg-violet-500/5 transition-all text-left flex items-start justify-between group"
            >
              <div>
                <span className="text-[10px] font-mono font-semibold text-violet-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatSecondsToTime(clip.startTime)} - {formatSecondsToTime(clip.endTime)}
                </span>
                <p className="font-bold text-xs text-zinc-200 mt-1 line-clamp-1 group-hover:text-violet-300">
                  {clip.title}
                </p>
                <p className="text-[11px] text-zinc-500 line-clamp-1 mt-0.5">
                  Virality {clip.viralityScore}/100 • {clip.duration}s
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-white shrink-0 mt-1 ml-2 transition-transform group-hover:translate-x-0.5" />
            </button>
          ))}
        </div>
      </div>

      {/* Transcript Text Content */}
      <div className="p-6 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-xl space-y-4">
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search transcript phrases..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500"
          />
        </div>

        <div className="pt-2 text-sm text-zinc-300 leading-relaxed space-y-4 font-normal font-sans">
          {transcript.split('\n').map((paragraph, idx) => {
            if (!paragraph.trim()) return null;
            return (
              <p
                key={idx}
                className="p-3 rounded-xl hover:bg-zinc-950/60 transition-colors border border-transparent hover:border-zinc-800/60"
              >
                {paragraph}
              </p>
            );
          })}
        </div>
      </div>
    </div>
  );
};
