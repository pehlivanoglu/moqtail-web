<template>
  <div>
    <h2>Camera, Microphone & Screen Selection</h2>

    <div>
      <label>Camera:</label>
      <select :value="videoDevice" @change="$emit('update:videoDevice', $event.target.value)">
        <option v-for="device in videoInputs" :key="device.deviceId" :value="device.deviceId">
          {{ device.label || 'Camera ' + device.deviceId }}
        </option>
      </select>
    </div>

    <div>
      <label>Microphone:</label>
      <select :value="audioDevice" @change="$emit('update:audioDevice', $event.target.value)">
        <option v-for="device in audioInputs" :key="device.deviceId" :value="device.deviceId">
          {{ device.label || 'Microphone ' + device.deviceId }}
        </option>
      </select>
    </div>

    <div>
      <label>
        <input type="radio" value="camera" :checked="streamType === 'camera'" @change="$emit('update:streamType', 'camera')" />
        Camera & Microphone
      </label>
      <label style="margin-left: 1rem;">
        <input type="radio" value="screen" :checked="streamType === 'screen'" @change="$emit('update:streamType', 'screen')" />
        Screen Sharing
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = defineProps({
  videoDevice: String,
  audioDevice: String,
  streamType: String,
})

const videoInputs = ref<MediaDeviceInfo[]>([])
const audioInputs = ref<MediaDeviceInfo[]>([])

async function getDevices() {
  try {
    // ask for permission to get device labels
    await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    const devices = await navigator.mediaDevices.enumerateDevices()
    videoInputs.value = devices.filter(d => d.kind === 'videoinput')
    audioInputs.value = devices.filter(d => d.kind === 'audioinput')
  } catch (e) {
    console.error('Error accessing devices:', e)
  }
}

onMounted(getDevices)
</script>

<style scoped>
label {
  margin-right: 0.5rem;
}
select {
  margin-bottom: 1rem;
}
</style>
