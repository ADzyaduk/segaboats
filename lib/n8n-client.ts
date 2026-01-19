// n8n Client for direct API calls
// Use this for more complex n8n integrations

export interface N8nWorkflow {
  id: string
  name: string
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface N8nExecution {
  id: string
  finished: boolean
  mode: string
  startedAt: string
  stoppedAt?: string
  workflowId: string
  status: 'success' | 'error' | 'waiting'
}

export class N8nClient {
  private baseUrl: string
  private apiKey: string

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '')
    this.apiKey = apiKey
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}/api/v1${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': this.apiKey,
        ...options.headers
      }
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`n8n API error: ${response.status} - ${error}`)
    }

    return response.json()
  }

  // Workflows
  async getWorkflows(): Promise<{ data: N8nWorkflow[] }> {
    return this.request('/workflows')
  }

  async getWorkflow(id: string): Promise<N8nWorkflow> {
    return this.request(`/workflows/${id}`)
  }

  async activateWorkflow(id: string): Promise<N8nWorkflow> {
    return this.request(`/workflows/${id}/activate`, { method: 'POST' })
  }

  async deactivateWorkflow(id: string): Promise<N8nWorkflow> {
    return this.request(`/workflows/${id}/deactivate`, { method: 'POST' })
  }

  // Executions
  async getExecutions(workflowId?: string): Promise<{ data: N8nExecution[] }> {
    const query = workflowId ? `?workflowId=${workflowId}` : ''
    return this.request(`/executions${query}`)
  }

  async getExecution(id: string): Promise<N8nExecution> {
    return this.request(`/executions/${id}`)
  }

  // Webhook trigger
  async triggerWebhook(
    webhookPath: string,
    data: Record<string, any>
  ): Promise<any> {
    const url = `${this.baseUrl}/webhook/${webhookPath}`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Webhook error: ${response.status} - ${error}`)
    }

    return response.json()
  }
}

// Factory function to create client from env
export function createN8nClient(): N8nClient | null {
  const baseUrl = process.env.N8N_WEBHOOK_URL
  const apiKey = process.env.N8N_API_KEY

  if (!baseUrl || !apiKey) {
    console.warn('n8n client: Missing configuration')
    return null
  }

  // Extract base URL (remove /webhook suffix if present)
  const cleanBaseUrl = baseUrl.replace(/\/webhook\/?$/, '')
  
  return new N8nClient(cleanBaseUrl, apiKey)
}
