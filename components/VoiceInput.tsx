'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  onInterimTranscript?: (text: string) => void;
  language?: string;
  className?: string;
}

export default function VoiceInput({
  onTranscript,
  onInterimTranscript,
  language = 'en-US',
  className = '',
}: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [interimText, setInterimText] = useState('');
  const [volume, setVolume] = useState(0);
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    // Check if speech recognition is supported
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (interimTranscript) {
        setInterimText(interimTranscript);
        onInterimTranscript?.(interimTranscript);
      }

      if (finalTranscript) {
        setInterimText('');
        onTranscript(finalTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        alert('Microphone access denied. Please allow microphone access.');
      }
      setIsListening(false);
      stopVisualization();
    };

    recognition.onend = () => {
      if (isListening) {
        // Restart if still supposed to be listening
        try {
          recognition.start();
        } catch (e) {
          setIsListening(false);
          stopVisualization();
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
      stopVisualization();
    };
  }, [language, onTranscript, onInterimTranscript, isListening]);

  // Audio visualization
  const startVisualization = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;

      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

      const updateVolume = () => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          setVolume(average / 255);
          animationRef.current = requestAnimationFrame(updateVolume);
        }
      };

      updateVolume();
    } catch (e) {
      console.error('Could not start audio visualization:', e);
    }
  };

  const stopVisualization = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setVolume(0);
  };

  const toggleListening = useCallback(async () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      setInterimText('');
      stopVisualization();
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        await startVisualization();
      } catch (e) {
        console.error('Could not start recognition:', e);
      }
    }
  }, [isListening]);

  if (!isSupported) {
    return (
      <button
        disabled
        className={`p-2 rounded-lg bg-gray-700 text-gray-500 cursor-not-allowed ${className}`}
        title="Voice input not supported in this browser"
      >
        🎤
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={toggleListening}
        className={`relative p-3 rounded-full transition-all duration-300 ${
          isListening
            ? 'bg-red-500 hover:bg-red-600 animate-pulse'
            : 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600'
        } text-white ${className}`}
        title={isListening ? 'Stop listening' : 'Start voice input'}
      >
        {/* Pulse animation when listening */}
        {isListening && (
          <>
            <span
              className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-30"
              style={{ animationDuration: '1.5s' }}
            />
            <span
              className="absolute inset-0 rounded-full bg-red-500"
              style={{
                transform: `scale(${1 + volume * 0.5})`,
                opacity: 0.3,
                transition: 'transform 0.1s ease-out',
              }}
            />
          </>
        )}
        
        <span className="relative z-10 text-xl">
          {isListening ? '⏹️' : '🎤'}
        </span>
      </button>

      {/* Interim transcript tooltip */}
      {isListening && interimText && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 rounded-lg text-sm text-gray-300 whitespace-nowrap max-w-xs truncate shadow-lg">
          <span className="text-blue-400">🎤 </span>
          {interimText}
        </div>
      )}

      {/* Listening indicator */}
      {isListening && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-1 bg-red-400 rounded-full transition-all duration-100"
              style={{
                height: `${Math.max(4, volume * 20 * (1 + Math.sin(Date.now() / 100 + i)))}px`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
