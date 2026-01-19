// Universal n8n webhook endpoint
// Handles all n8n webhook events dynamically

import { triggerN8nWebhook } from '~~/server/utils/n8n'

export default defineEventHandler(async (event) => {
  try {
    const eventName = getRouterParam(event, 'event')
    const body = await readBody(event)

    if (!eventName) {
      throw createError({
        statusCode: 400,
        message: 'Event name is required'
      })
    }

    // Trigger n8n webhook
    const result = await triggerN8nWebhook(eventName, {
      event: eventName,
      data: body,
      timestamp: new Date().toISOString()
    })

    if (!result.success) {
      console.error(`n8n webhook failed for event ${eventName}:`, result.error)
      // Don't throw error - webhook failures shouldn't break the main flow
      return {
        success: false,
        error: result.error,
        message: 'Webhook triggered but may have failed'
      }
    }

    return {
      success: true,
      event: eventName,
      workflowId: result.workflowId,
      executionId: result.executionId
    }
  } catch (error) {
    console.error('Error in n8n webhook endpoint:', error)
    
    if (error instanceof Error && 'statusCode' in error) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: 'Error processing webhook'
    })
  }
})
