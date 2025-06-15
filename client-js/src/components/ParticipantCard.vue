<template>
  <div class="participant-card" :class="{
    'self-video': props.isSelf,
    'speaking': props.participant.isSpeaking
  }" :style="speakingStyle">
    <div class="video-area">
      <canvas
        v-if="props.participant.hasVideo"
        :ref="el => setDisplayCanvasRef(el, props.participant.id)"
        class="video-canvas"
        :width="320"
        :height="180"
      ></canvas>
      <div v-else class="avatar-placeholder">
        <div class="avatar-circle">
          <span class="avatar-initials">{{ getInitials(props.participant.name) }}</span>
        </div>
      </div>

      <!-- Self video indicator -->
      <div v-if="props.isSelf" class="self-indicator">
        <span class="self-badge">You</span>
      </div>

      <!-- Speaking indicator -->
      <div v-if="props.participant.isSpeaking" class="speaking-indicator">
        <div class="speaking-waves">
          <div class="wave wave-1"></div>
          <div class="wave wave-2"></div>
          <div class="wave wave-3"></div>
        </div>
      </div>
    </div>

    <div class="participant-info">
      <span class="participant-name">{{ props.participant.name }}</span>
      <div class="audio-status">
        <!-- Unmuted microphone icon -->
        <svg v-if="!props.participant.isAudioMuted" class="mic-icon unmuted" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
        </svg>
        <!-- Muted microphone icon -->
        <svg v-else class="mic-icon muted" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z"/>
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import type { Participant } from '../types/participant'

const props = defineProps<{
  participant: Participant,
  isSelf: boolean
}>()

const displayCanvasRefs = ref<Map<string, HTMLCanvasElement>>(new Map())
const offscreenCanvases = ref<Map<string, OffscreenCanvas>>(new Map())
const offscreenContexts = ref<Map<string, OffscreenCanvasRenderingContext2D>>(new Map())
const displayContexts = ref<Map<string, CanvasRenderingContext2D>>(new Map())

// Fixed canvas dimensions - never change these
const canvasWidth = 320
const canvasHeight = 180

// Konuşan kişi için dinamik stil
const speakingStyle = computed(() => {
  if (props.participant.isSpeaking && props.participant.speakingColor) {
    return {
      '--speaking-color': props.participant.speakingColor,
      '--speaking-glow': `${props.participant.speakingColor}40` // 40 = 25% opacity
    }
  }
  return {}
})

// Expose OffscreenCanvas references for external video rendering
defineExpose({
  getOffscreenCanvas: (participantId: string) => offscreenCanvases.value.get(participantId),
  getOffscreenContext: (participantId: string) => offscreenContexts.value.get(participantId),
  getDisplayCanvas: (participantId: string) => displayCanvasRefs.value.get(participantId),
  updateDisplay: (participantId: string) => updateDisplayFromOffscreen(participantId),
  renderVideoFrame: (participantId: string, videoElement: HTMLVideoElement | ImageBitmap) => {
    const ctx = offscreenContexts.value.get(participantId)
    if (ctx) {
      ctx.clearRect(0, 0, canvasWidth, canvasHeight)
      ctx.drawImage(videoElement, 0, 0, canvasWidth, canvasHeight)
      updateDisplayFromOffscreen(participantId)
    }
  },
  clearCanvas: (participantId: string) => {
    const ctx = offscreenContexts.value.get(participantId)
    if (ctx) {
      ctx.clearRect(0, 0, canvasWidth, canvasHeight)
      drawVideoPlaceholder(ctx, participantId)
      updateDisplayFromOffscreen(participantId)
    }
  }
})

const setDisplayCanvasRef = (el: HTMLCanvasElement | null, participantId: string) => {
  if (el) {
    displayCanvasRefs.value.set(participantId, el)
    initializeCanvases(el, participantId)
  } else {
    // Cleanup when canvas is removed
    displayCanvasRefs.value.delete(participantId)
    offscreenCanvases.value.delete(participantId)
    offscreenContexts.value.delete(participantId)
    displayContexts.value.delete(participantId)
  }
}

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .substring(0, 2)
}

const initializeCanvases = (displayCanvas: HTMLCanvasElement, participantId: string) => {
  const displayCtx = displayCanvas.getContext('2d')
  if (displayCtx) {
    displayContexts.value.set(participantId, displayCtx)

    // Set fixed canvas dimensions
    displayCanvas.width = canvasWidth
    displayCanvas.height = canvasHeight

    // Initialize OffscreenCanvas with fixed dimensions
    if (typeof OffscreenCanvas !== 'undefined') {
      const offscreenCanvas = new OffscreenCanvas(canvasWidth, canvasHeight)
      const offscreenCtx = offscreenCanvas.getContext('2d')

      if (offscreenCtx) {
        offscreenCanvases.value.set(participantId, offscreenCanvas)
        offscreenContexts.value.set(participantId, offscreenCtx)

        drawVideoPlaceholder(offscreenCtx, participantId)
        updateDisplayFromOffscreen(participantId)
      }
    } else {
      console.warn('OffscreenCanvas not supported, falling back to regular canvas')
      // Fallback to regular canvas rendering
      drawVideoPlaceholder(displayCtx, participantId)
    }
  }
}

