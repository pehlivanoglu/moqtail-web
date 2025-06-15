<template>
  <div class="media-controls">
    <div class="controls-container">
      <!-- Camera Control with Dropdown -->
      <div class="control-group">
        <button
          class="control-button"
          :class="{ active: isCameraOn, disabled: isScreenSharing }"
          @click="toggleCamera"
          :disabled="isScreenSharing"
          :title="isScreenSharing ? 'Camera disabled during screen share' : (isCameraOn ? 'Turn off camera' : 'Turn on camera')"
        >
          <svg class="control-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
          </svg>
        </button>
        <button
          class="dropdown-arrow"
          :class="{ disabled: isScreenSharing, active: showCameraDropdown }"
          @click="toggleCameraDropdown"
          :disabled="isScreenSharing"
          title="Select camera"
        >
          <svg class="arrow-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 10l5 5 5-5z"/>
          </svg>
        </button>
        <div v-if="showCameraDropdown" class="device-dropdown" @click.stop>
          <div class="dropdown-content">
            <div class="dropdown-header">
              <svg class="header-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
              </svg>
              <span>Camera</span>
            </div>
            <div class="dropdown-items">
              <div
                v-for="device in videoInputs"
                :key="device.deviceId"
                class="dropdown-item"
                :class="{ selected: selectedVideoDevice === device.deviceId }"
                @click="selectVideoDevice(device.deviceId)"
              >
                <div class="item-content">
                  <span class="item-name">{{ device.label || `Camera ${device.deviceId.slice(0, 8)}...` }}</span>
                  <svg v-if="selectedVideoDevice === device.deviceId" class="check-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Microphone Control with Dropdown -->
      <div class="control-group">
        <button
          class="control-button"
          :class="{ active: !isMicMuted, muted: isMicMuted }"
          @click="toggleMicrophone"
          :title="isMicMuted ? 'Unmute microphone' : 'Mute microphone'"
        >
          <svg v-if="!isMicMuted" class="control-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
          </svg>
          <svg v-else class="control-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z"/>
          </svg>
        </button>
        <button
          class="dropdown-arrow"
          :class="{ active: showMicDropdown }"
          @click="toggleMicDropdown"
          title="Select microphone"
        >
          <svg class="arrow-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 10l5 5 5-5z"/>
          </svg>
        </button>
        <div v-if="showMicDropdown" class="device-dropdown" @click.stop>
          <div class="dropdown-content">
            <div class="dropdown-header">
              <svg class="header-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
              </svg>
              <span>Microphone</span>
            </div>
            <div class="dropdown-items">
              <div
                v-for="device in audioInputs"
                :key="device.deviceId"
                class="dropdown-item"
                :class="{ selected: selectedAudioDevice === device.deviceId }"
                @click="selectAudioDevice(device.deviceId)"
              >
                <div class="item-content">
                  <span class="item-name">{{ device.label || `Microphone ${device.deviceId.slice(0, 8)}...` }}</span>
                  <svg v-if="selectedAudioDevice === device.deviceId" class="check-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Screen Share Control -->
      <button
        class="control-button"
        :class="{ active: isScreenSharing }"
        @click="toggleScreenShare"
        :title="isScreenSharing ? 'Stop screen sharing' : 'Start screen sharing'"
      >
        <svg class="control-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.1-.89-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z"/>
        </svg>
      </button>

      <!-- Leave Call Button -->
      <button
        class="control-button leave-button"
        @click="handleLeave"
        title="Leave call"
      >
        <svg class="control-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.7l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.1-.7-.28-.79-.73-1.68-1.36-2.66-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"/>
        </svg>
      </button>
    </div>

    <!-- Error message display -->
    <div v-if="screenShareError" class="error-message">
      <span class="error-icon">⚠️</span>
      <span class="error-text">{{ screenShareError }}</span>
      <button class="error-dismiss" @click="screenShareError = ''" title="Dismiss">×</button>
    </div>

    <!-- Hidden video element for capturing stream -->
    <video
      ref="videoElement"
      class="hidden-video"
      autoplay
      muted
      playsinline
    ></video>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, inject, nextTick } from 'vue'

const emit = defineEmits(['leave']);

