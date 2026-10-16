import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { TranscriptView } from './components/TranscriptView';
import { ExportQueueView } from './components/ExportQueueView';
import { UploadModal } from './components/UploadModal';
import { ClipStudioModal } from './components/ClipStudioModal';
import { ExportModal } from './components/ExportModal';
import { VerticalVideoPlayer } from './components/VerticalVideoPlayer';
import { SAMPLE_VIDEOS } from './data/sampleVideos';
import { VideoProject, ViralClip } from './types';
import { checkServerHealth } from './services/api';

export default function App() {
  const [projects, setProjects] = useState<VideoProject[]>(SAMPLE_VIDEOS);
  const [currentProjectId, setCurrentProjectId] = useState<string>(SAMPLE_VIDEOS[0]?.id || '');
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeStudioClip, setActiveStudioClip] = useState<ViralClip | null>(null);
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [exportModalClip, setExportModalClip] = useState<ViralClip | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [serverStatus, setServerStatus] = useState({ status: 'checking', hasGeminiKey: false });

  // Check backend server health
  useEffect(() => {
    checkServerHealth().then((res) => {
      setServerStatus(res);
    });
  }, []);

  const currentProject = projects.find((p) => p.id === currentProjectId) || projects[0] || null;

  const handleProjectCreated = (newProject: VideoProject) => {
    setProjects([newProject, ...projects]);
    setCurrentProjectId(newProject.id);
    setCurrentTab('dashboard');
  };

  const handleOpenStudio = (clip: ViralClip) => {
    setActiveStudioClip(clip);
    setIsStudioOpen(true);
  };

  const handleQuickExport = (clip: ViralClip) => {
    setExportModalClip(clip);
    setIsExportModalOpen(true);
  };

  const handleUpdateClip = (updatedClip: ViralClip) => {
    if (!currentProject) return;
    const updatedClips = currentProject.clips.map((c) =>
      c.id === updatedClip.id ? updatedClip : c
    );
    const updatedProject = { ...currentProject, clips: updatedClips };
    setProjects(projects.map((p) => (p.id === updatedProject.id ? updatedProject : p)));
    setActiveStudioClip(updatedClip);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-100 font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        projects={projects}
        currentProjectId={currentProjectId}
        onSelectProject={(id) => {
          setCurrentProjectId(id);
          setCurrentTab('dashboard');
        }}
        onOpenUpload={() => setIsUploadOpen(true)}
        mobileOpen={mobileMenuOpen}
        setMobileOpen={setMobileMenuOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        <Header
          currentProject={currentProject}
          onOpenUpload={() => setIsUploadOpen(true)}
          onToggleMobileMenu={() => setMobileMenuOpen(true)}
          serverStatus={serverStatus}
        />

        <main className="flex-1 overflow-y-auto">
          {currentTab === 'dashboard' && (
            <DashboardView
              project={currentProject}
              onOpenStudio={handleOpenStudio}
              onOpenUpload={() => setIsUploadOpen(true)}
              onQuickExport={handleQuickExport}
              exportingClipId={null}
            />
          )}

          {currentTab === 'studio' && (
            <div className="p-4 sm:p-8 max-w-6xl mx-auto">
              {currentProject && currentProject.clips && currentProject.clips.length > 0 ? (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-black text-white">9:16 Vertical Clip Studio</h2>
                      <p className="text-xs text-zinc-400 mt-1">
                        Select a clip to open the full interactive editor with reframing and animated captions:
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {currentProject.clips.map((clip) => (
                      <div
                        key={clip.id}
                        onClick={() => handleOpenStudio(clip)}
                        className="cursor-pointer group p-4 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-violet-500/60 transition-all shadow-lg flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                              🔥 {clip.viralityScore}/100 Virality
                            </span>
                            <span className="text-[11px] font-bold text-zinc-400">
                              {clip.duration}s
                            </span>
                          </div>
                          <h4 className="font-extrabold text-sm text-white group-hover:text-violet-300">
                            {clip.title}
                          </h4>
                          <p className="text-xs text-zinc-400 line-clamp-2">
                            "{clip.hook}"
                          </p>
                        </div>

                        <button className="mt-4 w-full py-2 rounded-xl bg-violet-600/20 group-hover:bg-violet-600 border border-violet-500/30 text-violet-300 group-hover:text-white font-bold text-xs transition-colors text-center">
                          Launch 9:16 Editor & Export
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-20 text-zinc-500">
                  No clips found in current project.
                </div>
              )}
            </div>
          )}

          {currentTab === 'transcript' && (
            <TranscriptView
              project={currentProject}
              onOpenStudio={handleOpenStudio}
            />
          )}

          {currentTab === 'export-queue' && (
            <ExportQueueView
              project={currentProject}
              onOpenStudio={handleOpenStudio}
              onQuickExport={handleQuickExport}
            />
          )}
        </main>
      </div>

      {/* Upload & Import Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onProjectCreated={handleProjectCreated}
      />

      {/* Dedicated 9:16 Clip Studio Modal */}
      {currentProject && (
        <ClipStudioModal
          clip={activeStudioClip}
          project={currentProject}
          isOpen={isStudioOpen}
          onClose={() => setIsStudioOpen(false)}
          onUpdateClip={handleUpdateClip}
        />
      )}

      {/* 1-Click Fast Video Export Modal */}
      <ExportModal
        clip={exportModalClip}
        project={currentProject}
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onOpenStudio={handleOpenStudio}
      />
    </div>
  );
}
