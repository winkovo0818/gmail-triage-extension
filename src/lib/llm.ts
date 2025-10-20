import { Profile } from './profiles'

export type LLMRequestOptions = {
  timeout?: number
  temperature?: number
  max_tokens?: number
  headers?: Record<string, string>
}

export type LLMResponse = {
  text: string
}

export interface LLMClient {
  generate(prompt: string, options?: LLMRequestOptions): Promise<LLMResponse>
}

export function createLLMClient(profile: Profile): LLMClient {
  return {
    async generate(prompt: string, options?: LLMRequestOptions): Promise<LLMResponse> {
      // Placeholder implementation - no network calls
      const meta = {
        base_url: profile.base_url,
        model: profile.model,
        temperature: options?.temperature ?? profile.temperature,
        max_tokens: options?.max_tokens ?? profile.max_tokens
      }
      return Promise.resolve({ text: `LLM stub. Prompt length: ${prompt.length}. Using ${JSON.stringify(meta)}` })
    }
  }
}
