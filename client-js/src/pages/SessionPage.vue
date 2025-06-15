<template>
  <div class="conference-app">
    <ConferenceHeader />
    <div class="conference-layout">
     <ParticipantGrid
      v-if="selfParticipant.name"
      ref="participantGridRef"
      :selfParticipant="selfParticipant"
      :otherParticipants="otherParticipants"
    />
      <ChatSection />
    </div>
    <div class="bottom-controls">
      <MediaControls ref="mediaControlsRef" @leave="logout"/>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, provide, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { io } from 'socket.io-client';
import axios from 'axios'

import type { Participant } from '../types/participant'

import ConferenceHeader from '../components/ConferenceHeader.vue'
import ParticipantGrid from '../components/ParticipantGrid.vue'
import ChatSection from '../components/ChatSection.vue'
import MediaControls from '../components/MediaControls.vue'

import { useVideoPublisher, useVideoSubscriber } from '../composables/useVideoPipeline'

const mediaControlsRef = ref()
const router = useRouter()

let socket: Socket | null = null
let roomId: string | null = null

const otherParticipants = ref<Participant[]>([])
const selfParticipant = ref<Participant>({
  id: 'self',
  name: '',
  hasVideo: false,
  isAudioMuted: true,
  isSpeaking: false,
  speakingColor: '#8AB4F8'
})

const participantGridRef = ref<{
  getParticipantOffscreenCanvas: (id: string) => OffscreenCanvas | undefined
  getParticipantOffscreenContext: (id: string) => OffscreenCanvasRenderingContext2D | undefined
  getParticipantDisplayCanvas: (id: string) => HTMLCanvasElement | undefined
  updateParticipantDisplay: (id: string) => void
  renderParticipantVideoFrame: (id: string, videoElement: HTMLVideoElement | ImageBitmap) => void
  getAllParticipantOffscreenCanvases: () => { [key: string]: OffscreenCanvas }
  getSelfOffscreenCanvas: () => OffscreenCanvas | undefined
  getSelfOffscreenContext: () => OffscreenCanvasRenderingContext2D | undefined
  getSelfDisplayCanvas: () => HTMLCanvasElement | undefined
  updateSelfDisplay: () => void
  renderSelfVideoFrame: (videoElement: HTMLVideoElement | ImageBitmap) => void
  updateSelfVideoState: (hasVideo: boolean) => void
  updateSelfMicState: (isMuted: boolean) => void
  logout
}>()

// Provide parent component methods to MediaControls
provide('parentComponent', {
  renderSelfVideoFrame: (videoElement: HTMLVideoElement | ImageBitmap) => {
    participantGridRef.value?.renderSelfVideoFrame(videoElement)
  },
  updateSelfVideoState: (hasVideo: boolean) => {
    participantGridRef.value?.updateSelfVideoState(hasVideo)
  },
  updateSelfMicState: (isMuted: boolean) => {
    participantGridRef.value?.updateSelfMicState(isMuted)
  }
})

// Expose OffscreenCanvas access methods for external video integration
defineExpose({
  // Self video OffscreenCanvas methods
  getSelfOffscreenCanvas: () => participantGridRef.value?.getSelfOffscreenCanvas(),
  getSelfOffscreenContext: () => participantGridRef.value?.getSelfOffscreenContext(),
  getSelfDisplayCanvas: () => participantGridRef.value?.getSelfDisplayCanvas(),
  updateSelfDisplay: () => participantGridRef.value?.updateSelfDisplay(),
  renderSelfVideoFrame: (videoElement: HTMLVideoElement | ImageBitmap) =>
    participantGridRef.value?.renderSelfVideoFrame(videoElement),

  // Participant video OffscreenCanvas methods
  getParticipantOffscreenCanvas: (participantId: string) =>
    participantGridRef.value?.getParticipantOffscreenCanvas(participantId),
  getParticipantOffscreenContext: (participantId: string) =>
    participantGridRef.value?.getParticipantOffscreenContext(participantId),
  getParticipantDisplayCanvas: (participantId: string) =>
    participantGridRef.value?.getParticipantDisplayCanvas(participantId),
  updateParticipantDisplay: (participantId: string) =>
    participantGridRef.value?.updateParticipantDisplay(participantId),
  renderParticipantVideoFrame: (participantId: string, videoElement: HTMLVideoElement | ImageBitmap) =>
    participantGridRef.value?.renderParticipantVideoFrame(participantId, videoElement),
  getAllParticipantOffscreenCanvases: () =>
    participantGridRef.value?.getAllParticipantOffscreenCanvases() || {}
})

