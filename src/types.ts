export interface CaptionWord {
  word: string;
  start: number; // in seconds relative to video start
  end: number;
}

export interface CaptionSegment {
  id: string;
  start: number; // seconds
  end: number; // seconds
  text: string;
  words?: CaptionWord[];
  speaker?: string;
  emphasis?: string[]; // words that should pop with highlight color
}

export interface ViralClip {
  id: string;
  title: string;
  hook: string;
  summary: string;
  reason: string;
  viralityScore: number; // 0-100
  retentionScore: number; // 0-100
  emotionalPeak: 'epiphany' | 'humor' | 'shock' | 'controversy' | 'inspiration' | 'educational' | 'storytelling';
  startTime: number; // seconds in long video
  endTime: number; // seconds in long video
  duration: number; // seconds (15 - 60s)
  thumbnailTime?: number;
  tags: string[];
  suggestedHashtags: string[];
  captions: CaptionSegment[];
  suggestedHookHeader?: string;
}

export type ReframingMode = 'fill' | 'blur-split' | 'letterbox-banner' | 'fit-center';

export type CaptionTheme = 'hormozi' | 'mrbeast' | 'neon-glow' | 'clean-minimal' | 'bold-yellow';

export interface VideoProject {
  id: string;
  title: string;
  sourceType: 'upload' | 'youtube' | 'sample';
  sourceUrl: string; // URL or blob/uploaded path
  originalFileName?: string;
  fileSize?: number;
  duration: number; // in seconds
  thumbnailUrl?: string;
  createdAt: number;
  status: 'idle' | 'uploading' | 'transcribing' | 'detecting' | 'ready' | 'error';
  errorMessage?: string;
  progressPercent: number;
  statusStage?: string;
  fullTranscript?: string;
  clips: ViralClip[];
}

export interface ExportSettings {
  aspectRatio: '9:16';
  resolution: '1080x1920' | '720x1280';
  reframingMode: ReframingMode;
  captionTheme: CaptionTheme;
  captionSize: number; // 24 - 48
  captionPosition: 'bottom' | 'middle' | 'top';
  hookHeader: string;
  showHookHeader: boolean;
  showProgressBar: boolean;
  cropOffsetX: number; // -50 to 50 (% shift)
  zoomScale: number; // 1.0 to 2.5
}
