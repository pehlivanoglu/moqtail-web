<template>
  <header class="conference-header">
    <div class="header-content">
      <div class="left-section">
        <h1 class="app-title">MOQtail Demo</h1>
        <span class="room-info">Room XYZ</span>
      </div>
      <div class="right-section">
        <span class="time-info">Time left: {{ formatTime(timeLeft) }}</span>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const timeLeft = ref(593) // 9:53 in seconds

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

let timer: number | null = null

onMounted(() => {
  timer = setInterval(() => {
    if (timeLeft.value > 0) {
      timeLeft.value--
    }
  }, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.conference-header {
  background: var(--vc-dark-bg-secondary);
  border-bottom: 1px solid var(--vc-dark-border-light);
  padding: 12px 0;
  box-shadow: var(--vc-shadow-light);
  flex-shrink: 0;
}

.header-content {
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.left-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.app-title {
  font-size: clamp(18px, 3vw, 22px);
  font-weight: 600;
  color: var(--vc-text-primary);
  margin: 0;
}

.room-info {
  font-size: clamp(13px, 2.5vw, 15px);
  color: var(--vc-text-secondary);
  font-weight: 500;
  background: var(--vc-dark-surface);
  padding: 6px 12px;
  border-radius: 16px;
  border: 1px solid var(--vc-dark-border-light);
}

.time-info {
  font-size: clamp(13px, 2.5vw, 15px);
  color: var(--vc-accent-red);
  font-weight: 600;
  background: rgba(242, 139, 130, 0.1);
  padding: 6px 12px;
  border-radius: 16px;
  border: 1px solid rgba(242, 139, 130, 0.2);
}

@media (max-width: 1024px) {
  .header-content {
    padding: 0 14px;
  }
  
  .left-section {
    gap: 12px;
  }
}

@media (max-width: 768px) {
  .conference-header {
    padding: 10px 0;
  }
  
  .header-content {
    padding: 0 12px;
  }
  
  .left-section {
    gap: 8px;
  }
}

@media (max-width: 480px) {
  .left-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>