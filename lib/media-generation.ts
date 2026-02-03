// ============================================
// 8. IMAGE & VIDEO GENERATION SERVICES
// ============================================

export interface ImageGenerationOptions {
  prompt: string
  negativePrompt?: string
  width?: number
  height?: number
  steps?: number
  guidance?: number
  seed?: number
  style?: string
  model?: string
}

export interface VideoGenerationOptions {
  prompt: string
  imageUrl?: string  // For image-to-video
  duration?: number  // seconds
  fps?: number
  aspectRatio?: '16:9' | '9:16' | '1:1'
  model?: string
}

export interface GeneratedMedia {
  id: string
  type: 'image' | 'video'
  url: string
  thumbnail?: string
  prompt: string
  metadata: Record<string, any>
  createdAt: string
}

// Image Generation Providers
export const imageProviders = {
  // FREE - Pollinations.ai (No API key required!)
  pollinations: {
    name: 'Pollinations (FREE)',
    models: ['flux', 'flux-realism', 'flux-anime', 'flux-3d', 'turbo'],
    generate: async (options: ImageGenerationOptions, _apiKey?: string): Promise<string> => {
      // Pollinations is completely FREE - no API key needed!
      const width = options.width || 1024;
      const height = options.height || 1024;
      const model = options.model || 'flux';
      const seed = options.seed || Math.floor(Math.random() * 1000000);
      
      // Build URL with encoded prompt
      const encodedPrompt = encodeURIComponent(options.prompt);
      const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&model=${model}&seed=${seed}&nologo=true`;
      
      // Fetch to verify it works (also triggers generation)
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to generate image with Pollinations');
      }
      
      return url;
    }
  },

  // OpenAI DALL-E
  dalle: {
    name: 'DALL-E 3',
    models: ['dall-e-3', 'dall-e-2'],
    generate: async (options: ImageGenerationOptions, apiKey: string): Promise<string> => {
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: options.model || 'dall-e-3',
          prompt: options.prompt,
          n: 1,
          size: `${options.width || 1024}x${options.height || 1024}`,
          quality: 'standard',
          response_format: 'url'
        })
      })
      const data = await response.json()
      if (data.error) throw new Error(data.error.message)
      return data.data[0].url
    }
  },

  // Google Gemini Imagen 3
  gemini: {
    name: 'Gemini Imagen 3',
    models: ['imagen-3.0-generate-002'],
    generate: async (options: ImageGenerationOptions, apiKey: string): Promise<string> => {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [{ prompt: options.prompt }],
          parameters: {
            sampleCount: 1,
            aspectRatio: options.width === options.height ? '1:1' : 
                         (options.width || 1024) > (options.height || 1024) ? '16:9' : '9:16'
          }
        })
      })
      const data = await response.json()
      if (data.error) throw new Error(data.error.message || 'Gemini image generation failed')
      return `data:image/png;base64,${data.predictions[0].bytesBase64Encoded}`
    }
  },

  // Stability AI
  stability: {
    name: 'Stable Diffusion',
    models: ['stable-diffusion-xl-1024-v1-0', 'stable-diffusion-v1-6'],
    generate: async (options: ImageGenerationOptions, apiKey: string): Promise<string> => {
      const response = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text_prompts: [
            { text: options.prompt, weight: 1 },
            ...(options.negativePrompt ? [{ text: options.negativePrompt, weight: -1 }] : [])
          ],
          cfg_scale: options.guidance || 7,
          width: options.width || 1024,
          height: options.height || 1024,
          steps: options.steps || 30,
          seed: options.seed
        })
      })
      const data = await response.json()
      return `data:image/png;base64,${data.artifacts[0].base64}`
    }
  },

  // Google Imagen (via Vertex AI)
  imagen: {
    name: 'Google Imagen',
    models: ['imagegeneration@006'],
    generate: async (options: ImageGenerationOptions, apiKey: string): Promise<string> => {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [{ prompt: options.prompt }],
          parameters: {
            sampleCount: 1,
            aspectRatio: options.width === options.height ? '1:1' : '16:9'
          }
        })
      })
      const data = await response.json()
      return `data:image/png;base64,${data.predictions[0].bytesBase64Encoded}`
    }
  },

  // Replicate (multiple models)
  replicate: {
    name: 'Replicate',
    models: ['flux-schnell', 'flux-dev', 'sdxl'],
    generate: async (options: ImageGenerationOptions, apiKey: string): Promise<string> => {
      // Start prediction
      const response = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          version: getReplicateVersion(options.model || 'flux-schnell'),
          input: {
            prompt: options.prompt,
            negative_prompt: options.negativePrompt,
            width: options.width || 1024,
            height: options.height || 1024,
            num_inference_steps: options.steps || 28
          }
        })
      })
      
      const prediction = await response.json()
      
      // Poll for result
      let result = prediction
      while (result.status !== 'succeeded' && result.status !== 'failed') {
        await new Promise(r => setTimeout(r, 1000))
        const pollResponse = await fetch(result.urls.get, {
          headers: { 'Authorization': `Token ${apiKey}` }
        })
        result = await pollResponse.json()
      }
      
      if (result.status === 'failed') throw new Error('Image generation failed')
      return Array.isArray(result.output) ? result.output[0] : result.output
    }
  }
}

// Video Generation Providers
export const videoProviders = {
  // Runway Gen-3
  runway: {
    name: 'Runway Gen-3',
    models: ['gen3a_turbo'],
    generate: async (options: VideoGenerationOptions, apiKey: string): Promise<string> => {
      const response = await fetch('https://api.runwayml.com/v1/generation', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          promptText: options.prompt,
          model: 'gen3a_turbo',
          duration: options.duration || 5,
          ratio: options.aspectRatio || '16:9',
          ...(options.imageUrl && { promptImage: options.imageUrl })
        })
      })
      
      const task = await response.json()
      
      // Poll for completion
      while (true) {
        const statusResponse = await fetch(`https://api.runwayml.com/v1/tasks/${task.id}`, {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        })
        const status = await statusResponse.json()
        
        if (status.status === 'SUCCEEDED') return status.output[0]
        if (status.status === 'FAILED') throw new Error('Video generation failed')
        await new Promise(r => setTimeout(r, 5000))
      }
    }
  },

  // Replicate Video Models
  replicate: {
    name: 'Replicate Video',
    models: ['stable-video-diffusion', 'animate-diff'],
    generate: async (options: VideoGenerationOptions, apiKey: string): Promise<string> => {
      const response = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          version: 'stable-video-diffusion',
          input: {
            input_image: options.imageUrl,
            motion_bucket_id: 127,
            fps: options.fps || 7,
            cond_aug: 0.02
          }
        })
      })
      
      const prediction = await response.json()
      
      // Poll for result
      let result = prediction
      while (result.status !== 'succeeded' && result.status !== 'failed') {
        await new Promise(r => setTimeout(r, 3000))
        const pollResponse = await fetch(result.urls.get, {
          headers: { 'Authorization': `Token ${apiKey}` }
        })
        result = await pollResponse.json()
      }
      
      if (result.status === 'failed') throw new Error('Video generation failed')
      return result.output
    }
  },

  // Pika Labs
  pika: {
    name: 'Pika',
    models: ['pika-1.0'],
    generate: async (options: VideoGenerationOptions, apiKey: string): Promise<string> => {
      // Pika API integration
      const response = await fetch('https://api.pika.art/v1/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: options.prompt,
          aspect_ratio: options.aspectRatio,
          seed: Math.floor(Math.random() * 1000000)
        })
      })
      const data = await response.json()
      return data.video_url
    }
  }
}

