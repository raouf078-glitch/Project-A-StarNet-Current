export const push = {
  async requestPermission() {
    return 'denied'
  },

  async subscribe() {
    return null
  },

  async schedule() {
    return null
  },

  async cancelSchedule() {
    return true
  },

  async diagnose() {
    return { supported: false, permission: 'denied', subscribed: false }
  },
}