onMounted(async () => {
  try {
    const res = await axios.get('http://localhost:3001/session', { withCredentials: true })
    selfParticipant.value.name = res.data.name
    roomId = res.data.room

    await nextTick();
    const videoElementRef = ref(mediaControlsRef.value?.videoElement)
    const displayCanvasRef = ref(participantGridRef.value?.getSelfDisplayCanvas())

    console.log("mediaControlsRef.value.videoElement:", videoElementRef)
    console.log("participantGridRef.value?.getSelfDisplayCanvas():", displayCanvasRef)

    const { setup: setupPublisher } = useVideoPublisher(
      videoElementRef,
      displayCanvasRef
    )
    setupPublisher().catch(err => console.error('Publisher error:', err))

    socket = io('http://localhost:3001', {
      withCredentials: true,
      extraHeaders: {
        // optional headers if needed
      }
    })

    socket.on('connect', () => {
      console.log('Connected to socket server')
      if (selfParticipant) {
        console.log('Joining room:', roomId, 'with participant name:', selfParticipant.value.name)
        socket?.emit('joinRoom', { room: roomId, name: selfParticipant.value.name })
        socket?.emit('getParticipants', {room: roomId})
      }
    })

    socket.on('newParticipant', (newParticipant) => {
      const newParticipantName = newParticipant.name
      console.log('New participant joined the room:', newParticipant)

      const exists = otherParticipants.value.some(p => p.name === newParticipantName)
      const isSelf = selfParticipant.name === newParticipantName

      if (!exists && !isSelf) {
        otherParticipants.value.push({
          id: newParticipantName, //TODO
          name: newParticipantName,
          hasVideo: false,
          isAudioMuted: true,
          isSpeaking: false,
          speakingColor: '#999' //TODO
        })
      }
    })

    socket.on('participantList', (participantList) => {
      console.log('Participant list received:', participantList)
      otherParticipants.value = participantList
        .filter(p => p !== selfParticipant.value.name)
        .map(p => ({
          id: p,
          name: p,
          hasVideo: false,
          isAudioMuted: true,
          isSpeaking: false,
          speakingColor: '#999'
        }))

    })

    socket.on('disconnect', () => {
      // usersInRoom.value = []
    })

  } catch (err) {
  if (axios.isAxiosError(err) && err.response) {
    if (err.response.status === 401) {
      err.value = 'No active session. Redirecting...'
    } else if (e.response.status === 403) {
      err.value = 'Session already used in another tab or window. Redirecting...'
    } else {
      err.value = 'An unknown error occurred. Redirecting...'
    }
  } else {
    err.value = 'Network error. Redirecting...'
  }
  // setTimeout(() => router.push('/join'), 5000)
  }
})

onUnmounted(() => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  logout();
});

async function logout() {
  await axios.get('http://localhost:3001/logout', { withCredentials: true })
  // selfParticipant.value = null
  // usersInRoom.value = []
  socket?.disconnect()
  router.push('/join')
}
</script>

<style scoped>
.conference-app {
  height: 100vh;
  background: var(--vc-dark-bg-primary);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.conference-layout {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 16px;
  padding: 16px;
  padding-bottom: 80px; /* Space for bottom controls */
  max-width: 1600px;
  margin: 0 auto;
  width: 100%;
  min-height: 0;
  overflow: hidden;
}

.bottom-controls {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: linear-gradient(180deg, transparent 0%, rgba(32, 33, 36, 0.8) 20%, var(--vc-dark-bg-primary) 100%);
  padding: 4px 0 6px;
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(95, 99, 104, 0.2);
}

@media (max-width: 1400px) {
  .conference-layout {
    grid-template-columns: 1fr 300px;
    gap: 14px;
    padding: 14px;
    padding-bottom: 75px;
  }
}

@media (max-width: 1200px) {
  .conference-layout {
    grid-template-columns: 1fr 280px;
    gap: 12px;
    padding: 12px;
    padding-bottom: 70px;
  }
}

@media (max-width: 1024px) {
  .conference-layout {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr auto;
    gap: 14px;
    padding-bottom: 65px;
  }

  .bottom-controls {
    padding: 3px 0 5px;
  }
}

@media (max-width: 768px) {
  .conference-layout {
    padding: 8px;
    padding-bottom: 60px;
    gap: 10px;
  }

  .bottom-controls {
    padding: 2px 0 4px;
  }
}

@media (max-width: 480px) {
  .conference-layout {
    padding-bottom: 55px;
  }
}
</style>
