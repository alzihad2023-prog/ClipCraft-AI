import React, { useState, useRef } from 'react';
import {
  X,
  Download,
  Sliders,
  Type,
  Crop,
  Layers,
  Sparkles,
  Check,
  Copy,
  FileText,
  Clock,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Flame,
} from 'lucide-react';
import { ViralClip, VideoProject, ExportSettings, ReframingMode, CaptionTheme } from '../types';
import { VerticalVideoPlayer } from './VerticalVideoPlayer';
import { exportClipAsVideo, downloadSubtitles, formatSecondsToTime } from '../services/videoExporter';
import { exportVideoClip, triggerDirectDownload } from '../services/api';

interface ClipStudioModalProps {
  clip: ViralClip | null;
  project: VideoProject;
  isOpen: boolean;
  onClose: () => void;
  onUpdateClip?: (updatedClip: ViralClip) => void;
}

export const ClipStudioModal: React.FC<ClipStudioModalProps> = ({
  clip,
  project,
  isOpen,
  onClose,
  onUpdateClip,
}) => {
  if (!isOpen || !clip) return null;

  const [activeTab, setActiveTab] = useState<'reframing' | 'captions' | 'trim' | 'meta'>('reframing');
  const [currentClip, setCurrentClip] = useState<ViralClip>(clip);
  const [settings, setSettings] = useState<ExportSettings>({
    aspectRatio: '9:16',
    resolution: '1080x1920',
    reframingMode: 'fill',
    captionTheme: 'hormozi',
    captionSize: 34,
    captionPosition: 'bottom',
    hookHeader: clip.suggestedHookHeader || 'WATCH TILL THE END 🤯',
    showHookHeader: true,
    showProgressBar: true,
    cropOffsetX: 0,
    zoomScale: 1.05,
  });

  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatusText, setExportStatusText] = useState('');
  const [exportedFile, setExportedFile] = useState<{ url: string; filename: string } | null>(null);
  const [copiedCaption, setCopiedCaption] = useState(false);

  const videoElementRef = useRef<HTMLVideoElement | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(15);
    setExportStatusText('Processing 9:16 vertical reframe...');

    try {
      // 1. Try high-speed server-side FFmpeg export
      setExportProgress(40);
      setExportStatusText('Encoding 1080p MP4 with styled captions & viral hook...');

      const result = await exportVideoClip({
        videoUrl: project.sourceUrl,
        clip: currentClip,
        settings,
      });

      setExportProgress(100);
      setExportStatusText('Export complete! Starting download...');
      setExportedFile({ url: result.downloadUrl, filename: result.filename });

      // Trigger direct download
      triggerDirectDownload(result.downloadUrl, result.filename);
    } catch (err: any) {
      console.warn('Server export fallback to client-side:', err);

      // 2. Client-side Canvas fallback if server export had issue
      if (videoElementRef.current) {
        try {
          const clientResult = await exportClipAsVideo(
            videoElementRef.current,
            currentClip,
            settings,
            (pct, status) => {
              setExportProgress(pct);
              setExportStatusText(status);
            }
          );
          setExportedFile({ url: clientResult.url, filename: clientResult.filename });
          triggerDirectDownload(clientResult.url, clientResult.filename);
        } catch (clientErr: any) {
          alert(`Export failed: ${clientErr.message || 'Unknown error'}`);
        }
      } else {
        alert(`Export failed: ${err.message || 'Unknown error'}`);
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyPost = () => {
    const text = `${currentClip.title}\n\n${currentClip.summary}\n\n${currentClip.suggestedHashtags.join(' ')}`;
    navigator.clipboard.writeText(text);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2000);
  };

  const updateCaptionText = (index: number, newText: string) => {
    const updated = { ...currentClip };
    updated.captions[index].text = newText;
    setCurrentClip(updated);
    if (onUpdateClip) onUpdateClip(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-5xl h-[95vh] bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Studio Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/80">
          <div className="flex items-center gap-3">
            <div className="px-2.5 py-1 rounded-lg bg-violet-600/20 border border-violet-500/30 text-violet-400 font-black text-xs">
              9:16 STUDIO
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-white truncate max-w-sm sm:max-w-lg">
                {currentClip.title}
              </h3>
              <p className="text-xs text-zinc-400">
                {currentClip.duration}s clip ({formatSecondsToTime(currentClip.startTime)} -{' '}
                {formatSecondsToTime(currentClip.endTime)}) • {currentClip.viralityScore}/100 Virality
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-violet-600/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting ? 'Exporting...' : 'Export 9:16 Video'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Studio Content Area (Player on left, controls on right) */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left Column: Interactive 9:16 Vertical Video Player */}
          <div className="flex-1 bg-zinc-950 p-4 sm:p-6 flex flex-col items-center justify-center overflow-y-auto border-b lg:border-b-0 lg:border-r border-zinc-800">
            <VerticalVideoPlayer
              sourceUrl={project.sourceUrl}
              clip={currentClip}
              settings={settings}
              videoRefOut={videoElementRef}
            />
          </div>

          {/* Right Column: Customization & Fine-Tuning Controls */}
          <div className="w-full lg:w-[420px] bg-zinc-900/90 flex flex-col h-full overflow-hidden">
            {/* Control Tabs */}
            <div className="flex border-b border-zinc-800 bg-zinc-950/40 px-4 pt-2">
              <button
                onClick={() => setActiveTab('reframing')}
                className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-bold border-b-2 transition-all ${
                  activeTab === 'reframing'
                    ? 'border-violet-500 text-violet-400'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Crop className="w-3.5 h-3.5" />
                <span>Reframing</span>
              </button>
              <button
                onClick={() => setActiveTab('captions')}
                className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-bold border-b-2 transition-all ${
                  activeTab === 'captions'
                    ? 'border-violet-500 text-violet-400'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Type className="w-3.5 h-3.5" />
                <span>Captions & Style</span>
              </button>
              <button
                onClick={() => setActiveTab('trim')}
                className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-bold border-b-2 transition-all ${
                  activeTab === 'trim'
                    ? 'border-violet-500 text-violet-400'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Trim Timeline</span>
              </button>
              <button
                onClick={() => setActiveTab('meta')}
                className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-bold border-b-2 transition-all ${
                  activeTab === 'meta'
                    ? 'border-violet-500 text-violet-400'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Virality Copy</span>
              </button>
            </div>

            {/* Tab Panels */}
            <div className="flex-1 p-5 overflow-y-auto space-y-5">
              {activeTab === 'reframing' && (
                <div className="space-y-5">
                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-2">
                      9:16 Vertical Reframing Layout
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'fill', label: 'Smart Fill & Crop', desc: 'Speaker focus' },
                        { id: 'blur-split', label: 'Blur Backdrop', desc: 'Podcast split' },
                        { id: 'letterbox-banner', label: 'Top/Bottom Banners', desc: 'Viral box' },
                      ].map((mode) => (
                        <button
                          key={mode.id}
                          onClick={() =>
                            setSettings({ ...settings, reframingMode: mode.id as ReframingMode })
                          }
                          className={`p-3 rounded-xl border text-left transition-all ${
                            settings.reframingMode === mode.id
                              ? 'bg-violet-600/15 border-violet-500 text-violet-300 shadow-sm'
                              : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                          }`}
                        >
                          <p className="font-bold text-xs">{mode.label}</p>
                          <p className="text-[10px] text-zinc-500 mt-0.5">{mode.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {settings.reframingMode === 'fill' && (
                    <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
                      <div>
                        <div className="flex justify-between text-xs font-semibold text-zinc-300 mb-1.5">
                          <span>Horizontal Pan (Speaker Position)</span>
                          <span className="font-mono text-violet-400">{settings.cropOffsetX}%</span>
                        </div>
                        <input
                          type="range"
                          min="-50"
                          max="50"
                          value={settings.cropOffsetX}
                          onChange={(e) =>
                            setSettings({ ...settings, cropOffsetX: parseInt(e.target.value, 10) })
                          }
                          className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-violet-500"
                        />
                        <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
                          <span>Pan Left</span>
                          <span>Center</span>
                          <span>Pan Right</span>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-semibold text-zinc-300 mb-1.5">
                          <span>Zoom Scale</span>
                          <span className="font-mono text-violet-400">
                            {settings.zoomScale.toFixed(2)}x
                          </span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="2"
                          step="0.05"
                          value={settings.zoomScale}
                          onChange={(e) =>
                            setSettings({ ...settings, zoomScale: parseFloat(e.target.value) })
                          }
                          className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-violet-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* Top Viral Hook Headline */}
                  <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-red-500" />
                        <span>Top Viral Hook Banner</span>
                      </label>
                      <input
                        type="checkbox"
                        checked={settings.showHookHeader}
                        onChange={(e) =>
                          setSettings({ ...settings, showHookHeader: e.target.checked })
                        }
                        className="rounded accent-violet-500 w-4 h-4 cursor-pointer"
                      />
                    </div>
                    {settings.showHookHeader && (
                      <input
                        type="text"
                        value={settings.hookHeader}
                        onChange={(e) => setSettings({ ...settings, hookHeader: e.target.value })}
                        placeholder="e.g. WAIT TILL THE END 🤯"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                      />
                    )}
                  </div>

                  {/* Scrubber progress bar toggle */}
                  <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-zinc-300">TikTok Progress Bar</p>
                      <p className="text-[11px] text-zinc-500">
                        Shows dynamic retention scrubber along bottom
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.showProgressBar}
                      onChange={(e) =>
                        setSettings({ ...settings, showProgressBar: e.target.checked })
                      }
                      className="rounded accent-violet-500 w-4 h-4 cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'captions' && (
                <div className="space-y-5">
                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-2">
                      Animated Caption Style Theme
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {[
                        {
                          id: 'hormozi',
                          label: 'Hormozi Viral',
                          preview: '🟡 Gold Pop & Black Stroke',
                        },
                        {
                          id: 'mrbeast',
                          label: 'MrBeast Punch',
                          preview: '⚡ Punchy Cyan & Bouncy',
                        },
                        {
                          id: 'neon-glow',
                          label: 'Neon Glow',
                          preview: '✨ Glowing Cyber Pink',
                        },
                        {
                          id: 'clean-minimal',
                          label: 'Clean Minimal',
                          preview: '🤍 Crisp Subtitle Badge',
                        },
                      ].map((t) => (
                        <button
                          key={t.id}
                          onClick={() =>
                            setSettings({ ...settings, captionTheme: t.id as CaptionTheme })
                          }
                          className={`p-3 rounded-xl border text-left transition-all ${
                            settings.captionTheme === t.id
                              ? 'bg-violet-600/15 border-violet-500 text-white'
                              : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                          }`}
                        >
                          <p className="font-bold text-xs">{t.label}</p>
                          <p className="text-[10px] text-zinc-500 mt-1">{t.preview}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
                    <div>
                      <div className="flex justify-between text-xs font-semibold text-zinc-300 mb-1.5">
                        <span>Font Size</span>
                        <span className="font-mono text-violet-400">{settings.captionSize}px</span>
                      </div>
                      <input
                        type="range"
                        min="24"
                        max="52"
                        value={settings.captionSize}
                        onChange={(e) =>
                          setSettings({ ...settings, captionSize: parseInt(e.target.value, 10) })
                        }
                        className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-violet-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                        Vertical Position
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {['top', 'middle', 'bottom'].map((pos) => (
                          <button
                            key={pos}
                            onClick={() =>
                              setSettings({ ...settings, captionPosition: pos as any })
                            }
                            className={`py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                              settings.captionPosition === pos
                                ? 'bg-violet-600 text-white'
                                : 'bg-zinc-800 text-zinc-400 hover:text-white'
                            }`}
                          >
                            {pos}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Interactive Subtitle Lines Editor */}
                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-2">
                      Edit Synced Subtitles Text ({currentClip.captions.length} lines)
                    </label>
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {currentClip.captions.map((cap, idx) => (
                        <div key={cap.id} className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                          <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                            <span>
                              {formatSecondsToTime(cap.start)} - {formatSecondsToTime(cap.end)}
                            </span>
                            <span className="text-violet-400 font-semibold">Line {idx + 1}</span>
                          </div>
                          <input
                            type="text"
                            value={cap.text}
                            onChange={(e) => updateCaptionText(idx, e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'trim' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-white">
                      <Clock className="w-4 h-4 text-violet-400" />
                      <span>Clip Duration Constraints (15s to 60s)</span>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-semibold text-zinc-300 mb-1">
                        <span>Start Timestamp</span>
                        <span className="font-mono text-violet-400">
                          {formatSecondsToTime(currentClip.startTime)} ({currentClip.startTime}s)
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max={Math.max(0, currentClip.endTime - 15)}
                        value={currentClip.startTime}
                        onChange={(e) => {
                          const newStart = parseFloat(e.target.value);
                          const updated = {
                            ...currentClip,
                            startTime: newStart,
                            duration: Math.round(currentClip.endTime - newStart),
                          };
                          setCurrentClip(updated);
                          if (onUpdateClip) onUpdateClip(updated);
                        }}
                        className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-violet-500"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-semibold text-zinc-300 mb-1">
                        <span>End Timestamp</span>
                        <span className="font-mono text-violet-400">
                          {formatSecondsToTime(currentClip.endTime)} ({currentClip.endTime}s)
                        </span>
                      </div>
                      <input
                        type="range"
                        min={currentClip.startTime + 15}
                        max={Math.min(project.duration || 600, currentClip.startTime + 60)}
                        value={currentClip.endTime}
                        onChange={(e) => {
                          const newEnd = parseFloat(e.target.value);
                          const updated = {
                            ...currentClip,
                            endTime: newEnd,
                            duration: Math.round(newEnd - currentClip.startTime),
                          };
                          setCurrentClip(updated);
                          if (onUpdateClip) onUpdateClip(updated);
                        }}
                        className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-violet-500"
                      />
                    </div>

                    <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20 text-xs text-violet-300 flex justify-between items-center">
                      <span>Total Clip Length:</span>
                      <span className="font-bold text-sm text-white">
                        {currentClip.duration} Seconds
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'meta' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
                    <h4 className="text-xs font-bold text-zinc-200">Viral Hook Summary</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      {currentClip.summary}
                    </p>

                    <div className="pt-2 border-t border-zinc-800">
                      <span className="text-[11px] font-semibold text-violet-400 block mb-1">
                        Recommended Hashtags for TikTok & Shorts:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {currentClip.suggestedHashtags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 text-[11px]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleCopyPost}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs flex items-center justify-center gap-2"
                    >
                      {copiedCaption ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                      <span>{copiedCaption ? 'Copied to Clipboard!' : 'Copy Post Copy'}</span>
                    </button>
                    <button
                      onClick={() => downloadSubtitles(currentClip, 'srt')}
                      className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Download .SRT</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Export Progress / Status Bar */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-950/80">
              {isExporting ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold text-zinc-300">
                    <span className="truncate">{exportStatusText}</span>
                    <span className="font-bold text-violet-400">{exportProgress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-violet-600 via-indigo-500 to-pink-500 rounded-full transition-all duration-150"
                      style={{ width: `${exportProgress}%` }}
                    />
                  </div>
                </div>
              ) : exportedFile ? (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold truncate">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span className="truncate">Downloaded {exportedFile.filename}</span>
                  </div>
                  <a
                    href={exportedFile.url}
                    download={exportedFile.filename}
                    className="text-violet-400 hover:underline font-bold shrink-0 ml-2"
                  >
                    Save Again
                  </a>
                </div>
              ) : (
                <button
                  onClick={handleExport}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-violet-600/30 flex items-center justify-center gap-2 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Export 9:16 Vertical Video (1080x1920)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
