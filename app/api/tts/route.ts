import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { text, lang = 'en' } = await req.json()
    
    if (!text || text.length === 0) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 })
    }
    
    // Limit text length
    const limitedText = text.slice(0, 500)
    
    // Use Google Translate TTS
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(limitedText)}&tl=${lang}&client=tw-ob`
    
    const response = await fetch(ttsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://translate.google.com/'
      }
    })
    
    if (!response.ok) {
      // Fallback: Try VoiceRSS free API (limited but works)
      const voiceRssUrl = `https://api.voicerss.org/?key=demo&hl=${lang === 'ar' ? 'ar-sa' : 'en-us'}&src=${encodeURIComponent(limitedText)}&c=MP3`
      
      const fallbackResponse = await fetch(voiceRssUrl)
      
      if (!fallbackResponse.ok) {
        return NextResponse.json({ error: 'TTS failed' }, { status: 500 })
      }
      
      const audioData = await fallbackResponse.arrayBuffer()
      
      return new NextResponse(audioData, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Disposition': 'attachment; filename="audio.mp3"'
        }
      })
    }
    
    const audioData = await response.arrayBuffer()
    
    return new NextResponse(audioData, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': 'attachment; filename="audio.mp3"'
      }
    })
    
  } catch (error) {
    console.error('TTS Error:', error)
    return NextResponse.json({ error: 'TTS conversion failed' }, { status: 500 })
  }
}