const updateDisplayFromOffscreen = (participantId: string) => {
  const offscreenCanvas = offscreenCanvases.value.get(participantId)
  const displayCtx = displayContexts.value.get(participantId)

  if (offscreenCanvas && displayCtx) {
    displayCtx.drawImage(offscreenCanvas, 0, 0)
  }
}

const drawVideoPlaceholder = (ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, participantId: string) => {
  // Dark background similar to Google Meet
  ctx.fillStyle = '#1a1a1a'
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)

  // Add subtle grid pattern
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'
  ctx.lineWidth = 1
  for (let i = 0; i < canvasWidth; i += 30) {
    ctx.beginPath()
    ctx.moveTo(i, 0)
    ctx.lineTo(i, canvasHeight)
    ctx.stroke()
  }
  for (let j = 0; j < canvasHeight; j += 30) {
    ctx.beginPath()
    ctx.moveTo(0, j)
    ctx.lineTo(canvasWidth, j)
    ctx.stroke()
  }

  // Draw video icon
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
  ctx.font = `${Math.min(canvasWidth, canvasHeight) * 0.15}px Arial`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // Different icons for self vs others
  const icon = props.isSelf ? '📹' : '👤'
  ctx.fillText(icon, canvasWidth / 2, canvasHeight / 2)
}

// Watch for hasVideo changes to update canvas display
watch(() => props.participant.hasVideo, (newHasVideo, oldHasVideo) => {
  // Only clear canvas when transitioning from video to no video
  if (oldHasVideo && !newHasVideo && props.isSelf) {
    const offscreenCtx = offscreenContexts.value.get(props.participant.id)
    if (offscreenCtx) {
      // Clear the canvas and draw placeholder
      offscreenCtx.clearRect(0, 0, canvasWidth, canvasHeight)
      drawVideoPlaceholder(offscreenCtx, props.participant.id)
      updateDisplayFromOffscreen(props.participant.id)
    }
  }
}, { immediate: false })

onMounted(() => {
  nextTick(() => {
    console.log('displayCanvasRefs (mounted):', Array.from(displayCanvasRefs.value.entries()));
  });
})

onUnmounted(() => {
  // No cleanup needed for resize listener
})
</script>

<style scoped>
.participant-card {
  background: var(--vc-dark-bg-secondary);
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
  border: 1px solid var(--vc-dark-border-light);
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  box-shadow: var(--vc-shadow-light);
  position: relative;
  aspect-ratio: 16/9;
}

.participant-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--vc-shadow-medium);
  border-color: var(--vc-dark-border);
}

.participant-card.self-video {
  border: 2px solid var(--vc-accent-blue);
  box-shadow: 0 0 0 1px rgba(138, 180, 248, 0.3), var(--vc-shadow-light);
}

.participant-card.self-video:hover {
  border-color: var(--vc-accent-blue-hover);
  box-shadow: 0 0 0 1px rgba(174, 203, 250, 0.4), var(--vc-shadow-medium);
}

/* Konuşan kişi için dinamik renkli çerçeve */
.participant-card.speaking {
  border: 3px solid var(--speaking-color, #4ECDC4);
  box-shadow:
    0 0 0 1px var(--speaking-glow, rgba(78, 205, 196, 0.4)),
    0 0 20px var(--speaking-glow, rgba(78, 205, 196, 0.3)),
    var(--vc-shadow-medium);
  animation: speakingPulse 1.5s ease-in-out infinite;
}

.participant-card.speaking:hover {
  transform: translateY(-3px);
  box-shadow:
    0 0 0 2px var(--speaking-glow, rgba(78, 205, 196, 0.5)),
    0 0 30px var(--speaking-glow, rgba(78, 205, 196, 0.4)),
    var(--vc-shadow-heavy);
}

/* Self video konuşurken mavi kalır ama daha parlak */
.participant-card.self-video.speaking {
  border: 3px solid var(--vc-accent-blue);
  box-shadow:
    0 0 0 1px rgba(138, 180, 248, 0.5),
    0 0 25px rgba(138, 180, 248, 0.4),
    var(--vc-shadow-medium);
  animation: speakingPulse 1.5s ease-in-out infinite;
}

@keyframes speakingPulse {
  0%, 100% {
    box-shadow:
      0 0 0 1px var(--speaking-glow, rgba(78, 205, 196, 0.4)),
      0 0 20px var(--speaking-glow, rgba(78, 205, 196, 0.3)),
      var(--vc-shadow-medium);
  }
  50% {
    box-shadow:
      0 0 0 2px var(--speaking-glow, rgba(78, 205, 196, 0.6)),
      0 0 30px var(--speaking-glow, rgba(78, 205, 196, 0.5)),
      var(--vc-shadow-heavy);
  }
}

.video-area {
  flex: 1;
  position: relative;
  background: var(--vc-dark-bg-primary);
  width: 100%;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-canvas {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  background: var(--vc-dark-bg-primary);
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--vc-dark-surface);
}

.avatar-circle {
  width: clamp(40px, 8vw, 60px);
  height: clamp(40px, 8vw, 60px);
  border-radius: 50%;
  background: var(--vc-dark-surface-variant);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--vc-dark-border);
  box-shadow: var(--vc-shadow-light);
}