// Media selection state
const selectedVideoDevice = ref<string>('')
const selectedAudioDevice = ref<string>('')
const videoInputs = ref<MediaDeviceInfo[]>([])
const audioInputs = ref<MediaDeviceInfo[]>([])

// Dropdown states
const showCameraDropdown = ref(false)
const showMicDropdown = ref(false)

// Control states
const isCameraOn = ref(false)
const isScreenSharing = ref(false)
const isMicMuted = ref(true)

// Error state
const screenShareError = ref<string>('')

// Media streams
const cameraStream = ref<MediaStream | null>(null)
const screenStream = ref<MediaStream | null>(null)
const currentStream = ref<MediaStream | null>(null)

// Video element for rendering
const videoElement = ref<HTMLVideoElement>()

// Animation frame for video rendering
let animationFrameId: number | null = null
let isVideoReady = ref(false)

// Get parent component methods for rendering video
const parentComponent = inject('parentComponent', null) as any

const getDevices = async () => {
  try {
    // Ask for permission to get device labels
    await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    const devices = await navigator.mediaDevices.enumerateDevices()
    videoInputs.value = devices.filter(d => d.kind === 'videoinput')
    audioInputs.value = devices.filter(d => d.kind === 'audioinput')

    // Set default devices if none selected
    if (!selectedVideoDevice.value && videoInputs.value.length > 0) {
      selectedVideoDevice.value = videoInputs.value[0].deviceId
    }
    if (!selectedAudioDevice.value && audioInputs.value.length > 0) {
      selectedAudioDevice.value = audioInputs.value[0].deviceId
    }
  } catch (e) {
    console.error('Error accessing devices:', e)
  }
}

const toggleCameraDropdown = () => {
  showCameraDropdown.value = !showCameraDropdown.value
  showMicDropdown.value = false
}

const toggleMicDropdown = () => {
  showMicDropdown.value = !showMicDropdown.value
  showCameraDropdown.value = false
}

const selectVideoDevice = (deviceId: string) => {
  selectedVideoDevice.value = deviceId
  showCameraDropdown.value = false
}

const selectAudioDevice = (deviceId: string) => {
  selectedAudioDevice.value = deviceId
  showMicDropdown.value = false
}

const updateSelfVideoState = (hasVideo: boolean) => {
  // Update the self video state in the participant grid
  if (parentComponent && parentComponent.updateSelfVideoState) {
    parentComponent.updateSelfVideoState(hasVideo)
  }
}

const updateSelfMicState = (isMuted: boolean) => {
  // Update the self microphone state in the participant grid
  if (parentComponent && parentComponent.updateSelfMicState) {
    parentComponent.updateSelfMicState(isMuted)
  }
}

const toggleCamera = async () => {
  if (isScreenSharing.value) return // Can't use camera while screen sharing

  if (isCameraOn.value) {
    // Turn off camera
    stopCameraStream()
    isCameraOn.value = false
    isVideoReady.value = false
    // Update self video state to show placeholder
    updateSelfVideoState(false)
  } else {
    // Turn on camera
    try {
      await startCameraStream()
      isCameraOn.value = true
      // updateSelfVideoState will be called when video is ready
    } catch (error) {
      console.error('Failed to start camera:', error)
      isCameraOn.value = false
      isVideoReady.value = false
      updateSelfVideoState(false)
    }
  }
}

const toggleScreenShare = async () => {
  // Clear any previous error messages
  screenShareError.value = ''

  if (isScreenSharing.value) {
    // Stop screen sharing
    stopScreenStream()
    isScreenSharing.value = false
    isVideoReady.value = false
    updateSelfVideoState(false)

    // If camera was on before screen share, turn it back on
    if (isCameraOn.value) {
      try {
        await startCameraStream()
        // updateSelfVideoState will be called when video is ready
      } catch (error) {
        console.error('Failed to restart camera:', error)
        isCameraOn.value = false
        isVideoReady.value = false
        updateSelfVideoState(false)
      }
    }
  } else {
    // Start screen sharing
    try {
      // Stop camera first
      if (isCameraOn.value) {
        stopCameraStream()
      }

      await startScreenStream()
      isScreenSharing.value = true
      // updateSelfVideoState will be called when video is ready
    } catch (error) {
      console.error('Failed to start screen sharing:', error)

      // Set user-friendly error message based on the error
      if (error instanceof Error) {
        if (error.message.includes('Permission denied') || error.name === 'NotAllowedError') {
          screenShareError.value = 'Screen sharing permission denied. Please allow screen sharing access in your browser.'
        } else if (error.name === 'NotSupportedError') {
          screenShareError.value = 'Screen sharing is not supported in this browser.'
        } else if (error.name === 'AbortError') {
          screenShareError.value = 'Screen sharing was cancelled.'
        } else {
          screenShareError.value = 'Failed to start screen sharing. Please try again.'
        }
      } else {
        screenShareError.value = 'Failed to start screen sharing. Please try again.'
      }
    }
  }
}

