<template>
  <div class="chat-message">
    <div class="message-header">
      <span class="sender-name">{{ message.sender }}</span>
      <span class="message-time">{{ formatTime(message.timestamp) }}</span>
    </div>
    <div class="message-content">
      {{ message.content }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ChatMessage } from '../types/chat'

interface Props {
  message: ChatMessage
}

defineProps<Props>()

const formatTime = (timestamp: Date): string => {
  return timestamp.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.chat-message {
  padding: 12px 14px;
  border-radius: 12px;
  background: var(--vc-dark-bg-secondary);
  border: 1px solid var(--vc-dark-border-light);
  transition: all 0.2s ease;
  margin-bottom: 2px;
}

.chat-message:hover {
  background: var(--vc-dark-surface-variant);
  border-color: var(--vc-dark-border);
  transform: translateY(-1px);
  box-shadow: var(--vc-shadow-light);
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.sender-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--vc-accent-blue);
}

.message-time {
  font-size: 10px;
  color: var(--vc-text-muted);
  background: var(--vc-dark-bg-primary);
  padding: 3px 8px;
  border-radius: 10px;
  border: 1px solid var(--vc-dark-border-light);
}

.message-content {
  font-size: 14px;
  color: var(--vc-text-primary);
  line-height: 1.4;
  word-break: break-word;
}
</style>