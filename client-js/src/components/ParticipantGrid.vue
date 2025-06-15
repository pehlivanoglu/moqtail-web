<template>
  <div class="participant-grid">
    <div class="grid-container">
      <!-- Self Participant -->
      <ParticipantCard
        :key="'self'"
        :ref="el => setParticipantRef(el, 'self')"
        :participant="selfParticipant"
        :is-self="true"
      />

      <!-- Other Participants -->
      <ParticipantCard
        v-for="participant in props.otherParticipants"
        :key="participant.id"
        :ref="el => setParticipantRef(el, participant.id)"
        :participant="participant"
        :is-self="false"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import ParticipantCard from './ParticipantCard.vue'
import type { Participant, VideoOffscreenCanvas } from '../types/participant'

const props = defineProps<{
  selfParticipant: Participant,
  otherParticipants: Participant[]
}>()

const vibrantColors = [
  '#FF6B6B', // Coral Red
  '#4ECDC4', // Turquoise
  '#45B7D1', // Sky Blue
  '#96CEB4', // Mint Green
  '#FFEAA7', // Warm Yellow
  '#DDA0DD', // Plum
  '#98D8C8', // Seafoam
  '#F7DC6F', // Golden Yellow
  '#BB8FCE', // Lavender
  '#85C1E9', // Light Blue
  '#F8C471', // Peach
  '#82E0AA', // Light Green
  '#F1948A', // Salmon
  '#85C1E9', // Powder Blue
  '#F9E79F', // Cream Yellow
  '#D7BDE2', // Soft Purple
  '#A9DFBF', // Pale Green
  '#FAD7A0', // Light Orange
  '#AED6F1', // Baby Blue
  '#F5B7B1'  // Rose Pink
]

const getRandomColor = () => {
  return vibrantColors[Math.floor(Math.random() * vibrantColors.length)]
}

// TODO: remove on live
const simulateSpeaking = () => {
  const allParticipants = [props.selfParticipant, ...props.otherParticipants]

  allParticipants.forEach(p => {
    p.isSpeaking = false
  })

  if (Math.random() > 0.3) {
    const randomIndex = Math.floor(Math.random() * allParticipants.length)
    const speakingParticipant = allParticipants[randomIndex]
    speakingParticipant.isSpeaking = true

    if (!speakingParticipant.speakingColor) {
      speakingParticipant.speakingColor = getRandomColor()
    }
  }
}

const participantRefs = ref<Map<string, VideoOffscreenCanvas>>(new Map())

// Total participant count including self (max 6)
const totalParticipants = computed(() => Math.min(props.otherParticipants.value.length + 1, 6))

// Watch for video state changes and update self participant
const updateSelfVideoState = (hasVideo: boolean) => {
  props.selfParticipant.hasVideo = hasVideo
}

// Watch for microphone state changes and update self participant
const updateSelfMicState = (isMuted: boolean) => {
  props.selfParticipant.isAudioMuted = isMuted
}

// Expose methods to get OffscreenCanvas references for video rendering
defineExpose({
  getParticipantOffscreenCanvas: (participantId: string) => {
    const participantRef = participantRefs.value.get(participantId)
    return participantRef?.getOffscreenCanvas(participantId)
  },
  getParticipantOffscreenContext: (participantId: string) => {
    const participantRef = participantRefs.value.get(participantId)
    return participantRef?.getOffscreenContext(participantId)
  },
  getParticipantDisplayCanvas: (participantId: string) => {
    const participantRef = participantRefs.value.get(participantId)
    return participantRef?.getDisplayCanvas(participantId)
  },
  updateParticipantDisplay: (participantId: string) => {
    const participantRef = participantRefs.value.get(participantId)
    participantRef?.updateDisplay(participantId)
  },
  renderParticipantVideoFrame: (participantId: string, videoElement: HTMLVideoElement | ImageBitmap) => {
    const participantRef = participantRefs.value.get(participantId)
    participantRef?.renderVideoFrame(participantId, videoElement)
  },
  getAllParticipantOffscreenCanvases: () => {
    const canvases: { [key: string]: OffscreenCanvas } = {}
    // Include self canvas
    const selfCanvas = participantRefs.value.get('self')?.getOffscreenCanvas('self')
    if (selfCanvas) {
      canvases['self'] = selfCanvas
    }
    // Include other participant canvases (limited to 5)
    props.otherParticipants.value.forEach(participant => {
      const canvas = participantRefs.value.get(participant.id)?.getOffscreenCanvas(participant.id)
      if (canvas) {
        canvases[participant.id] = canvas
      }
    })
    return canvases
  },
  // Methods specifically for self video
  getSelfOffscreenCanvas: () => participantRefs.value.get('self')?.getOffscreenCanvas('self'),
  getSelfOffscreenContext: () => participantRefs.value.get('self')?.getOffscreenContext('self'),
  getSelfDisplayCanvas: () => {
    const selfRef = participantRefs.value.get('self')
    if (selfRef && typeof selfRef.getDisplayCanvas === 'function') {
      return selfRef.getDisplayCanvas('self')
    }
    return undefined
  },
  updateSelfDisplay: () => participantRefs.value.get('self')?.updateDisplay('self'),
  renderSelfVideoFrame: (videoElement: HTMLVideoElement | ImageBitmap) => {
    // Update self participant video state when rendering video
    if (videoElement instanceof HTMLVideoElement && videoElement.videoWidth > 0) {
      updateSelfVideoState(true)
    }

    const participantRef = participantRefs.value.get('self')
    if (participantRef) {
      participantRef.renderVideoFrame('self', videoElement)
    }
  },
  // Method to update self video state from external components
  updateSelfVideoState: (hasVideo: boolean) => {
    updateSelfVideoState(hasVideo)
  },
  // Method to update self microphone state from external components
  updateSelfMicState: (isMuted: boolean) => {
    updateSelfMicState(isMuted)
  }
})