const toggleMicrophone = async () => {
  if (currentStream.value) {
    const audioTracks = currentStream.value.getAudioTracks()
    audioTracks.forEach(track => {
      track.enabled = isMicMuted.value
    })
    isMicMuted.value = !isMicMuted.value
    // Update self microphone state in participant grid
    updateSelfMicState(isMicMuted.value)
  } else {
    // If no stream is active, try to get microphone access
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: selectedAudioDevice.value ? { deviceId: selectedAudioDevice.value } : true
      })

      // Add audio track to current stream if it exists
      if (currentStream.value) {
        const audioTrack = audioStream.getAudioTracks()[0]
        if (audioTrack) {
          currentStream.value.addTrack(audioTrack)
          isMicMuted.value = false
          updateSelfMicState(false)
        }
      } else {
        // Create a new stream with just audio
        currentStream.value = audioStream
        isMicMuted.value = false
        updateSelfMicState(false)
      }
    } catch (error) {
      console.error('Failed to access microphone:', error)
    }
  }
}

// const leaveCall = () => {
//   // Stop all streams
//   stopCameraStream()
//   stopScreenStream()

//   // Reset states
//   isCameraOn.value = false
//   isScreenSharing.value = false
//   isMicMuted.value = true
//   isVideoReady.value = false
//   updateSelfVideoState(false)
//   updateSelfMicState(true)

//   // console.log('Left the call')
// }

function handleLeave() {
  // leaveCall();
  emit('leave');
}

const startVideoRendering = () => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }

  const renderFrame = () => {
    if (videoElement.value && currentStream.value && parentComponent && isVideoReady.value) {
      // Check if video has valid dimensions
      if (videoElement.value.videoWidth > 0 && videoElement.value.videoHeight > 0) {
        const renderSelfVideoFrame = parentComponent.renderSelfVideoFrame
        if (renderSelfVideoFrame) {
          renderSelfVideoFrame(videoElement.value)
        }
      }
    }

    if (currentStream.value && isVideoReady.value) {
      animationFrameId = requestAnimationFrame(renderFrame)
    }
  }

  // Start rendering immediately if video is ready
  if (isVideoReady.value) {
    renderFrame()
  }
}

const stopVideoRendering = () => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
}

const waitForVideoReady = async (videoEl: HTMLVideoElement): Promise<void> => {
  return new Promise((resolve) => {
    const checkReady = () => {
      if (videoEl.videoWidth > 0 && videoEl.videoHeight > 0 && videoEl.readyState >= 2) {
        resolve()
      } else {
        // Check again on next frame
        requestAnimationFrame(checkReady)
      }
    }
    checkReady()
  })
}

