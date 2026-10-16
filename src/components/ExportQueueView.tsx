import React from 'react';
import { Download, FileText, CheckCircle2, Film, Sparkles, ExternalLink, Share2 } from 'lucide-react';
import { VideoProject, ViralClip } from '../types';
import { downloadSubtitles, formatSecondsToTime } from '../services/videoExporter';

interface ExportQueueViewProps {
  project: VideoProject | null;
  onOpenStudio: (clip: ViralClip) => void;
  onQuickExport: (clip: ViralClip) => void;
}

export const ExportQueueView: React.FC<ExportQueueViewProps> = ({
  project,
  onOpenStudio,
  onQuickExport,
}) => {
  if (!project) {
    return (
      <div className="p-8 text-center text-zinc-500">
        No project loaded. Import a video first.
      </div>
    );
  }

  const clips = project.clips || [];

  const handleDownloadAllSrt = () => {
    clips.forEach((clip, index) => {
      setTimeout(() => {
        downloadSubtitles(clip, 'srt');
      }, index * 300);
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Download className="w-5 h-5 text-violet-400" />
            <span>Exports & Downloads Center</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Download vertical 9:16 video clips with burned-in animated captions, or export timed subtitle files.
          </p>
        </div>

        <button
          onClick={handleDownloadAllSrt}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs transition-colors self-start sm:self-auto"
        >
          <FileText className="w-4 h-4 text-violet-400" />
          <span>Export All Subtitles (.SRT Batch)</span>
        </button>
      </div>

      {/* Clip export table */}
      <div className="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
          <span className="font-bold text-xs uppercase tracking-wider text-zinc-400">
            Available 9:16 Clips ({clips.length})
          </span>
          <span className="text-[11px] text-zinc-500 font-medium">
            Resolution: 1080x1920 HD Vertical
          </span>
        </div>

        <div className="divide-y divide-zinc-800/80">
          {clips.map((clip, index) => (
            <div
              key={clip.id}
              className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-800/30 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-violet-600/10 border border-violet-500/20 text-violet-400 flex items-center justify-center font-black text-sm shrink-0">
                  #{index + 1}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">{clip.title}</h4>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-zinc-400">
                    <span className="text-amber-400 font-semibold">{clip.viralityScore}/100 Virality</span>
                    <span>•</span>
                    <span>{clip.duration} seconds</span>
                    <span>•</span>
                    <span>
                      {formatSecondsToTime(clip.startTime)} - {formatSecondsToTime(clip.endTime)}
                    </span>
                    <span>•</span>
                    <span className="capitalize text-zinc-300">{clip.emotionalPeak}</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1 line-clamp-1 italic">
                    "{clip.hook}"
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => downloadSubtitles(clip, 'srt')}
                  className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  title="Download SRT Subtitle file"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>.SRT</span>
                </button>

                <button
                  onClick={() => onOpenStudio(clip)}
                  className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition-colors"
                >
                  Edit in Studio
                </button>

                <button
                  onClick={() => onQuickExport(clip)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-md shadow-violet-600/30 transition-all hover:scale-105 active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export 9:16 Video</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Creator Posting Guide Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-violet-950/30 via-zinc-900 to-zinc-900 border border-zinc-800 space-y-3">
        <h3 className="font-bold text-sm text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-violet-400" />
          <span>Short-Form Posting Strategy Tips</span>
        </h3>
        <p className="text-xs text-zinc-400 leading-relaxed">
          For maximum algorithm distribution on TikTok, YouTube Shorts, and Instagram Reels:
        </p>
        <ul className="text-xs text-zinc-400 space-y-1.5 list-disc pl-5">
          <li>
            <strong className="text-zinc-200">First 3 Seconds:</strong> Keep the top hook banner visible so scrollers read the tension immediately before audio kicks in.
          </li>
          <li>
            <strong className="text-zinc-200">Hormozi/MrBeast Subtitles:</strong> Dynamic animated text with keyword color pops boosts watch-through retention by up to 48%.
          </li>
          <li>
            <strong className="text-zinc-200">Optimal Duration:</strong> Videos between 20s and 45s have the highest probability of 100%+ completion rate loops.
          </li>
        </ul>
      </div>
    </div>
  );
};
