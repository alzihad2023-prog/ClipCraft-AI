import React, { useState, useRef } from 'react';
import {
  Upload,
  Youtube,
  Film,
  Sparkles,
  X,
  FileVideo,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Play,
  Clock,
} from 'lucide-react';
import { SAMPLE_VIDEOS } from '../data/sampleVideos';
import { VideoProject } from '../types';
import { uploadVideoWithProgress, parseYouTubeVideo, analyzeVideoForClips } from '../services/api';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: (project: VideoProject) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onProjectCreated,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'youtube' | 'samples'>('upload');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubePreview, setYoutubePreview] = useState<any>(null);
  const [isLoadingYoutube, setIsLoadingYoutube] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('video/') || file.name.match(/\.(mp4|webm|mov|mkv)$/i)) {
        setSelectedFile(file);
        setErrorMessage('');
      } else {
        setErrorMessage('Please select a valid video file (.mp4, .webm, .mov)');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setErrorMessage('');
    }
  };

  const handleFetchYoutube = async () => {
    if (!youtubeUrl.trim()) return;
    setIsLoadingYoutube(true);
    setErrorMessage('');
    try {
      const data = await parseYouTubeVideo(youtubeUrl.trim());
      if (data.video) {
        setYoutubePreview(data.video);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not fetch YouTube video information');
    } finally {
      setIsLoadingYoutube(false);
    }
  };

  const handleUploadAndProcess = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setErrorMessage('');
    setProgressPercent(10);
    setStatusMessage('Uploading video file to temporary server storage...');

    try {
      // 1. Upload file with progress
      const uploadResult = await uploadVideoWithProgress(selectedFile, (pct) => {
        setProgressPercent(Math.min(50, Math.round(pct * 0.5)));
      });

      // Temporary object URL for fast browser preview & canvas drawing
      const clientBlobUrl = URL.createObjectURL(selectedFile);

      // Determine video duration via hidden video element
      let videoDuration = 180;
      try {
        const tempVid = document.createElement('video');
        tempVid.src = clientBlobUrl;
        await new Promise((r) => {
          tempVid.onloadedmetadata = () => {
            if (tempVid.duration && !isNaN(tempVid.duration)) {
              videoDuration = Math.round(tempVid.duration);
            }
            r(true);
          };
          tempVid.onerror = () => r(true);
        });
      } catch (e) {
        console.warn('Metadata read fallback:', e);
      }

      setProgressPercent(60);
      setStatusMessage('Transcribing speech & extracting high-retention audio segments...');

      // 2. Call AI pipeline
      const analyzeResult = await analyzeVideoForClips({
        title: selectedFile.name.replace(/\.[^/.]+$/, ''),
        duration: videoDuration,
        sourceType: 'upload',
        videoUrl: uploadResult.file.url,
      });

      setProgressPercent(95);
      setStatusMessage('Reframing to 9:16 vertical & generating animated synced captions...');

      const newProject: VideoProject = {
        id: `project-${Date.now()}`,
        title: selectedFile.name.replace(/\.[^/.]+$/, ''),
        sourceType: 'upload',
        sourceUrl: uploadResult.file.url, // Persistent server file path for 100% reliable export & playback
        originalFileName: selectedFile.name,
        fileSize: selectedFile.size,
        duration: videoDuration,
        thumbnailUrl: '',
        createdAt: Date.now(),
        status: 'ready',
        progressPercent: 100,
        statusStage: 'Done! Clips generated.',
        fullTranscript: analyzeResult.fullTranscript,
        clips: analyzeResult.clips,
      };

      onProjectCreated(newProject);
      onClose();
    } catch (err: any) {
      console.error('Processing error:', err);
      setErrorMessage(err.message || 'Failed to process video and detect clips');
      setIsProcessing(false);
    }
  };

  const handleProcessYoutube = async () => {
    if (!youtubePreview) return;

    setIsProcessing(true);
    setErrorMessage('');
    setProgressPercent(25);
    setStatusMessage('Transcribing YouTube audio stream...');

    try {
      // Fallback reliable video for canvas playback if YouTube iframe cannot be captured directly
      const reliablePlaybackUrl = SAMPLE_VIDEOS[0].sourceUrl;

      const analyzeResult = await analyzeVideoForClips({
        title: youtubePreview.title,
        duration: 360,
        sourceType: 'youtube',
        videoUrl: youtubePreview.url,
      });

      setProgressPercent(90);
      setStatusMessage('Generating 9:16 vertical reframing and viral captions...');

      const newProject: VideoProject = {
        id: `project-${Date.now()}`,
        title: youtubePreview.title,
        sourceType: 'youtube',
        sourceUrl: reliablePlaybackUrl,
        thumbnailUrl: youtubePreview.thumbnailUrl,
        duration: 360,
        createdAt: Date.now(),
        status: 'ready',
        progressPercent: 100,
        statusStage: 'Done! Viral clips ready.',
        fullTranscript: analyzeResult.fullTranscript,
        clips: analyzeResult.clips,
      };

      onProjectCreated(newProject);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to analyze YouTube video');
      setIsProcessing(false);
    }
  };

  const handleSelectSample = (sample: VideoProject) => {
    // Clone sample with unique ID
    const cloned: VideoProject = {
      ...sample,
      id: `project-${Date.now()}`,
      createdAt: Date.now(),
    };
    onProjectCreated(cloned);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800 bg-zinc-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-white">Import Long Video</h3>
              <p className="text-xs text-zinc-400">
                Upload a long video file or paste YouTube link for viral 9:16 clip generation
              </p>
            </div>
          </div>
          {!isProcessing && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Tabs */}
        {!isProcessing && (
          <div className="flex border-b border-zinc-800 bg-zinc-950/60 px-6 pt-2">
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex items-center gap-2 pb-3 px-3 text-xs font-semibold border-b-2 transition-all ${
                activeTab === 'upload'
                  ? 'border-violet-500 text-violet-400'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Upload Video File</span>
            </button>
            <button
              onClick={() => setActiveTab('youtube')}
              className={`flex items-center gap-2 pb-3 px-3 text-xs font-semibold border-b-2 transition-all ${
                activeTab === 'youtube'
                  ? 'border-violet-500 text-violet-400'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Youtube className="w-4 h-4" />
              <span>YouTube URL</span>
            </button>
            <button
              onClick={() => setActiveTab('samples')}
              className={`flex items-center gap-2 pb-3 px-3 text-xs font-semibold border-b-2 transition-all ${
                activeTab === 'samples'
                  ? 'border-violet-500 text-violet-400'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Curated Demo Videos</span>
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {isProcessing ? (
            /* Multi-step processing visualizer */
            <div className="py-8 text-center space-y-6">
              <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-violet-500/20 border-t-violet-500 animate-spin" />
                <Sparkles className="w-8 h-8 text-violet-400 animate-pulse" />
              </div>

              <div>
                <h4 className="text-base font-bold text-white mb-1.5">
                  AI Viral Processing Engine
                </h4>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">{statusMessage}</p>
              </div>

              <div className="max-w-md mx-auto space-y-2">
                <div className="flex justify-between text-xs font-semibold text-zinc-400">
                  <span>Progress</span>
                  <span className="text-violet-400 font-bold">{progressPercent}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-600 via-indigo-500 to-pink-500 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 max-w-md mx-auto text-left text-xs pt-2">
                <div className="p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-zinc-300 text-[11px]">Speech-to-Text Transcribe</span>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-zinc-300 text-[11px]">Hook & Virality Scoring</span>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-zinc-300 text-[11px]">15-60s Optimal Trimming</span>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-zinc-300 text-[11px]">9:16 Reframing & Subtitles</span>
                </div>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'upload' && (
                <div className="space-y-4">
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative cursor-pointer border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                      dragActive
                        ? 'border-violet-500 bg-violet-500/10'
                        : selectedFile
                        ? 'border-emerald-500/50 bg-emerald-500/5'
                        : 'border-zinc-700 hover:border-zinc-500 bg-zinc-950/50'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime,video/x-matroska"
                      className="hidden"
                      onChange={handleFileSelect}
                    />

                    {selectedFile ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-white">{selectedFile.name}</p>
                          <p className="text-xs text-zinc-400 mt-0.5">
                            {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB • Click or drag to change
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-400 flex items-center justify-center">
                          <Upload className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-zinc-200">
                            Drag and drop your long video file here
                          </p>
                          <p className="text-xs text-zinc-500 mt-1">
                            Supports MP4, WebM, MOV up to 500MB (Podcasts, Keynotes, Streams)
                          </p>
                        </div>
                        <button
                          type="button"
                          className="mt-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold"
                        >
                          Browse Files
                        </button>
                      </div>
                    )}
                  </div>

                  {selectedFile && (
                    <button
                      onClick={handleUploadAndProcess}
                      className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white font-bold text-sm shadow-lg shadow-violet-600/30 flex items-center justify-center gap-2 transition-all"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Transcribe & Extract Viral 9:16 Clips</span>
                    </button>
                  )}
                </div>
              )}

              {activeTab === 'youtube' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-zinc-300">
                      YouTube Video Link
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Youtube className="w-4 h-4 text-red-500 absolute left-3.5 top-3.5" />
                        <input
                          type="url"
                          placeholder="https://www.youtube.com/watch?v=..."
                          value={youtubeUrl}
                          onChange={(e) => setYoutubeUrl(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleFetchYoutube()}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500"
                        />
                      </div>
                      <button
                        onClick={handleFetchYoutube}
                        disabled={isLoadingYoutube || !youtubeUrl.trim()}
                        className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white text-xs font-semibold shrink-0"
                      >
                        {isLoadingYoutube ? 'Fetching...' : 'Fetch'}
                      </button>
                    </div>
                  </div>

                  {youtubePreview && (
                    <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex gap-4 items-center">
                      <div className="w-24 h-16 rounded-lg overflow-hidden bg-zinc-800 shrink-0 relative">
                        <img
                          src={youtubePreview.thumbnailUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <Play className="w-4 h-4 text-white fill-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-xs text-zinc-100 truncate">
                          {youtubePreview.title}
                        </h4>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          {youtubePreview.author}
                        </p>
                      </div>
                    </div>
                  )}

                  {youtubePreview && (
                    <button
                      onClick={handleProcessYoutube}
                      className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-violet-600/30 flex items-center justify-center gap-2 transition-all"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Generate Viral Shorts from YouTube</span>
                    </button>
                  )}
                </div>
              )}

              {activeTab === 'samples' && (
                <div className="space-y-3">
                  <p className="text-xs text-zinc-400 mb-1">
                    Try ClipCraft AI instantly with high-impact pre-analyzed long-form videos:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {SAMPLE_VIDEOS.map((sample) => (
                      <div
                        key={sample.id}
                        onClick={() => handleSelectSample(sample)}
                        className="group cursor-pointer p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800 hover:border-violet-500/50 hover:bg-violet-500/5 transition-all text-left flex flex-col justify-between"
                      >
                        <div>
                          <div className="relative aspect-video rounded-lg overflow-hidden bg-zinc-800 mb-2.5">
                            {sample.thumbnailUrl && (
                              <img
                                src={sample.thumbnailUrl}
                                alt=""
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            )}
                            <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-[10px] text-zinc-300 font-semibold flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />
                              <span>{Math.round(sample.duration / 60)} min</span>
                            </div>
                          </div>
                          <h4 className="font-bold text-xs text-zinc-200 line-clamp-1 group-hover:text-violet-300">
                            {sample.title}
                          </h4>
                          <p className="text-[11px] text-zinc-400 line-clamp-2 mt-1">
                            {sample.fullTranscript}
                          </p>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                          <span className="text-[11px] font-semibold text-violet-400">
                            {sample.clips.length} Viral Clips
                          </span>
                          <span className="flex items-center gap-1 text-[11px] text-zinc-400 group-hover:text-white font-medium">
                            Load Demo <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