const startCameraStream = async () => {
  try {
    const constraints: MediaStreamConstraints = {
      video: selectedVideoDevice.value ? {
        deviceId: selectedVideoDevice.value,
        frameRate: { ideal: 30 }
      } : {
        frameRate: { ideal: 30 }
      },
      audio: selectedAudioDevice.value ? { deviceId: selectedAudioDevice.value } : true
    }

    const stream = await navigator.mediaDevices.getUserMedia(constraints)
    cameraStream.value = stream
    currentStream.value = stream

    if (videoElement.value) {
      videoElement.value.srcObject = stream

      // Wait for video to be ready before starting rendering
      videoElement.value.addEventListener('loadedmetadata', async () => {
        try {
          await videoElement.value!.play()
          await waitForVideoReady(videoElement.value!)

          // Now video is fully ready
          isVideoReady.value = true
          updateSelfVideoState(true)

          // Start rendering on next tick to ensure everything is set up
          await nextTick()
          startVideoRendering()
        } catch (error) {
          console.error('Error playing video:', error)
          isVideoReady.value = false
          updateSelfVideoState(false)
        }
      }, { once: true })

      // Also handle the case where metadata is already loaded
      if (videoElement.value.readyState >= 1) {
        try {
          await videoElement.value.play()
          await waitForVideoReady(videoElement.value)

          isVideoReady.value = true
          updateSelfVideoState(true)

          await nextTick()
          startVideoRendering()
        } catch (error) {
          console.error('Error playing video:', error)
          isVideoReady.value = false
          updateSelfVideoState(false)
        }
      }
    }

    // Set microphone state based on audio track
    const audioTracks = stream.getAudioTracks()
    if (audioTracks.length > 0) {
      isMicMuted.value = !audioTracks[0].enabled
      updateSelfMicState(isMicMuted.value)
    }

  } catch (error) {
    console.error('Error starting camera stream:', error)
    isVideoReady.value = false
    throw error
  }
}

const startScreenStream = async () => {
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        frameRate: { ideal: 30 }
      },
      audio: true
    })

    screenStream.value = stream
    currentStream.value = stream

    // Add microphone audio if available
    if (selectedAudioDevice.value) {
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: { deviceId: selectedAudioDevice.value }
        })
        const audioTrack = audioStream.getAudioTracks()[0]
        if (audioTrack) {
          stream.addTrack(audioTrack)
        }
      } catch (e) {
        console.warn('Could not add microphone audio:', e)
      }
    }

    if (videoElement.value) {
      videoElement.value.srcObject = stream

      // Wait for video to be ready before starting rendering
      videoElement.value.addEventListener('loadedmetadata', async () => {
        try {
          await videoElement.value!.play()
          await waitForVideoReady(videoElement.value!)

          // Now video is fully ready
          isVideoReady.value = true
          updateSelfVideoState(true)

          // Start rendering on next tick to ensure everything is set up
          await nextTick()
          startVideoRendering()
        } catch (error) {
          console.error('Error playing screen share video:', error)
          isVideoReady.value = false
          updateSelfVideoState(false)
        }
      }, { once: true })

      // Also handle the case where metadata is already loaded
      if (videoElement.value.readyState >= 1) {
        try {
          await videoElement.value.play()
          await waitForVideoReady(videoElement.value)

          isVideoReady.value = true
          updateSelfVideoState(true)

          await nextTick()
          startVideoRendering()
        } catch (error) {
          console.error('Error playing screen share video:', error)
          isVideoReady.value = false
          updateSelfVideoState(false)
        }
      }
    }

    // Handle stream end (when user stops screen sharing)
    stream.getVideoTracks()[0]?.addEventListener('ended', () => {
      stopScreenStream()
      isScreenSharing.value = false
      isVideoReady.value = false
      updateSelfVideoState(false)
    })

    // Set microphone state based on audio track
    const audioTracks = stream.getAudioTracks()
    if (audioTracks.length > 0) {
      isMicMuted.value = !audioTracks[0].enabled
      updateSelfMicState(isMicMuted.value)
    }

  } catch (error) {
    console.error('Error starting screen stream:', error)
    isVideoReady.value = false
    throw error
  }
}

const stopCameraStream = () => {
  if (cameraStream.value) {
    cameraStream.value.getTracks().forEach(track => track.stop())
    cameraStream.value = null
  }

  if (currentStream.value === cameraStream.value) {
    currentStream.value = null
    if (videoElement.value) {
      videoElement.value.srcObject = null
    }
    stopVideoRendering()
    isVideoReady.value = false
  }
}

const stopScreenStream = () => {
  if (screenStream.value) {
    screenStream.value.getTracks().forEach(track => track.stop())
    screenStream.value = null
  }

  if (currentStream.value === screenStream.value) {
    currentStream.value = null
    if (videoElement.value) {
      videoElement.value.srcObject = null
    }
    stopVideoRendering()
    isVideoReady.value = false
  }
}

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.control-group')) {
    showCameraDropdown.value = false
    showMicDropdown.value = false
  }
}

