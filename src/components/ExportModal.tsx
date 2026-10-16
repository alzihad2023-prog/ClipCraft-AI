import React, { useState, useEffect } from 'react';
import { Download, CheckCircle2, AlertCircle, X, Sparkles, Sliders, FileText } from 'lucide-react';
import { ViralClip, VideoProject, ExportSettings } from '../types';
import { exportVideoClip, triggerDirectDownload } from '../services/api';
import { downloadSubtitles } from '../services/videoExporter';

interface ExportModalProps {
  clip: ViralClip | null;
  project: VideoProject | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenStudio?: (clip: ViralClip) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  clip,
  project,
  isOpen,
  onClose,
  onOpenStudio,
}) => {
  const [status, setStatus] = useState<'idle' | 'exporting' | 'completed' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [downloadFilename, setDownloadFilename] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen && clip && project) {
      startExport();
    } else {
      setStatus('idle');
      setProgress(0);
      setDownloadUrl('');
      setErrorMessage('');
    }
  }, [isOpen, clip?.id]);

  const startExport = async () => {
    if (!clip || !project) return;

    setStatus('exporting');
    setProgress(15);
    setStatusText('Preparing 9:16 vertical reframe...');
    setErrorMessage('');

    const defaultSettings: ExportSettings = {
      aspectRatio: '9:16',
      resolution: '1080x1920',
      reframingMode: 'fill',
      captionTheme: 'hormozi',
      captionSize: 32,
      captionPosition: 'bottom',
      hookHeader: clip.suggestedHookHeader || 'WATCH TILL THE END 🤯',
      showHookHeader: true,
      showProgressBar: true,
      cropOffsetX: 0,
      zoomScale: 1.05,
    };

    try {
      // Step 2 progress
      setTimeout(() => {
        setProgress(45);
        setStatusText('Aligning synchronized animated captions & viral hook banner...');
      }, 500);

      setTimeout(() => {
        setProgress(75);
        setStatusText('Encoding high-resolution MP4 video (H.264 + AAC)...');
      }, 1200);

      const result = await exportVideoClip({
        videoUrl: project.sourceUrl,
        clip,
        settings: defaultSettings,
      });

      setProgress(100);
      setStatusText('Download ready!');
      setStatus('completed');
      setDownloadUrl(result.downloadUrl);
      setDownloadFilename(result.filename);

      // Trigger instant direct download
      triggerDirectDownload(result.downloadUrl, result.filename);
    } catch (err: any) {
      console.error('Export error:', err);
      setStatus('error');
      setErrorMessage(err.message || 'Failed to export video clip. Please try opening in Studio.');
    }
  };

  if (!isOpen || !clip) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl p-6 overflow-hidden space-y-5">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-pink-500 text-white flex items-center justify-center shadow-lg shadow-violet-600/30">
            <Download className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-white">9:16 Video Exporter</h3>
            <p className="text-xs text-zinc-400 truncate max-w-[240px]">{clip.title}</p>
          </div>
        </div>

        {/* Content depending on status */}
        {status === 'exporting' && (
          <div className="py-6 text-center space-y-4">
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-violet-500/20 border-t-violet-500 animate-spin" />
              <Sparkles className="w-6 h-6 text-violet-400 animate-pulse" />
            </div>

            <div>
              <p className="font-bold text-sm text-white mb-1">{statusText}</p>
              <p className="text-xs text-zinc-400">{clip.duration}s vertical clip • 1080x1920 HD</p>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-zinc-400 font-semibold">
                <span>Rendering Progress</span>
                <span className="text-violet-400 font-bold">{progress}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-600 via-indigo-500 to-pink-500 transition-all duration-300 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {status === 'completed' && (
          <div className="py-4 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h4 className="font-extrabold text-base text-white">Video Download Started!</h4>
              <p className="text-xs text-zinc-400 mt-1">
                Your high-definition 9:16 vertical clip has been generated and saved to your device.
              </p>
            </div>

            {/* Direct manual download button if browser blocked auto-download */}
            <div className="pt-2">
              <a
                href={downloadUrl}
                download={downloadFilename}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-violet-600/30 flex items-center justify-center gap-2 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download MP4 File Again</span>
              </a>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => downloadSubtitles(clip, 'srt')}
                className="flex-1 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Save .SRT Subtitles</span>
              </button>
              {onOpenStudio && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenStudio(clip);
                  }}
                  className="flex-1 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <Sliders className="w-3.5 h-3.5 text-violet-400" />
                  <span>Customize in Studio</span>
                </button>
              )}
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="py-4 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div>
              <h4 className="font-bold text-sm text-white">Export Notice</h4>
              <p className="text-xs text-red-400 mt-1">{errorMessage}</p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={startExport}
                className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold"
              >
                Retry Download
              </button>
              {onOpenStudio && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenStudio(clip);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold"
                >
                  Open in Studio
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
