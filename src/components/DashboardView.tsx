import React, { useState } from 'react';
import {
  Flame,
  Sparkles,
  TrendingUp,
  Download,
  Filter,
  Layers,
  Clock,
  Video,
  Upload,
  CheckCircle2,
} from 'lucide-react';
import { VideoProject, ViralClip } from '../types';
import { ClipCard } from './ClipCard';
import { formatSecondsToTime } from '../services/videoExporter';

interface DashboardViewProps {
  project: VideoProject | null;
  onOpenStudio: (clip: ViralClip) => void;
  onOpenUpload: () => void;
  onQuickExport: (clip: ViralClip) => void;
  exportingClipId: string | null;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  project,
  onOpenStudio,
  onOpenUpload,
  onQuickExport,
  exportingClipId,
}) => {
  const [filterScore, setFilterScore] = useState<'all' | '95' | '90'>('all');
  const [selectedEmotion, setSelectedEmotion] = useState<string>('all');

  if (!project) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center py-20 space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-violet-600/10 border border-violet-500/20 text-violet-400 flex items-center justify-center mx-auto">
          <Video className="w-10 h-10" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-white">No Video Imported Yet</h2>
          <p className="text-zinc-400 text-sm max-w-md mx-auto mt-2">
            Upload a long video file or paste a YouTube URL to automatically detect viral 9:16 clips with animated captions.
          </p>
        </div>
        <button
          onClick={onOpenUpload}
          className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm shadow-lg shadow-violet-600/30 transition-all hover:scale-105"
        >
          Import Long Video Now
        </button>
      </div>
    );
  }

  const clips = project.clips || [];

  // Filter clips
  const filteredClips = clips.filter((c) => {
    if (filterScore === '95' && c.viralityScore < 95) return false;
    if (filterScore === '90' && c.viralityScore < 90) return false;
    if (selectedEmotion !== 'all' && c.emotionalPeak !== selectedEmotion) return false;
    return true;
  });

  const maxScore = clips.length > 0 ? Math.max(...clips.map((c) => c.viralityScore)) : 0;
  const avgRetention =
    clips.length > 0
      ? Math.round(clips.reduce((acc, c) => acc + c.retentionScore, 0) / clips.length)
      : 0;
  const totalClipSeconds = clips.reduce((acc, c) => acc + c.duration, 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Project Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-violet-950/40 via-zinc-900 to-zinc-900 border border-zinc-800/80 p-6 sm:p-8 overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 text-[11px] font-bold uppercase tracking-wider">
                Long-to-Shorts Engine
              </span>
              <span className="text-zinc-500 text-xs">•</span>
              <span className="text-xs text-zinc-400">
                Source: {project.sourceType === 'upload' ? project.originalFileName : project.sourceType}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              {project.title}
            </h1>

            <p className="text-xs sm:text-sm text-zinc-400 line-clamp-2">
              Speech transcribed and analyzed by Gemini 3.8 Flash. Detected {clips.length} high-retention moments reframed into 9:16 vertical clips.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => clips[0] && onOpenStudio(clips[0])}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-violet-600/25 transition-all hover:scale-105 active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>Open in 9:16 Studio</span>
            </button>
          </div>
        </div>

        {/* 4 Performance Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-zinc-800/80">
          <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80">
            <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
              <span>Viral Clips</span>
              <Layers className="w-4 h-4 text-violet-400" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-white">{clips.length}</p>
            <p className="text-[11px] text-zinc-500 mt-0.5">15-60s length</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80">
            <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
              <span>Top Virality Score</span>
              <Flame className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-amber-400">{maxScore}/100</p>
            <p className="text-[11px] text-zinc-500 mt-0.5">Viral Gold rated</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80">
            <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
              <span>Avg Retention</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-emerald-400">{avgRetention}%</p>
            <p className="text-[11px] text-zinc-500 mt-0.5">Estimated viewer stay</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80">
            <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
              <span>Extracted Runtime</span>
              <Clock className="w-4 h-4 text-sky-400" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-sky-400">
              {formatSecondsToTime(totalClipSeconds)}
            </p>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              from {formatSecondsToTime(project.duration)} total
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>Suggested High-Retention Clips</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
              {filteredClips.length}
            </span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Click any clip to preview with animated synced captions or export in 9:16 format.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
            <button
              onClick={() => setFilterScore('all')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                filterScore === 'all'
                  ? 'bg-violet-600 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              All Scores
            </button>
            <button
              onClick={() => setFilterScore('90')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                filterScore === '90'
                  ? 'bg-violet-600 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              90+ Virality
            </button>
            <button
              onClick={() => setFilterScore('95')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                filterScore === '95'
                  ? 'bg-violet-600 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              🔥 95+ Gold
            </button>
          </div>
        </div>
      </div>

      {/* List of Generated Clips */}
      <div className="space-y-4">
        {filteredClips.map((clip) => (
          <ClipCard
            key={clip.id}
            clip={clip}
            project={project}
            onOpenStudio={onOpenStudio}
            onQuickExport={onQuickExport}
            isExporting={exportingClipId === clip.id}
          />
        ))}

        {filteredClips.length === 0 && (
          <div className="p-8 text-center rounded-2xl bg-zinc-900/40 border border-zinc-800/80">
            <p className="text-sm font-semibold text-zinc-400">
              No clips match the selected score filter.
            </p>
            <button
              onClick={() => setFilterScore('all')}
              className="mt-2 text-xs text-violet-400 hover:underline font-bold"
            >
              Reset filter
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
