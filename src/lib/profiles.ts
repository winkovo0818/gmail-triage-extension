export type Profile = {
  id: string
  base_url: string
  api_key: string
  model: string
  headers?: Record<string, string>
  timeout?: number
  temperature?: number
  max_tokens?: number
}
