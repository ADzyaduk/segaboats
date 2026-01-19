// Health check endpoint for Docker/Kubernetes

export default defineEventHandler(async () => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  }
})
