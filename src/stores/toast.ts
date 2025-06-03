// stores/toast.ts
import { defineStore } from 'pinia'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: number
  message: string
  type: ToastType
  timeout?: number
}

export const useToastStore = defineStore('toast', {
  state: () => ({
    toasts: [] as Toast[],
    nextId: 0
  }),
  actions: {
    addToast(message: string, type: ToastType = 'info', timeout: number = 5000) {
      const id = this.nextId++
      this.toasts.push({ id, message, type, timeout })
      
      if (timeout > 0) {
        setTimeout(() => {
          this.removeToast(id)
        }, timeout)
      }
    },
    removeToast(id: number) {
      this.toasts = this.toasts.filter(toast => toast.id !== id)
    },
    success(message: string, timeout?: number) {
      this.addToast(message, 'success', timeout)
    },
    error(message: string, timeout?: number) {
      this.addToast(message, 'error', timeout)
    },
    warning(message: string, timeout?: number) {
      this.addToast(message, 'warning', timeout)
    },
    info(message: string, timeout?: number) {
      this.addToast(message, 'info', timeout)
    },
    clearAll() {
      this.toasts = []
    }
  }
})