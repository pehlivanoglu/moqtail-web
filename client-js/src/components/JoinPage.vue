<template>
  <div class="join-container">
    <img src="@/assets/moqtail.svg" alt="MoqTail Logo" class="join-logo" />
    <div class="join-content">
      <nav class="join-nav">
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/about">About</RouterLink>
      </nav>
      <h1>MOQtail</h1>
      <h2>Join a Room</h2>
      <form @submit.prevent="joinRoom" class="join-form">
        <input
          v-model="userName"
          placeholder="Your Name"
          required
          autocomplete="off"
          class="join-input"
        />
        <input
          v-model="roomName"
          placeholder="Room Name"
          required
          autocomplete="off"
          class="join-input"
        />
        <button type="submit" class="join-button">Join</button>
      </form>
      <p v-if="error" class="error-message">{{ error }}</p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import { useSessionStore } from '@/stores/sessionStore'

const router = useRouter()
const sessionStore = useSessionStore()

const userName = ref('')
const roomName = ref('')
const error = ref('')

async function joinRoom() {
  error.value = ''
  try {
    await axios.post(
      'http://localhost:3001/join',
      { name: userName.value, room: roomName.value },
      { withCredentials: true }
    )

    sessionStore.setUser(userName.value)
    sessionStore.setRoom(roomName.value)

    router.push('/session')
  } catch (e: any) {
    error.value = e.response?.data?.error || 'Failed to join'
  }
}

onMounted(() => {
  //document.body.style.overflow = 'hidden'
})

onUnmounted(() => {
  //document.body.style.overflow = ''
})
</script>

<style scoped>
.join-container {
  min-height: 100vh;  /* Fill the whole screen */
  width: 100vw;           
  display: flex;
  flex-direction: row;
  align-items: center;         /* Vertically center content */
  justify-content: center;     /* Horizontally center content */
  padding: 2.5rem 4rem;       /* More generous padding for large screens */
  background: #f7f9fc;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  text-align: center;
  gap: 6rem;                   /* Reasonable space between logo and content */
  overflow: hidden;          /* Only if you are sure content fits */
}

.join-logo {
  width: 300px;
  height: auto;
  padding-top: 1rem;
}

.join-content {
  max-width: 360px;
  display: flex;
  flex-direction: column;
  align-items: center;  /* center text content horizontally */
  width: 100%;
}

h2 {
  font-family: 'MoqSemiBold', sans-serif;
  font-weight: 400;
  margin-bottom: 2rem;
  color: #34495e;
}

.join-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.join-input {
  padding: 0.8rem 1rem;
  font-size: 1.1rem;
  border: 1.8px solid #ddd;
  border-radius: 6px;
  background-color: transparent;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
  outline-offset: 2px;
}

.join-input:focus {
  border-color: #42b983;
  box-shadow: 0 0 8px rgba(66, 185, 131, 0.4);
}

.join-button {
  padding: 0.9rem 1rem;
  font-size: 1.15rem;
  font-weight: 600;
  background-color: #5f87af;
  border: none;
  border-radius: 6px;
  color: white;
  cursor: pointer;
  transition: background-color 0.25s ease;
}

.join-button:hover {
  background-color: #369f6e;
}

@font-face {
  font-family: 'MoqBold';
  src: url('@/assets/Bold.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
}

@font-face {
  font-family: 'MoqSemiBold';
  src: url('@/assets/SemiBold.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
}

h1 {
  font-family: 'MoqBold', sans-serif;
  font-size: 3rem;
  margin-bottom: 0.2rem;
  color: #2c3e50;
}

.error-message {
  color: #e74c3c;
  margin-top: 1rem;
  font-weight: 600;
}

/* Responsive: stack vertically on small screens */
@media (max-width: 600px) {
  .join-container {
    flex-direction: column;
  }

  .join-content {
    max-width: 100%;
  }

  .join-logo {
    padding-top: 0;
    margin-bottom: 1.5rem;
  }
}
</style>
