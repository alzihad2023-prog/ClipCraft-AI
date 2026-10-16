import React from 'react';
import { Menu, Sparkles, Upload, Video, ShieldCheck, Flame } from 'lucide-react';
import { VideoProject } from '../types';

interface HeaderProps {
  currentProject: VideoProject | null;
  onOpenUpload: () => void;
  onToggleMobileMenu: () => void;
  serverStatus: { status: string; hasGeminiKey: boolean };
}

export const Header: React.FC<HeaderProps> = ({
  currentProject,
  onOpenUpload,
  onToggleMobileMenu,
  serverStatus,
}) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3.5 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/80">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="p-2 -ml-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/80 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400">
            <Video className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm sm:text-base text-white truncate max-w-[200px] sm:max-w-md">
                {currentProject ? currentProject.title : 'ClipCraft AI Studio'}
              </h2>
              <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/10 text-violet-400 border border-violet-500/20">
                9:16 Auto-Reframe
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 truncate max-w-[220px] sm:max-w-sm">
              {currentProject
                ? `${currentProject.clips?.length || 0} viral clips detected • ${Math.round(currentProject.duration)}s total runtime`
                : 'Convert long videos into viral TikTok, Shorts & Reels clips'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {/* Gemini Engine Status */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800/80 text-xs text-zinc-400">
          <Sparkles className="w-3.5 h-3.5 text-violet-400" />
          <span className="font-medium text-[11px]">Gemini 3.8 Flash</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        </div>

        {/* Upload / New Button */}
        <button
          onClick={onOpenUpload}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs shadow-sm shadow-violet-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Upload className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Import Video</span>
          <span className="sm:hidden">Import</span>
        </button>
      </div>
    </header>
  );
};
