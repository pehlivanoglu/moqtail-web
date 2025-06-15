import { defineStore } from 'pinia'

interface User {
  name: string
}

export const useSessionStore = defineStore('session', {
  state: () => ({
    roomName: '' as string,
    userName: '' as string,
    usersInRoom: [] as User[],
  }),
  actions: {
    setRoom(name: string) {
      this.roomName = name
    },
    setUser(name: string) {
      this.userName = name
    },
    setUsers(users: User[]) {
      this.usersInRoom = users
    },
    addUser(user: User) {
      this.usersInRoom.push(user)
    },
    removeUser(userName: string) {
      this.usersInRoom = this.usersInRoom.filter(u => u.name !== userName)
    },
    clear() {
      this.roomName = ''
      this.userName = ''
      this.usersInRoom = []
    }
  },
  getters: {
    userCount: (state): number => state.usersInRoom.length,
  }
})