// Watch for device changes
watch([selectedVideoDevice, selectedAudioDevice], () => {
  if (isCameraOn.value) {
    // Restart camera stream with new devices
    stopCameraStream()
    setTimeout(() => {
      isCameraOn.value = false
      toggleCamera()
    }, 100)
  }
})

// Watch for video state changes to ensure proper cleanup
watch([isCameraOn, isScreenSharing], ([newCameraOn, newScreenSharing], [oldCameraOn, oldScreenSharing]) => {
  // If both camera and screen sharing are turned off, ensure we show placeholder
  if (!newCameraOn && !newScreenSharing && (oldCameraOn || oldScreenSharing)) {
    // Small delay to ensure streams are properly stopped
    setTimeout(() => {
      isVideoReady.value = false
      updateSelfVideoState(false)
    }, 100)
  }
})

onMounted(() => {
  getDevices()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  stopCameraStream()
  stopScreenStream()
  document.removeEventListener('click', handleClickOutside)
})

defineExpose({
  videoElement
})
</script>

<style scoped>
.media-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.controls-container {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 14px;
  background: rgba(48, 49, 52, 0.9);
  padding: 4px 12px;
  border-radius: 28px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(95, 99, 104, 0.3);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
}

.control-group {
  position: relative;
  display: flex;
  align-items: center;
}

.control-button {
  width: 40px;
  height: 40px;
  border-radius: 20px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background: #3c4043;
  color: #9aa0a6;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  border: 1px solid #5f6368;
}

.control-button:hover:not(:disabled) {
  background: #48494d;
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
}

.control-button:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.control-button.active {
  background: #1a73e8;
  color: white;
  border-color: #1a73e8;
}

.control-button.active:hover {
  background: #1557b0;
  border-color: #1557b0;
}

.control-button.muted {
  background: #ea4335;
  color: white;
  border-color: #ea4335;
}

.control-button.muted:hover {
  background: #d33b2c;
  border-color: #d33b2c;
}

.control-button.leave-button {
  background: #ea4335;
  color: white;
  border-color: #ea4335;
}

.control-button.leave-button:hover {
  background: #d33b2c;
  border-color: #d33b2c;
}

.control-button.disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background: #3c4043;
  color: #5f6368;
}

.control-button.disabled:hover {
  transform: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  background: #3c4043;
}

.control-icon {
  width: 16px;
  height: 16px;
  fill: currentColor;
}

.dropdown-arrow {
  width: 20px;
  height: 20px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  background: #3c4043;
  color: #9aa0a6;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: -4px;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  border: 1px solid #5f6368;
  z-index: 1;
}

.dropdown-arrow:hover:not(:disabled) {
  background: #48494d;
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
}

.dropdown-arrow.active {
  background: #48494d;
  transform: translateY(-2px);
}

.dropdown-arrow.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.arrow-icon {
  width: 12px;
  height: 12px;
  fill: currentColor;
  transition: transform 0.2s ease;
}

.dropdown-arrow.active .arrow-icon {
  transform: rotate(180deg);
}

.device-dropdown {
  position: absolute;
  bottom: 100%;
  left: 0;
  right: 0;
  z-index: 1000;
  margin-bottom: 12px;
  min-width: 320px;
  animation: dropdownSlideUp 0.2s ease-out;
}