.avatar-initials {
  color: var(--vc-text-primary);
  font-size: clamp(14px, 3vw, 20px);
  font-weight: 600;
}

.self-indicator {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 10;
}

.self-badge {
  background: var(--vc-accent-blue);
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  box-shadow: var(--vc-shadow-light);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* Konuşma göstergesi */
.speaking-indicator {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
  background: var(--speaking-color, #4ECDC4);
  border-radius: 20px;
  padding: 6px 10px;
  box-shadow: var(--vc-shadow-medium);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.speaking-waves {
  display: flex;
  align-items: center;
  gap: 2px;
}

.wave {
  width: 3px;
  background: white;
  border-radius: 2px;
  animation: waveAnimation 1.2s ease-in-out infinite;
}

.wave-1 {
  height: 8px;
  animation-delay: 0s;
}

.wave-2 {
  height: 12px;
  animation-delay: 0.2s;
}

.wave-3 {
  height: 8px;
  animation-delay: 0.4s;
}

@keyframes waveAnimation {
  0%, 100% {
    transform: scaleY(0.5);
    opacity: 0.7;
  }
  50% {
    transform: scaleY(1);
    opacity: 1;
  }
}

.participant-info {
  padding: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--vc-dark-surface);
  flex-shrink: 0;
  min-height: 40px;
  border-top: 1px solid var(--vc-dark-border-light);
}

.participant-name {
  font-size: clamp(11px, 2vw, 13px);
  font-weight: 500;
  color: var(--vc-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  margin-right: 8px;
}

.self-video .participant-name {
  color: var(--vc-accent-blue);
  font-weight: 600;
}

/* Konuşan kişinin ismi de renkli olur */
.speaking .participant-name {
  color: var(--speaking-color, #4ECDC4);
  font-weight: 600;
}

/* Self video konuşurken isim mavi kalır */
.self-video.speaking .participant-name {
  color: var(--vc-accent-blue);
}

.audio-status {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  padding: 4px 8px;
  border-radius: 12px;
  background: var(--vc-dark-bg-secondary);
  border: 1px solid var(--vc-dark-border-light);
  transition: all 0.2s ease;
}

.mic-icon {
  width: 14px;
  height: 14px;
  transition: all 0.2s ease;
}

.mic-icon.unmuted {
  color: var(--vc-accent-green);
  fill: var(--vc-accent-green);
}

.mic-icon.muted {
  color: #ea4335;
  fill: #ea4335;
  opacity: 0.8;
}

/* Hover effects for audio status */
.audio-status:hover {
  background: var(--vc-dark-surface-variant);
  border-color: var(--vc-dark-border);
  transform: scale(1.05);
}

.audio-status:hover .mic-icon.unmuted {
  color: var(--vc-accent-green);
  filter: brightness(1.1);
}

.audio-status:hover .mic-icon.muted {
  color: #f87171;
  filter: brightness(1.1);
}

@media (max-width: 768px) {
  .participant-card {
    border-radius: 6px;
  }

  .participant-card.self-video {
    border-width: 1px;
  }

  .participant-card.speaking {
    border-width: 2px;
  }

  .participant-info {
    padding: 8px;
    min-height: 36px;
  }

  .self-indicator {
    top: 6px;
    left: 6px;
  }

  .speaking-indicator {
    top: 6px;
    right: 6px;
    padding: 4px 6px;
  }

  .self-badge {
    padding: 3px 6px;
    font-size: 10px;
    border-radius: 10px;
  }

  .audio-status {
    padding: 3px 6px;
  }

  .mic-icon {
    width: 12px;
    height: 12px;
  }

  .wave {
    width: 2px;
  }

  .wave-1, .wave-3 {
    height: 6px;
  }

  .wave-2 {
    height: 9px;
  }
}
</style>
