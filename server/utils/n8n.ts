// n8n Integration utilities

export interface N8nWebhookPayload {
  event: string
  data: Record<string, any>
  timestamp: string
}

export interface N8nResponse {
  success: boolean
  workflowId?: string
  executionId?: string
  error?: string
}

// Get n8n config from runtime config
function getN8nConfig() {
  const config = useRuntimeConfig()
  return {
    webhookUrl: config.n8nWebhookUrl,
    apiKey: config.n8nApiKey
  }
}

// Trigger n8n webhook
export async function triggerN8nWebhook(
  webhookPath: string,
  payload: Record<string, any>,
  options?: {
    timeout?: number
    retries?: number
  }
): Promise<N8nResponse> {
  const { timeout = 5000, retries = 0 } = options || {}
  
  try {
    const { webhookUrl, apiKey } = getN8nConfig()
    
    if (!webhookUrl) {
      console.warn('n8n webhook URL not configured')
      return { success: false, error: 'n8n not configured' }
    }

    // Clean webhook path (remove leading/trailing slashes)
    const cleanPath = webhookPath.replace(/^\/+|\/+$/g, '')
    const url = `${webhookUrl.replace(/\/+$/, '')}/${cleanPath}`
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'Boats2026/1.0'
    }
    
    if (apiKey) {
      headers['X-N8N-API-KEY'] = apiKey
    }

    // Create abort controller for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...payload,
          timestamp: new Date().toISOString()
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`n8n webhook error (${response.status}):`, errorText)
        
        // Retry on 5xx errors
        if (response.status >= 500 && retries > 0) {
          console.log(`Retrying n8n webhook (${retries} retries left)...`)
          await new Promise(resolve => setTimeout(resolve, 1000))
          return triggerN8nWebhook(webhookPath, payload, { timeout, retries: retries - 1 })
        }
        
        return { success: false, error: errorText || `HTTP ${response.status}` }
      }

      let result: any = {}
      try {
        result = await response.json()
      } catch {
        // n8n might return empty response
        result = {}
      }

      return {
        success: true,
        workflowId: result.workflowId,
        executionId: result.executionId || result.execution?.id
      }
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      
      if (fetchError.name === 'AbortError') {
        console.error('n8n webhook timeout')
        return { success: false, error: 'Request timeout' }
      }
      
      throw fetchError
    }
  } catch (error) {
    console.error('Error triggering n8n webhook:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

// Event-specific webhook triggers
export const n8nEvents = {
  // Booking events
  async onBookingCreated(booking: Record<string, any>): Promise<N8nResponse> {
    return triggerN8nWebhook('booking-created', {
      event: 'booking.created',
      data: booking
    })
  },

  async onBookingConfirmed(booking: Record<string, any>): Promise<N8nResponse> {
    return triggerN8nWebhook('booking-confirmed', {
      event: 'booking.confirmed',
      data: booking
    })
  },

  async onBookingCancelled(booking: Record<string, any>): Promise<N8nResponse> {
    return triggerN8nWebhook('booking-cancelled', {
      event: 'booking.cancelled',
      data: booking
    })
  },

  async onPaymentReceived(payment: Record<string, any>): Promise<N8nResponse> {
    return triggerN8nWebhook('payment-received', {
      event: 'payment.received',
      data: payment
    })
  },

  // User events
  async onUserRegistered(user: Record<string, any>): Promise<N8nResponse> {
    return triggerN8nWebhook('user-registered', {
      event: 'user.registered',
      data: user
    })
  },

  // Custom event
  async trigger(eventName: string, data: Record<string, any>): Promise<N8nResponse> {
    return triggerN8nWebhook(eventName, {
      event: eventName,
      data
    })
  },

  // Group trip events (for future use)
  async onGroupTripTicketPurchased(ticket: Record<string, any>): Promise<N8nResponse> {
    return triggerN8nWebhook('group-trip-ticket-purchased', {
      event: 'group-trip.ticket.purchased',
      data: ticket
    })
  },

  async onGroupTripTicketConfirmed(ticket: Record<string, any>): Promise<N8nResponse> {
    return triggerN8nWebhook('group-trip-ticket-confirmed', {
      event: 'group-trip.ticket.confirmed',
      data: ticket
    })
  },

  async onGroupTripTicketCancelled(ticket: Record<string, any>): Promise<N8nResponse> {
    return triggerN8nWebhook('group-trip-ticket-cancelled', {
      event: 'group-trip.ticket.cancelled',
      data: ticket
    })
  }
}