@keyframes dropdownSlideUp {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.dropdown-content {
  background: #2d2e30;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
  border: 1px solid #404144;
  overflow: hidden;
  backdrop-filter: blur(10px);
}

.dropdown-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px 12px;
  background: linear-gradient(135deg, #35363a 0%, #2d2e30 100%);
  border-bottom: 1px solid #404144;
  color: #e8eaed;
  font-size: 14px;
  font-weight: 500;
}

.header-icon {
  width: 18px;
  height: 18px;
  fill: #8ab4f8;
  flex-shrink: 0;
}

.dropdown-items {
  max-height: 240px;
  overflow-y: auto;
  padding: 8px 0;
}

.dropdown-item {
  cursor: pointer;
  transition: all 0.15s ease;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.dropdown-item:last-child {
  border-bottom: none;
}

.dropdown-item:hover {
  background: linear-gradient(90deg, rgba(138, 180, 248, 0.1) 0%, rgba(138, 180, 248, 0.05) 100%);
}

.dropdown-item.selected {
  background: linear-gradient(90deg, rgba(26, 115, 232, 0.2) 0%, rgba(26, 115, 232, 0.1) 100%);
}

.dropdown-item.selected:hover {
  background: linear-gradient(90deg, rgba(26, 115, 232, 0.3) 0%, rgba(26, 115, 232, 0.15) 100%);
}

.item-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  gap: 12px;
}

.item-name {
  font-size: 14px;
  color: #e8eaed;
  font-weight: 400;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown-item.selected .item-name {
  color: #8ab4f8;
  font-weight: 500;
}

.check-icon {
  width: 16px;
  height: 16px;
  fill: #8ab4f8;
  flex-shrink: 0;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 6px;
  color: #fca5a5;
  font-size: 12px;
  animation: slideIn 0.3s ease-out;
  max-width: 400px;
}

.error-icon {
  font-size: 12px;
  flex-shrink: 0;
}

.error-text {
  flex: 1;
  line-height: 1.4;
}

.error-dismiss {
  background: none;
  border: none;
  color: #fca5a5;
  font-size: 14px;
  cursor: pointer;
  padding: 0;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s ease;
  flex-shrink: 0;
}

.error-dismiss:hover {
  background: rgba(239, 68, 68, 0.2);
}

.hidden-video {
  display: none;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Custom scrollbar for dropdown */
.dropdown-items::-webkit-scrollbar {
  width: 6px;
}

.dropdown-items::-webkit-scrollbar-track {
  background: transparent;
}

.dropdown-items::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.dropdown-items::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

@media (max-width: 1024px) {
  .media-controls {
    padding: 0 16px;
  }

  .controls-container {
    gap: 12px;
    padding: 3px 10px;
  }

  .control-button {
    width: 36px;
    height: 36px;
    border-radius: 18px;
  }

  .control-icon {
    width: 14px;
    height: 14px;
  }

  .dropdown-arrow {
    width: 18px;
    height: 18px;
    border-radius: 9px;
    margin-left: -3px;
  }

  .arrow-icon {
    width: 10px;
    height: 10px;
  }

  .device-dropdown {
    min-width: 280px;
  }
}

@media (max-width: 768px) {
  .media-controls {
    padding: 0 12px;
  }

  .controls-container {
    gap: 10px;
    padding: 2px 8px;
    border-radius: 24px;
  }

  .control-button {
    width: 32px;
    height: 32px;
    border-radius: 16px;
  }

  .control-icon {
    width: 12px;
    height: 12px;
  }

  .dropdown-arrow {
    width: 16px;
    height: 16px;
    border-radius: 8px;
    margin-left: -2px;
  }

  .arrow-icon {
    width: 8px;
    height: 8px;
  }

  .device-dropdown {
    min-width: 240px;
  }

  .dropdown-header {
    padding: 14px 16px 10px;
    font-size: 13px;
  }

  .header-icon {
    width: 16px;
    height: 16px;
  }

  .item-content {
    padding: 10px 16px;
  }

  .item-name {
    font-size: 13px;
  }

  .check-icon {
    width: 14px;
    height: 14px;
  }
}

@media (max-width: 480px) {
  .controls-container {
    gap: 8px;
    padding: 2px 6px;
    border-radius: 20px;
  }

  .control-button {
    width: 28px;
    height: 28px;
    border-radius: 14px;
  }

  .control-icon {
    width: 10px;
    height: 10px;
  }

  .dropdown-arrow {
    width: 14px;
    height: 14px;
    border-radius: 7px;
    margin-left: -2px;
  }

  .arrow-icon {
    width: 6px;
    height: 6px;
  }

  .device-dropdown {
    min-width: 200px;
  }

  .dropdown-header {
    padding: 12px 14px 8px;
    font-size: 12px;
  }

  .header-icon {
    width: 14px;
    height: 14px;
  }

  .item-content {
    padding: 8px 14px;
  }

  .item-name {
    font-size: 12px;
  }

  .check-icon {
    width: 12px;
    height: 12px;
  }
}
</style>
