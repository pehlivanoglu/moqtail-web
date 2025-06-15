<template>
  <div class="chat-section">
    <div class="chat-header">
      <div class="chat-title">
        <svg class="chat-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4v3c0 .6.4 1 1 1 .2 0 .5-.1.7-.3L14.4 18H20c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 12H5v-2h8v2zm3-3H5V9h11v2zm0-3H5V6h11v2z"/>
        </svg>
        <span>Chat</span>
      </div>
    </div>
    
    <div class="chat-messages" ref="messagesContainer">
      <ChatMessage
        v-for="message in messages"
        :key="message.id"
        :message="message"
      />
    </div>
    
    <div class="chat-input-section">
      <input
        v-model="newMessage"
        @keypress.enter="sendMessage"
        type="text"
        placeholder="Type your message..."
        class="chat-input"
      />
      <button @click="sendMessage" class="send-button" :disabled="!newMessage.trim()">
        <svg class="send-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import ChatMessage from './ChatMessage.vue'
import type { ChatMessage as ChatMessageType } from '../types/chat'

const messages = ref<ChatMessageType[]>([
  {
    id: '1',
    sender: 'Veli Geli',
    content: 'Hello everyone!',
    timestamp: new Date(Date.now() - 5 * 60 * 1000)
  },
  {
    id: '2',
    sender: 'Mehmet Baki',
    content: 'Great to see you all here.',
    timestamp: new Date(Date.now() - 3 * 60 * 1000)
  },
  {
    id: '3',
    sender: 'Deniz Geli',
    content: 'Can everyone see my screen?',
    timestamp: new Date(Date.now() - 1 * 60 * 1000)
  }
])

const newMessage = ref('')
const messagesContainer = ref<HTMLElement>()

const sendMessage = () => {
  if (newMessage.value.trim()) {
    messages.value.push({
      id: Date.now().toString(),
      sender: 'You',
      content: newMessage.value.trim(),
      timestamp: new Date()
    })
    newMessage.value = ''
    
    nextTick(() => {
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
      }
    })
  }
}
</script>

<style scoped>
.chat-section {
  background: var(--vc-dark-surface);
  border-radius: 16px;
  box-shadow: var(--vc-shadow-medium);
  border: 1px solid var(--vc-dark-border-light);
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.chat-header {
  padding: 16px 18px;
  border-bottom: 1px solid var(--vc-dark-border-light);
  flex-shrink: 0;
  background: var(--vc-dark-bg-secondary);
  border-radius: 16px 16px 0 0;
}

.chat-title {
  font-size: clamp(14px, 2.5vw, 16px);
  font-weight: 600;
  color: var(--vc-text-primary);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.chat-icon {
  width: 18px;
  height: 18px;
  fill: var(--vc-accent-blue);
  flex-shrink: 0;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 14px 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
}

.chat-input-section {
  padding: 14px 18px;
  border-top: 1px solid var(--vc-dark-border-light);
  display: flex;
  gap: 10px;
  flex-shrink: 0;
  background: var(--vc-dark-bg-secondary);
  border-radius: 0 0 16px 16px;
}

.chat-input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid var(--vc-dark-border);
  border-radius: 24px;
  outline: none;
  font-size: clamp(12px, 2vw, 14px);
  transition: all 0.2s ease;
  min-height: 40px;
  background: var(--vc-dark-bg-primary);
  color: var(--vc-text-primary);
}

.chat-input::placeholder {
  color: var(--vc-text-muted);
}

.chat-input:focus {
  border-color: var(--vc-accent-blue);
  box-shadow: 0 0 0 3px rgba(138, 180, 248, 0.2);
}

.send-button {
  background: var(--vc-button-primary);
  color: white;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--vc-shadow-light);
  position: relative;
  overflow: hidden;
}

.send-button:hover:not(:disabled) {
  background: var(--vc-button-primary-hover);
  transform: translateY(-1px);
  box-shadow: var(--vc-shadow-medium);
}

.send-button:active:not(:disabled) {
  transform: translateY(0);
}

.send-button:disabled {
  background: var(--vc-dark-border);
  cursor: not-allowed;
  opacity: 0.5;
}

.send-button:disabled:hover {
  transform: none;
  box-shadow: var(--vc-shadow-light);
}

.send-icon {
  width: 16px;
  height: 16px;
  fill: currentColor;
  transition: transform 0.2s ease;
}

.send-button:hover:not(:disabled) .send-icon {
  transform: translateX(1px);
}

/* Ripple effect for send button */
.send-button::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: translate(-50%, -50%);
  transition: width 0.3s ease, height 0.3s ease;
}

.send-button:active:not(:disabled)::before {
  width: 40px;
  height: 40px;
}

@media (max-width: 1400px) {
  .chat-header,
  .chat-messages,
  .chat-input-section {
    padding-left: 16px;
    padding-right: 16px;
  }
  
  .chat-icon {
    width: 16px;
    height: 16px;
  }
}

@media (max-width: 1024px) {
  .chat-section {
    order: 3;
    max-height: 280px;
  }
  
  .chat-header,
  .chat-messages,
  .chat-input-section {
    padding-left: 14px;
    padding-right: 14px;
  }
  
  .chat-header {
    padding-top: 12px;
    padding-bottom: 12px;
  }
  
  .chat-messages {
    padding-top: 12px;
    padding-bottom: 12px;
  }
  
  .chat-input-section {
    padding-top: 12px;
    padding-bottom: 12px;
  }
}

@media (max-width: 768px) {
  .chat-section {
    max-height: 240px;
    border-radius: 12px;
  }
  
  .chat-header {
    border-radius: 12px 12px 0 0;
  }
  
  .chat-input-section {
    gap: 8px;
    border-radius: 0 0 12px 12px;
  }
  
  .chat-input {
    min-height: 36px;
    padding: 10px 14px;
    border-radius: 20px;
  }
  
  .send-button {
    width: 36px;
    height: 36px;
  }
  
  .send-icon {
    width: 14px;
    height: 14px;
  }
  
  .chat-icon {
    width: 14px;
    height: 14px;
  }
  
  .chat-title {
    gap: 8px;
  }
}
</style>