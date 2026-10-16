import React, { useState } from 'react';
import {
  Play,
  Flame,
  Download,
  Sliders,
  FileText,
  Copy,
  Check,
  Share2,
  Sparkles,
  TrendingUp,
  Tag,
} from 'lucide-react';
import { ViralClip, VideoProject, ExportSettings } from '../types';
import { formatSecondsToTime, downloadSubtitles } from '../services/videoExporter';

interface ClipCardProps {
  clip: ViralClip;
  project: VideoProject;
  onOpenStudio: (clip: ViralClip) => void;
  onQuickExport: (clip: ViralClip) => void;
  isExporting?: boolean;
}

export const ClipCard: React.FC<ClipCardProps> = ({
  clip,
  project,
  onOpenStudio,
  onQuickExport,
  isExporting = false,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCaption = () => {
    const text = `${clip.title}\n\n${clip.summary}\n\n${clip.suggestedHashtags.join(' ')}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getScoreColor = (score: number) => {
    if (score >= 95) return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
    if (score >= 90) return 'text-violet-400 bg-violet-400/10 border-violet-400/20';
    return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
  };

  const getEmotionColor = (emotion: string) => {
    switch (emotion) {
      case 'epiphany':
        return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
      case 'shock':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      case 'inspiration':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'humor':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      default:
        return 'bg-sky-500/15 text-sky-300 border-sky-500/30';
    }
  };

  return (
    <div className="group relative rounded-2xl bg-zinc-900/80 border border-zinc-800/90 hover:border-violet-500/50 transition-all duration-300 flex flex-col md:flex-row overflow-hidden shadow-lg shadow-black/40">
      {/* 9:16 Vertical Video Preview Thumbnail */}
      <div className="relative w-full md:w-52 aspect-[9/16] shrink-0 bg-zinc-950 overflow-hidden flex items-center justify-center border-b md:border-b-0 md:border-r border-zinc-800/80">
        {project.thumbnailUrl ? (
          <img
            src={project.thumbnailUrl}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter brightness-90"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center p-4">
            <span className="text-[10px] text-zinc-500 text-center font-medium">
              9:16 Vertical Clip
            </span>
          </div>
        )}

        {/* Viral Hook Header Banner Preview overlay */}
        {clip.suggestedHookHeader && (
          <div className="absolute top-4 inset-x-2 z-10 flex justify-center">
            <span className="px-2.5 py-1 rounded-md bg-red-600/90 text-white font-black text-[9px] uppercase tracking-wider shadow-md text-center line-clamp-1">
              {clip.suggestedHookHeader}
            </span>
          </div>
        )}

        {/* Play Overlay */}
        <button
          onClick={() => onOpenStudio(clip)}
          className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-colors"
          title="Open in 9:16 Studio"
        >
          <div className="w-12 h-12 rounded-full bg-violet-600/90 text-white flex items-center justify-center shadow-lg shadow-violet-600/40 group-hover:scale-110 transition-transform">
            <Play className="w-5 h-5 ml-0.5 fill-white" />
          </div>
        </button>

        {/* Duration Badge */}
        <div className="absolute bottom-3 left-3 z-10 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-sm text-[11px] font-bold text-zinc-200">
          {clip.duration}s ({formatSecondsToTime(clip.startTime)} - {formatSecondsToTime(clip.endTime)})
        </div>

        {/* Reframing Indicator */}
        <div className="absolute bottom-3 right-3 z-10 px-2 py-0.5 rounded-md bg-violet-950/80 border border-violet-500/40 text-[10px] font-bold text-violet-300">
          9:16
        </div>
      </div>

      {/* Clip Details & Viral Insights */}
      <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between">
        <div className="space-y-3">
          {/* Top Badges: Virality Score & Emotion */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getScoreColor(
                clip.viralityScore
              )}`}
            >
              <Flame className="w-3.5 h-3.5 fill-current" />
              <span>{clip.viralityScore}/100 Virality Score</span>
            </span>

            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border capitalize ${getEmotionColor(
                clip.emotionalPeak
              )}`}
            >
              <Sparkles className="w-3 h-3" />
              <span>{clip.emotionalPeak} Peak</span>
            </span>

            <span className="text-[11px] font-semibold text-zinc-400 ml-auto">
              {clip.retentionScore}% Retention Est.
            </span>
          </div>

          {/* Clip Title */}
          <div>
            <h3 className="font-extrabold text-base sm:text-lg text-white group-hover:text-violet-300 transition-colors">
              {clip.title}
            </h3>
            <p className="text-xs sm:text-sm font-medium text-zinc-300 mt-1">
              "{clip.hook}"
            </p>
          </div>

          {/* Why this moment works */}
          <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80 text-xs">
            <span className="font-bold text-violet-400 block mb-0.5">
              💡 Why AI Selected This Moment:
            </span>
            <p className="text-zinc-400 leading-relaxed text-[11px]">
              {clip.reason}
            </p>
          </div>

          {/* Captions Preview Snippet */}
          {clip.captions && clip.captions.length > 0 && (
            <div className="text-xs text-zinc-400">
              <span className="font-semibold text-zinc-300 text-[11px] block mb-1">
                Animated Subtitles Preview:
              </span>
              <p className="italic text-zinc-400 text-[11px] line-clamp-2 bg-zinc-950/40 p-2 rounded-lg border border-zinc-800/50">
                "{clip.captions.map((c) => c.text).join(' ')}"
              </p>
            </div>
          )}

          {/* Hashtags */}
          {clip.suggestedHashtags && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {clip.suggestedHashtags.slice(0, 4).map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md bg-zinc-800/60 text-zinc-400 text-[10px] font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-5 pt-4 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {/* Copy Caption */}
            <button
              onClick={handleCopyCaption}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold transition-colors"
              title="Copy title, summary & hashtags for TikTok / Shorts"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Post Copy'}</span>
            </button>

            {/* Download SRT */}
            <button
              onClick={() => downloadSubtitles(clip, 'srt')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold transition-colors"
              title="Download timed SRT subtitles"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>.SRT</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Open Studio / Editor */}
            <button
              onClick={() => onOpenStudio(clip)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition-all"
            >
              <Sliders className="w-3.5 h-3.5 text-violet-400" />
              <span>Studio & Captions</span>
            </button>

            {/* 1-Click Export Video */}
            <button
              onClick={() => onQuickExport(clip)}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-violet-600/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting ? 'Exporting...' : 'Export 9:16 Clip'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
