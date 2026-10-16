import React, { useRef, useEffect, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Flame,
  Sparkles,
} from 'lucide-react';
import { ViralClip, ExportSettings } from '../types';
import { renderFrameToCanvas, formatSecondsToTime } from '../services/videoExporter';

interface VerticalVideoPlayerProps {
  sourceUrl: string;
  clip: ViralClip;
  settings: ExportSettings;
  onTimeUpdate?: (currentTime: number) => void;
  videoRefOut?: React.MutableRefObject<HTMLVideoElement | null>;
}

export const VerticalVideoPlayer: React.FC<VerticalVideoPlayerProps> = ({
  sourceUrl,
  clip,
  settings,
  onTimeUpdate,
  videoRefOut,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hiddenVideoRef = useRef<HTMLVideoElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(clip.startTime);
  const [duration, setDuration] = useState(clip.endTime - clip.startTime);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  // Sync external video ref if provided
  useEffect(() => {
    if (videoRefOut && hiddenVideoRef.current) {
      videoRefOut.current = hiddenVideoRef.current;
    }
  }, [hiddenVideoRef.current, videoRefOut]);

  // When clip changes, update time & seek video
  useEffect(() => {
    setDuration(clip.endTime - clip.startTime);
    setCurrentTime(clip.startTime);
    if (hiddenVideoRef.current) {
      hiddenVideoRef.current.currentTime = clip.startTime;
      if (isPlaying) {
        hiddenVideoRef.current.play().catch(() => {});
      }
    }
  }, [clip.id, clip.startTime, clip.endTime]);

  // Video event handlers
  const handleLoadedData = () => {
    setIsVideoLoaded(true);
    if (hiddenVideoRef.current) {
      hiddenVideoRef.current.currentTime = clip.startTime;
    }
  };

  const togglePlay = () => {
    const video = hiddenVideoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      if (video.currentTime >= clip.endTime || video.currentTime < clip.startTime) {
        video.currentTime = clip.startTime;
      }
      video
        .play()
        .then(() => setIsPlaying(true))
        .catch((e) => console.warn('Play interrupted:', e));
    }
  };

  const handleSeek = (newTime: number) => {
    const video = hiddenVideoRef.current;
    if (!video) return;
    const clamped = Math.max(clip.startTime, Math.min(clip.endTime, newTime));
    video.currentTime = clamped;
    setCurrentTime(clamped);
    if (onTimeUpdate) onTimeUpdate(clamped);
  };

  const handleRestart = () => {
    handleSeek(clip.startTime);
    if (!isPlaying) {
      togglePlay();
    }
  };

  // Canvas animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const video = hiddenVideoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      if (video.readyState >= 2) {
        const cur = video.currentTime;

        // Loop clip within [clip.startTime, clip.endTime]
        if (cur >= clip.endTime) {
          video.currentTime = clip.startTime;
          video.play().catch(() => {});
        } else if (cur < clip.startTime - 0.5) {
          video.currentTime = clip.startTime;
        }

        setCurrentTime(video.currentTime);
        if (onTimeUpdate) onTimeUpdate(video.currentTime);

        renderFrameToCanvas(ctx, video, settings, clip, video.currentTime, 720, 1280);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [settings, clip, isVideoLoaded]);

  const clipProgress =
    duration > 0
      ? Math.max(0, Math.min(100, ((currentTime - clip.startTime) / duration) * 100))
      : 0;

  return (
    <div className="relative flex flex-col items-center select-none">
      {/* Hidden Source Video Element (with crossOrigin for CORS canvas drawing) */}
      <video
        ref={hiddenVideoRef}
        src={sourceUrl}
        crossOrigin="anonymous"
        playsInline
        preload="auto"
        muted={isMuted}
        onLoadedData={handleLoadedData}
        className="hidden"
      />

      {/* 9:16 Vertical Canvas Container */}
      <div className="relative w-[280px] sm:w-[320px] md:w-[340px] aspect-[9/16] rounded-3xl overflow-hidden bg-black shadow-2xl shadow-black/80 border-4 border-zinc-800/90 group">
        <canvas
          ref={canvasRef}
          width={720}
          height={1280}
          onClick={togglePlay}
          className="w-full h-full object-contain cursor-pointer"
        />

        {/* Center Play/Pause Floating Icon on hover or pause */}
        {!isPlaying && (
          <div
            onClick={togglePlay}
            className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer transition-opacity"
          >
            <div className="w-16 h-16 rounded-full bg-violet-600/90 text-white flex items-center justify-center shadow-xl shadow-violet-600/50 hover:scale-110 transition-transform">
              <Play className="w-8 h-8 ml-1 fill-white" />
            </div>
          </div>
        )}

        {/* Active caption theme badge */}
        <div className="absolute top-4 left-4 pointer-events-none">
          <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-bold text-violet-300 border border-violet-500/30 capitalize">
            {settings.captionTheme.replace('-', ' ')}
          </span>
        </div>

        {/* Virality score badge */}
        <div className="absolute top-4 right-4 pointer-events-none">
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 backdrop-blur-md text-[10px] font-bold text-amber-300 border border-amber-500/30">
            <Flame className="w-3 h-3 fill-amber-400" />
            {clip.viralityScore}
          </span>
        </div>
      </div>

      {/* Player Controller Bar */}
      <div className="w-[280px] sm:w-[320px] md:w-[340px] mt-4 p-3 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl space-y-2.5">
        {/* Scrubber slider */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-medium text-zinc-400 w-9">
            {formatSecondsToTime(Math.max(0, currentTime - clip.startTime))}
          </span>
          <input
            type="range"
            min={clip.startTime}
            max={clip.endTime}
            step={0.1}
            value={currentTime}
            onChange={(e) => handleSeek(parseFloat(e.target.value))}
            className="flex-1 h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-violet-500"
          />
          <span className="text-[10px] font-mono font-medium text-zinc-400 w-9 text-right">
            {formatSecondsToTime(duration)}
          </span>
        </div>

        {/* Playback action buttons */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <button
              onClick={handleRestart}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              title="Replay Clip"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={togglePlay}
              className="p-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold shadow-md shadow-violet-600/30 transition-all"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5 fill-white" />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const nextMuted = !isMuted;
                setIsMuted(nextMuted);
                if (hiddenVideoRef.current) {
                  hiddenVideoRef.current.muted = nextMuted;
                }
              }}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                setVolume(v);
                setIsMuted(v === 0);
                if (hiddenVideoRef.current) {
                  hiddenVideoRef.current.volume = v;
                  hiddenVideoRef.current.muted = v === 0;
                }
              }}
              className="w-16 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-violet-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
