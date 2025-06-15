export interface Participant {
  id: string
  name: string
  hasVideo: boolean
  isAudioMuted: boolean
  isSpeaking?: boolean
  speakingColor?: string
}

// OffscreenCanvas reference interface for video rendering
export interface VideoOffscreenCanvas {
  getOffscreenCanvas: (participantId?: string) => OffscreenCanvas | undefined
  getOffscreenContext: (participantId?: string) => OffscreenCanvasRenderingContext2D | undefined
  getDisplayCanvas: (participantId?: string) => HTMLCanvasElement | undefined
  updateDisplay: (participantId?: string) => void
  renderVideoFrame: (participantIdOrVideoElement: string | HTMLVideoElement | ImageBitmap, videoElement?: HTMLVideoElement | ImageBitmap) => void
}