// Helper functions
function getReplicateVersion(model: string): string {
  const versions: Record<string, string> = {
    'flux-schnell': 'black-forest-labs/flux-schnell',
    'flux-dev': 'black-forest-labs/flux-dev',
    'sdxl': 'stability-ai/sdxl'
  }
  return versions[model] || model
}

// Media Generation Manager
export class MediaGenerator {
  private history: GeneratedMedia[] = []

  async generateImage(
    provider: keyof typeof imageProviders,
    options: ImageGenerationOptions,
    apiKey: string
  ): Promise<GeneratedMedia> {
    const providerConfig = imageProviders[provider]
    const url = await providerConfig.generate(options, apiKey)
    
    const media: GeneratedMedia = {
      id: crypto.randomUUID(),
      type: 'image',
      url,
      prompt: options.prompt,
      metadata: { provider, ...options },
      createdAt: new Date().toISOString()
    }
    
    this.history.push(media)
    return media
  }

  async generateVideo(
    provider: keyof typeof videoProviders,
    options: VideoGenerationOptions,
    apiKey: string
  ): Promise<GeneratedMedia> {
    const providerConfig = videoProviders[provider]
    const url = await providerConfig.generate(options, apiKey)
    
    const media: GeneratedMedia = {
      id: crypto.randomUUID(),
      type: 'video',
      url,
      prompt: options.prompt,
      metadata: { provider, ...options },
      createdAt: new Date().toISOString()
    }
    
    this.history.push(media)
    return media
  }

  getHistory(): GeneratedMedia[] {
    return this.history
  }

  clearHistory(): void {
    this.history = []
  }
}