const setParticipantRef = (el: VideoOffscreenCanvas | null, participantId: string) => {
  if (el) {
    participantRefs.value.set(participantId, el)
  } else {
    participantRefs.value.delete(participantId)
  }
}

onMounted(() => {
  console.log('participantRefs (mounted):', Array.from(participantRefs.value.entries()));
  // Konuşma simülasyonunu başlat
  const speakingInterval = setInterval(() => {
    simulateSpeaking()
  }, 3000) // Her 3 saniyede bir değiştir

  // İlk konuşmayı hemen başlat
  setTimeout(() => {
    simulateSpeaking()
  }, 1000)

  // Cleanup interval on unmount
  return () => {
    clearInterval(speakingInterval)
  }
})
</script>

<style scoped>
.participant-grid {
  background: var(--vc-dark-surface);
  border-radius: 12px;
  box-shadow: var(--vc-shadow-medium);
  border: 1px solid var(--vc-dark-border-light);
  padding: 16px;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 12px;
  flex: 1;
  min-height: 0;
  width: 100%;
  height: 100%;
}

/* All participant cards have exactly the same size - fill their grid cell */
.participant-card {
  width: 100%;
  height: 100%;
  min-height: 140px;
  max-height: none;
}

/* Large Desktop (1600px+) */
@media (min-width: 1600px) {
  .participant-grid {
    padding: 20px;
  }

  .grid-container {
    gap: 16px;
  }

  .participant-card {
    min-height: 180px;
  }
}

/* Desktop (1200px - 1599px) */
@media (max-width: 1599px) and (min-width: 1200px) {
  .participant-grid {
    padding: 16px;
  }

  .grid-container {
    gap: 12px;
  }

  .participant-card {
    min-height: 150px;
  }
}

/* Medium Desktop (1024px - 1199px) */
@media (max-width: 1199px) and (min-width: 1024px) {
  .participant-grid {
    padding: 14px;
  }

  .grid-container {
    gap: 10px;
  }

  .participant-card {
    min-height: 130px;
  }
}

/* Tablet Landscape (768px - 1023px) */
@media (max-width: 1023px) and (min-width: 768px) {
  .participant-grid {
    padding: 12px;
    border-radius: 10px;
  }

  .grid-container {
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(3, 1fr);
    gap: 10px;
  }

  .participant-card {
    min-height: 120px;
  }
}

/* Tablet Portrait & Large Mobile (480px - 767px) */
@media (max-width: 767px) and (min-width: 480px) {
  .participant-grid {
    padding: 10px;
    border-radius: 8px;
  }

  .grid-container {
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(3, 1fr);
    gap: 8px;
  }

  .participant-card {
    min-height: 100px;
  }
}

/* Small Mobile (320px - 479px) */
@media (max-width: 479px) {
  .participant-grid {
    padding: 8px;
    border-radius: 6px;
  }

  .grid-container {
    grid-template-columns: 1fr;
    grid-template-rows: repeat(6, 1fr);
    gap: 6px;
  }

  .participant-card {
    min-height: 80px;
  }
}

/* Very Small Mobile (below 320px) */
@media (max-width: 319px) {
  .participant-grid {
    padding: 6px;
  }

  .grid-container {
    gap: 4px;
  }

  .participant-card {
    min-height: 70px;
  }
}

/* Aspect ratio adjustments for different screen ratios */
@media (max-aspect-ratio: 4/3) {
  /* Portrait or square screens */
  .grid-container {
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(3, 1fr);
  }
}

@media (min-aspect-ratio: 21/9) {
  /* Ultra-wide screens */
  .grid-container {
    grid-template-columns: repeat(6, 1fr);
    grid-template-rows: 1fr;
  }

  .participant-card {
    min-height: 120px;
  }
}

/* Height-based adjustments for short screens */
@media (max-height: 600px) {
  .participant-grid {
    padding: 8px;
  }

  .grid-container {
    gap: 6px;
  }

  .participant-card {
    min-height: 80px;
  }
}

@media (max-height: 400px) {
  .participant-grid {
    padding: 6px;
  }

  .grid-container {
    gap: 4px;
  }

  .participant-card {
    min-height: 60px;
  }
}

/* Ensure grid maintains aspect ratio on very wide screens */
@media (min-width: 1920px) {
  .grid-container {
    max-width: 1600px;
    margin: 0 auto;
  }
}

/* Handle browser zoom and high DPI displays */
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  .participant-card {
    /* Ensure crisp rendering on high DPI displays */
    image-rendering: -webkit-optimize-contrast;
    image-rendering: crisp-edges;
  }
}
</style>
