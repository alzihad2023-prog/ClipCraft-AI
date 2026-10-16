import { ViralClip, ExportSettings, CaptionSegment } from '../types';

export function formatSecondsToTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export function formatDurationToSrtTime(totalSeconds: number): string {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = Math.floor(totalSeconds % 60);
  const ms = Math.floor((totalSeconds % 1) * 1000);
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
}

export function generateSrtContent(clip: ViralClip): string {
  let srt = '';
  clip.captions.forEach((seg, idx) => {
    // Relative times within the clip
    const relStart = Math.max(0, seg.start - clip.startTime);
    const relEnd = Math.max(relStart + 0.5, seg.end - clip.startTime);
    srt += `${idx + 1}\n`;
    srt += `${formatDurationToSrtTime(relStart)} --> ${formatDurationToSrtTime(relEnd)}\n`;
    srt += `${seg.text}\n\n`;
  });
  return srt;
}

export function downloadSubtitles(clip: ViralClip, format: 'srt' | 'vtt' = 'srt') {
  const content = generateSrtContent(clip);
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${clip.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_captions.${format}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Renders a single frame to the canvas in 9:16 vertical format
export function renderFrameToCanvas(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  settings: ExportSettings,
  clip: ViralClip,
  currentTime: number,
  canvasWidth: number = 720,
  canvasHeight: number = 1280
) {
  ctx.save();
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  // Background
  ctx.fillStyle = '#09090b';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  const videoW = video.videoWidth || 1920;
  const videoH = video.videoHeight || 1080;
  const videoAspect = videoW / videoH;
  const targetAspect = 9 / 16; // 0.5625

  if (settings.reframingMode === 'blur-split') {
    // 1. Draw blurred stretched video in background
    ctx.save();
    ctx.filter = 'blur(28px) brightness(0.4)';
    const bgScale = Math.max(canvasWidth / videoW, canvasHeight / videoH) * 1.2;
    const bgW = videoW * bgScale;
    const bgH = videoH * bgScale;
    ctx.drawImage(video, (canvasWidth - bgW) / 2, (canvasHeight - bgH) / 2, bgW, bgH);
    ctx.restore();

    // 2. Draw centered clear letterboxed video
    const fitScale = canvasWidth / videoW;
    const fitH = videoH * fitScale;
    const fitY = (canvasHeight - fitH) / 2;

    // Drop shadow around middle video
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 30;
    ctx.drawImage(video, 0, fitY, canvasWidth, fitH);
    ctx.shadowBlur = 0;
  } else if (settings.reframingMode === 'letterbox-banner') {
    // Letterbox with top and bottom header bands
    const fitScale = canvasWidth / videoW;
    const fitH = videoH * fitScale;
    const fitY = (canvasHeight - fitH) / 2;

    // Top banner backdrop
    const gradTop = ctx.createLinearGradient(0, 0, 0, fitY);
    gradTop.addColorStop(0, 'rgba(15, 23, 42, 0.95)');
    gradTop.addColorStop(1, 'rgba(9, 9, 11, 0.9)');
    ctx.fillStyle = gradTop;
    ctx.fillRect(0, 0, canvasWidth, fitY);

    // Draw main video
    ctx.drawImage(video, 0, fitY, canvasWidth, fitH);

    // Bottom banner backdrop
    const gradBottom = ctx.createLinearGradient(0, fitY + fitH, 0, canvasHeight);
    gradBottom.addColorStop(0, 'rgba(9, 9, 11, 0.9)');
    gradBottom.addColorStop(1, 'rgba(15, 23, 42, 0.98)');
    ctx.fillStyle = gradBottom;
    ctx.fillRect(0, fitY + fitH, canvasWidth, canvasHeight - (fitY + fitH));
  } else {
    // Default: 'fill' (Smart 9:16 Crop & Zoom)
    const scale = Math.max(canvasWidth / videoW, canvasHeight / videoH) * (settings.zoomScale || 1.0);
    const scaledW = videoW * scale;
    const scaledH = videoH * scale;

    // Apply horizontal pan offset (-50% to +50%)
    const maxShiftX = (scaledW - canvasWidth) / 2;
    const shiftX = (settings.cropOffsetX / 100) * maxShiftX;
    const drawX = (canvasWidth - scaledW) / 2 + shiftX;
    const drawY = (canvasHeight - scaledH) / 2;

    ctx.drawImage(video, drawX, drawY, scaledW, scaledH);
  }

  // Draw Top Hook Banner (if enabled)
  if (settings.showHookHeader && settings.hookHeader) {
    const bannerY = Math.round(canvasHeight * 0.12);
    ctx.save();
    ctx.font = '800 28px "Plus Jakarta Sans", "Montserrat", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const text = settings.hookHeader.toUpperCase();
    const textMetrics = ctx.measureText(text);
    const paddingX = 28;
    const paddingY = 16;
    const badgeW = Math.min(canvasWidth * 0.9, textMetrics.width + paddingX * 2);
    const badgeH = 54;
    const badgeX = (canvasWidth - badgeW) / 2;

    // Badge background with modern red/amber or black pill
    ctx.fillStyle = 'rgba(239, 68, 68, 0.92)'; // High retention viral red
    ctx.beginPath();
    ctx.roundRect(badgeX, bannerY - badgeH / 2, badgeW, badgeH, 14);
    ctx.fill();

    // White text with shadow
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 6;
    ctx.fillText(text, canvasWidth / 2, bannerY);
    ctx.restore();
  }

  // Draw Animated Synced Captions
  renderCaptions(ctx, clip.captions, currentTime, settings, canvasWidth, canvasHeight);

  // Draw Bottom Scrubber Progress Bar (if enabled)
  if (settings.showProgressBar) {
    const clipDur = clip.endTime - clip.startTime;
    const elapsed = Math.max(0, Math.min(clipDur, currentTime - clip.startTime));
    const progress = clipDur > 0 ? elapsed / clipDur : 0;

    const barH = 7;
    const barY = canvasHeight - barH - 8;

    // Track background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(20, barY, canvasWidth - 40, barH);

    // Active progress fill (vibrant gradient)
    const fillW = (canvasWidth - 40) * progress;
    const grad = ctx.createLinearGradient(20, 0, canvasWidth - 20, 0);
    grad.addColorStop(0, '#EC4899');
    grad.addColorStop(1, '#8B5CF6');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(20, barY, fillW, barH, 4);
    ctx.fill();
  }

  // Watermark brand pill in top-right
  ctx.save();
  ctx.font = '700 13px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.textAlign = 'right';
  ctx.fillText('ClipCraft AI', canvasWidth - 24, 38);
  ctx.restore();

  ctx.restore();
}

// Render dynamic animated subtitles based on timestamp
function renderCaptions(
  ctx: CanvasRenderingContext2D,
  captions: CaptionSegment[],
  currentTime: number,
  settings: ExportSettings,
  canvasWidth: number,
  canvasHeight: number
) {
  if (!captions || captions.length === 0) return;

  // Find currently active caption segment
  const activeSegment = captions.find(
    (c) => currentTime >= c.start && currentTime <= c.end
  );

  if (!activeSegment) return;

  const captionY =
    settings.captionPosition === 'top'
      ? canvasHeight * 0.25
      : settings.captionPosition === 'middle'
      ? canvasHeight * 0.52
      : canvasHeight * 0.74;

  const theme = settings.captionTheme;
  const baseFontSize = settings.captionSize || 36;

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Check if we have word-level timestamps
  if (activeSegment.words && activeSegment.words.length > 0) {
    // Word-by-word dynamic karaoke animation
    ctx.font = `900 ${baseFontSize}px "Plus Jakarta Sans", "Montserrat", sans-serif`;

    const words = activeSegment.words;
    // Calculate total width of the sentence to center it
    const spaceWidth = ctx.measureText(' ').width;
    const wordWidths = words.map((w) => ctx.measureText(w.word).width);
    const totalSentenceWidth =
      wordWidths.reduce((a, b) => a + b, 0) + (words.length - 1) * spaceWidth;

    let startX = (canvasWidth - Math.min(canvasWidth * 0.9, totalSentenceWidth)) / 2;

    // Draw dark protective glow behind words for contrast
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.roundRect(
      startX - 18,
      captionY - baseFontSize * 0.9,
      Math.min(canvasWidth * 0.92, totalSentenceWidth + 36),
      baseFontSize * 1.8,
      16
    );
    ctx.fill();

    let curX = startX;

    words.forEach((w, idx) => {
      const isWordActive = currentTime >= w.start && currentTime <= w.end;
      const isEmphasis = activeSegment.emphasis?.some((emp) =>
        emp.toLowerCase().includes(w.word.toLowerCase().replace(/[^a-z0-9]/gi, ''))
      );

      ctx.save();

      // Theme-specific styles
      if (theme === 'hormozi') {
        // Hormozi Style: Ultra bold, high-contrast, yellow/green active pops
        ctx.font = `900 ${isWordActive ? baseFontSize * 1.15 : baseFontSize}px "Plus Jakarta Sans", sans-serif`;
        const wordW = ctx.measureText(w.word).width;

        ctx.lineWidth = isWordActive ? 8 : 6;
        ctx.strokeStyle = '#000000';
        ctx.strokeText(w.word, curX + wordW / 2, captionY);

        if (isWordActive) {
          ctx.fillStyle = isEmphasis ? '#22C55E' : '#FACC15'; // Green or Bright Gold
        } else {
          ctx.fillStyle = '#FFFFFF';
        }
        ctx.fillText(w.word, curX + wordW / 2, captionY);
        curX += wordW + spaceWidth;
      } else if (theme === 'mrbeast') {
        // MrBeast Style: Vibrant cyan/yellow, heavy bounce
        ctx.font = `900 ${isWordActive ? baseFontSize * 1.2 : baseFontSize}px "Bebas Neue", sans-serif`;
        const wordW = ctx.measureText(w.word).width;

        ctx.lineWidth = 10;
        ctx.strokeStyle = '#000000';
        ctx.strokeText(w.word.toUpperCase(), curX + wordW / 2, captionY);

        if (isWordActive) {
          ctx.fillStyle = '#06B6D4'; // Vibrant Cyan
        } else {
          ctx.fillStyle = '#FEF08A'; // Yellow
        }
        ctx.fillText(w.word.toUpperCase(), curX + wordW / 2, captionY);
        curX += wordW + spaceWidth;
      } else if (theme === 'neon-glow') {
        // Neon Glow Style: Cyan/Pink glowing text
        ctx.font = `800 ${baseFontSize}px "Space Grotesk", sans-serif`;
        const wordW = ctx.measureText(w.word).width;

        if (isWordActive) {
          ctx.shadowColor = '#F43F5E';
          ctx.shadowBlur = 18;
          ctx.fillStyle = '#FDA4AF';
        } else {
          ctx.shadowColor = '#38BDF8';
          ctx.shadowBlur = 10;
          ctx.fillStyle = '#FFFFFF';
        }
        ctx.fillText(w.word, curX + wordW / 2, captionY);
        curX += wordW + spaceWidth;
      } else {
        // Clean Minimal: Smooth modern typography
        ctx.font = `700 ${isWordActive ? baseFontSize * 1.08 : baseFontSize}px "Plus Jakarta Sans", sans-serif`;
        const wordW = ctx.measureText(w.word).width;

        ctx.lineWidth = 5;
        ctx.strokeStyle = 'rgba(0,0,0,0.85)';
        ctx.strokeText(w.word, curX + wordW / 2, captionY);

        ctx.fillStyle = isWordActive ? '#FBBF24' : '#FFFFFF';
        ctx.fillText(w.word, curX + wordW / 2, captionY);
        curX += wordW + spaceWidth;
      }

      ctx.restore();
    });
  } else {
    // Segment-level caption display with emphasis
    ctx.font = `800 ${baseFontSize}px "Plus Jakarta Sans", "Montserrat", sans-serif`;
    const text = activeSegment.text;

    // Stroke
    ctx.lineWidth = 7;
    ctx.strokeStyle = '#000000';
    ctx.strokeText(text, canvasWidth / 2, captionY);

    // Fill
    ctx.fillStyle = theme === 'hormozi' ? '#FACC15' : '#FFFFFF';
    ctx.fillText(text, canvasWidth / 2, captionY);
  }

  ctx.restore();
}

// Client-side 9:16 Video Exporter using MediaRecorder and Canvas
export async function exportClipAsVideo(
  videoSourceElement: HTMLVideoElement,
  clip: ViralClip,
  settings: ExportSettings,
  onProgress?: (progress: number, status: string) => void
): Promise<{ blob: Blob; url: string; filename: string }> {
  return new Promise(async (resolve, reject) => {
    try {
      const is720p = settings.resolution === '720x1280';
      const canvasW = is720p ? 720 : 1080;
      const canvasH = is720p ? 1280 : 1920;

      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = canvasW;
      exportCanvas.height = canvasH;
      const ctx = exportCanvas.getContext('2d');

      if (!ctx) {
        throw new Error('Canvas 2D context not available');
      }

      // Clone or use the video element
      const playbackVideo = videoSourceElement;
      const wasPlaying = !playbackVideo.paused;
      playbackVideo.pause();

      // Ensure video is seeked to start
      playbackVideo.currentTime = clip.startTime;
      await new Promise((r) => {
        const handler = () => {
          playbackVideo.removeEventListener('seeked', handler);
          r(true);
        };
        playbackVideo.addEventListener('seeked', handler);
      });

      // Capture canvas stream
      const stream = exportCanvas.captureStream(30); // 30 FPS

      // Capture audio from video element if possible
      try {
        const anyVideo = playbackVideo as any;
        if (anyVideo.captureStream) {
          const videoStream = anyVideo.captureStream();
          const audioTracks = videoStream.getAudioTracks();
          if (audioTracks.length > 0) {
            stream.addTrack(audioTracks[0]);
          }
        }
      } catch (audioErr) {
        console.warn('Audio track capture notice:', audioErr);
      }

      // Check supported MIME type
      const mimeType = MediaRecorder.isTypeSupported('video/mp4;codecs=avc1,mp4a.40.2')
        ? 'video/mp4;codecs=avc1,mp4a.40.2'
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : 'video/webm';

      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: is720p ? 4_500_000 : 8_000_000,
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      const clipDuration = clip.endTime - clip.startTime;
      let animationFrameId: number;

      recorder.onstop = () => {
        cancelAnimationFrame(animationFrameId);
        playbackVideo.pause();
        const extension = mimeType.includes('mp4') ? 'mp4' : 'webm';
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const filename = `${clip.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_9x16.${extension}`;

        if (onProgress) onProgress(100, 'Export complete!');
        resolve({ blob, url, filename });
      };

      recorder.start(100);
      playbackVideo.play();

      if (onProgress) onProgress(0, 'Rendering 9:16 frames with animated captions...');

      const renderLoop = () => {
        const current = playbackVideo.currentTime;

        if (current >= clip.endTime || playbackVideo.ended) {
          recorder.stop();
          return;
        }

        renderFrameToCanvas(ctx, playbackVideo, settings, clip, current, canvasW, canvasH);

        const elapsed = Math.max(0, current - clip.startTime);
        const percent = Math.min(99, Math.round((elapsed / clipDuration) * 100));
        if (onProgress) {
          onProgress(percent, `Rendering frame (${formatSecondsToTime(elapsed)} / ${formatSecondsToTime(clipDuration)})`);
        }

        animationFrameId = requestAnimationFrame(renderLoop);
      };

      renderLoop();
    } catch (err) {
      console.error('Export error:', err);
      reject(err);
    }
  });
}
