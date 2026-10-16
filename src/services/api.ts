import { ViralClip } from '../types';

export interface UploadProgressCallback {
  (percent: number, loaded: number, total: number): void;
}

export async function checkServerHealth() {
  try {
    const res = await fetch('/api/health');
    return await res.json();
  } catch (err) {
    console.error('Health check failed:', err);
    return { status: 'offline', hasGeminiKey: false };
  }
}

export function uploadVideoWithProgress(
  file: File,
  onProgress?: UploadProgressCallback
): Promise<{ success: boolean; file: { id: string; filename: string; originalName: string; size: number; url: string } }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('video', file);

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress(percent, e.loaded, e.total);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          resolve(res);
        } catch (err) {
          reject(new Error('Invalid JSON response from server'));
        }
      } else {
        try {
          const errRes = JSON.parse(xhr.responseText);
          reject(new Error(errRes.error || `Upload failed with status ${xhr.status}`));
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload'));
    });

    xhr.open('POST', '/api/upload');
    xhr.send(formData);
  });
}

export async function parseYouTubeVideo(url: string) {
  const res = await fetch('/api/youtube', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to parse YouTube URL');
  }

  return await res.json();
}

export async function analyzeVideoForClips(params: {
  title: string;
  duration: number;
  transcript?: string;
  sourceType: string;
  videoUrl?: string;
}): Promise<{ success: boolean; fullTranscript: string; clips: ViralClip[]; source?: string }> {
  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to detect viral clips');
  }

  return await res.json();
}

export async function exportVideoClip(params: {
  videoUrl: string;
  clip: ViralClip;
  settings?: any;
}): Promise<{ success: boolean; exportId: string; downloadUrl: string; filename: string }> {
  const res = await fetch('/api/export-clip', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to export video clip');
  }

  return await res.json();
}

export function triggerDirectDownload(url: string, filename: string) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

