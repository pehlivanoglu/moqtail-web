<template>
  <div class="session-layout">
    <div class="session-main">
      <h2>Welcome, {{ user?.name }} (Room: {{ user?.room }})</h2>
      <button @click="logout">Logout</button>

      <h3>Camera / Screen Preview</h3>
      <video ref="videoRef" autoplay playsinline muted></video>

      <MediaSelector
        :videoDevice="selectedVideoId ?? undefined"
        :audioDevice="selectedAudioId ?? undefined"
        :streamType="streamType"
        @update:videoDevice="selectedVideoId = $event"
        @update:audioDevice="selectedAudioId = $event"
        @update:streamType="streamType = $event"
      />

      <button @click="startStream">Start Stream</button>
      <button @click="stopStream" :disabled="!currentStream">Stop Stream</button>

      <p v-if="error" style="color: red">{{ error }}</p>
    </div>
    <aside class="users-box">
      <h3>Users in Room</h3>
      <ul>
        <li v-for="username in usersInRoom" :key="username">{{ username }}</li>
      </ul>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { io, Socket } from 'socket.io-client'
import axios from 'axios'
import MediaSelector from '@/components/MediaSelector.vue'

const router = useRouter()

const user = ref<{ name: string; room: string } | null>(null)
const usersInRoom = ref<string[]>([])

const selectedVideoId = ref<string | null>(null)
const selectedAudioId = ref<string | null>(null)
const streamType = ref<'camera' | 'screen'>('camera')
const currentStream = ref<MediaStream | null>(null)
const error = ref('')

const videoRef = ref<HTMLVideoElement | null>(null)

let socket: Socket | null = null

async function startStream() {
  if (currentStream.value) stopStream()

  try {
    let stream: MediaStream | null = null
    if (streamType.value === 'camera') {
      if (!selectedVideoId.value || !selectedAudioId.value) {
        error.value = 'Please select both camera and microphone.'
        return
      }
      stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: selectedVideoId.value },
        audio: { deviceId: selectedAudioId.value }
      })
    } else {
      stream = await (navigator.mediaDevices as any).getDisplayMedia({ video: true, audio: true })
    }

    currentStream.value = stream
    error.value = ''

    if (videoRef.value) {
      videoRef.value.srcObject = stream
    }
  } catch (e) {
    error.value = 'Failed to start stream: ' + (e as Error).message
  }
}

function stopStream() {
  if (!currentStream.value) return
  currentStream.value.getTracks().forEach(track => track.stop())
  currentStream.value = null
  if (videoRef.value) {
    videoRef.value.srcObject = null
  }
}

async function logout() {
  await axios.get('http://localhost:3001/logout', { withCredentials: true })
  user.value = null
  usersInRoom.value = []
  socket?.disconnect()
  router.push('/join')
}

onMounted(async () => {
  try {
    // Get session info
    const res = await axios.get('http://localhost:3001/session', { withCredentials: true })
    user.value = res.data

    // Connect to Socket.IO and join room
    socket = io('http://localhost:3001', {
      withCredentials: true,
      extraHeaders: {
        // optional headers if needed
      }
    })

    socket.on('connect', () => {
      if (user.value) {
        socket?.emit('joinRoom', { room: user.value.room, name: user.value.name })
      }
    })

    socket.on('usersUpdate', (users: string[]) => {
      usersInRoom.value = users
    })

    socket.on('disconnect', () => {
      usersInRoom.value = []
    })
  } catch (e) {
  if (axios.isAxiosError(e) && e.response) {
    if (e.response.status === 401) {
      error.value = 'No active session. Redirecting...'
    } else if (e.response.status === 403) {
      error.value = 'Session already used in another tab or window. Redirecting...'
    } else {
      error.value = 'An unknown error occurred. Redirecting...'
    }
  } else {
    error.value = 'Network error. Redirecting...'
  }
  setTimeout(() => router.push('/join'), 5000)
}
})

onUnmounted(() => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  logout();
});

</script>

<style scoped>
.session-layout {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 2rem;
  min-height: 80vh;
}

.session-main {
  flex: 2;
}

.users-box {
  flex: 1;
  background: #f7f9fc;
  border: 1.5px solid #d0d7de;
  border-radius: 10px;
  padding: 1.5rem 1rem;
  min-width: 200px;
  max-width: 260px;
  box-shadow: 0 2px 12px rgba(60,60,60,0.06);
  margin-top: 1.5rem;
}

.users-box h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  font-size: 1.15rem;
  color: #2c3e50;
}

.users-box ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.users-box li {
  padding: 0.4rem 0.2rem;
  border-bottom: 1px solid #e0e0e0;
  font-size: 1rem;
}

.users-box li:last-child {
  border-bottom: none;
}

video {
  max-width: 100%;
  max-height: 300px;
  border: 1px solid #ccc;
  margin-top: 10px;
  background: black;
}

button {
  margin-right: 10px;
  margin-top: 10px;
  padding: 0.5rem 1rem;
}
</style>