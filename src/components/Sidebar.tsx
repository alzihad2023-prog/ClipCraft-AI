import React from 'react';
import {
  Sparkles,
  LayoutDashboard,
  PlusCircle,
  Video,
  Download,
  Flame,
  FileText,
  Layers,
  ChevronRight,
  X,
} from 'lucide-react';
import { VideoProject } from '../types';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  projects: VideoProject[];
  currentProjectId: string | null;
  onSelectProject: (id: string) => void;
  onOpenUpload: () => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  projects,
  currentProjectId,
  onSelectProject,
  onOpenUpload,
  mobileOpen,
  setMobileOpen,
}) => {
  const currentProject = projects.find((p) => p.id === currentProjectId);
  const totalClips = projects.reduce((acc, p) => acc + (p.clips?.length || 0), 0);

  const navItems = [
    {
      id: 'dashboard',
      label: 'Clips Dashboard',
      icon: LayoutDashboard,
      badge: currentProject?.clips?.length ? `${currentProject.clips.length} clips` : undefined,
    },
    {
      id: 'studio',
      label: '9:16 Clip Studio',
      icon: Video,
      badge: 'Interactive',
    },
    {
      id: 'transcript',
      label: 'Full Transcript',
      icon: FileText,
    },
    {
      id: 'export-queue',
      label: 'Export & Downloads',
      icon: Download,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 flex-col justify-between border-r border-zinc-800/80 bg-zinc-950/95 backdrop-blur-md transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0 flex' : '-translate-x-full lg:flex'
        }`}
      >
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Logo & Close button */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800/60">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-pink-500 shadow-lg shadow-violet-500/20">
                <Sparkles className="w-5 h-5 text-white" />
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-pink-500"></span>
                </span>
              </div>
              <div>
                <h1 className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                  ClipCraft <span className="text-violet-400 font-black">AI</span>
                </h1>
                <p className="text-[11px] font-medium text-zinc-400">Viral 9:16 Video Engine</p>
              </div>
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Action Button */}
          <div className="p-4">
            <button
              onClick={() => {
                onOpenUpload();
                setMobileOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-md shadow-violet-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Import New Video</span>
            </button>
          </div>

          {/* Navigation Links */}
          <div className="px-3 py-2 space-y-1">
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Workspace
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentTab(item.id);
                    setMobileOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? 'bg-violet-600/15 text-violet-300 border border-violet-500/30'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${active ? 'text-violet-400' : 'text-zinc-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                        active
                          ? 'bg-violet-500/20 text-violet-300'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Projects List */}
          <div className="px-3 pt-6 pb-2">
            <div className="px-3 pb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              <span>Recent Projects ({projects.length})</span>
              <Layers className="w-3.5 h-3.5 text-zinc-600" />
            </div>
            <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
              {projects.map((proj) => {
                const isSelected = proj.id === currentProjectId;
                return (
                  <button
                    key={proj.id}
                    onClick={() => {
                      onSelectProject(proj.id);
                      setMobileOpen(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-start gap-2.5 ${
                      isSelected
                        ? 'bg-zinc-800/90 text-white border border-zinc-700/60'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg overflow-hidden bg-zinc-800 shrink-0 mt-0.5 relative">
                      {proj.thumbnailUrl ? (
                        <img
                          src={proj.thumbnailUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-500">
                          <Video className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-zinc-200">{proj.title}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-zinc-400">
                        <span className="capitalize">{proj.sourceType}</span>
                        <span>•</span>
                        <span className="text-violet-400 font-semibold">
                          {proj.clips?.length || 0} clips
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Retention & Engine Status Box */}
          <div className="p-4 mt-auto">
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-zinc-900/90 to-zinc-900/40 border border-zinc-800/80">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300 mb-1">
                <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
                <span>AI Hook Detection Active</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Gemini 3.8 Flash automatically scans speech cadence, emotional inflection, and viral hooks for 9:16 reframing.
              </p>
              <div className="mt-3 pt-2.5 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-400">
                <span>Total Generated</span>
                <span className="font-bold text-white bg-zinc-800 px-2 py-0.5 rounded-md">
                  {totalClips} Clips
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
