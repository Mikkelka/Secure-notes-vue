import { defineStore } from 'pinia'
import { ref } from 'vue'

let nextId = 1

export const useNotificationsStore = defineStore('notifications', () => {
  const items = ref([])

  const remove = (id) => {
    items.value = items.value.filter(item => item.id !== id)
  }

  const notify = (message, type = 'info', timeout = 4000) => {
    const id = nextId++
    items.value.push({ id, message, type })

    if (timeout > 0) {
      setTimeout(() => remove(id), timeout)
    }

    return id
  }

  return {
    items,
    notify,
    remove
  }
})
