import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from '@google/genai';

// Audio Utility Functions
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const create_task_tool: FunctionDeclaration = {
  name: 'create_task',
  parameters: {
    type: Type.OBJECT,
    description: 'Register a new help request for an elder resident into the system.',
    properties: {
      description: {
        type: Type.STRING,
        description: 'A detailed description of what the elder needs help with.',
      },
    },
    required: ['description'],
  },
};

const VoiceAssistant: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [status, setStatus] = useState<'idle' | 'connecting' | 'listening' | 'speaking'>('idle');
  const [playbackProgress, setPlaybackProgress] = useState(0);
  
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<{ input: AudioContext; output: AudioContext } | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  
  const turnStartTimeRef = useRef<number | null>(null);
  const totalTurnDurationRef = useRef(0);
  const progressIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('civicbridge:voice-status-change', { 
      detail: { isActive, status } 
    }));
  }, [isActive, status]);

  const stopSession = () => {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    setStatus('idle');
    setPlaybackProgress(0);
    setTranscription('');
    if (sessionRef.current) sessionRef.current.close();
    sourcesRef.current.forEach(source => source.stop());
    sourcesRef.current.clear();
    setIsActive(false);
  };

  const startSession = async () => {
    setStatus('connecting');
    setIsActive(true);
    try {
      const ai = new GoogleGenAI({ apiKey: (process.env as any).API_KEY });
      const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = { input: inputAudioContext, output: outputAudioContext };
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setStatus('listening');
            const source = inputAudioContext.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) int16[i] = inputData[i] * 32768;
              const pcmBlob = { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
              sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContext.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.inputTranscription) {
              window.dispatchEvent(new CustomEvent('civicbridge:voice-input-transcription', { 
                detail: { text: message.serverContent.inputTranscription.text } 
              }));
            }
            if (message.serverContent?.outputTranscription) {
              setTranscription(prev => (prev.endsWith('.') || prev === '' ? prev : prev + ' ') + message.serverContent?.outputTranscription?.text);
            }
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              setStatus('speaking');
              const ctx = outputAudioContext;
              const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              source.onended = () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) setStatus('listening');
              };
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }
          },
          onerror: () => stopSession(),
          onclose: () => stopSession(),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {},
          inputAudioTranscription: {},
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
          tools: [{ functionDeclarations: [create_task_tool] }],
          systemInstruction: 'You are GenBridge Assistant. Listen carefully to elder residents and help them scribe help requests.',
        },
      });
      sessionRef.current = await sessionPromise;
    } catch (err) {
      stopSession();
    }
  };

  useEffect(() => {
    const handleToggle = () => isActive ? stopSession() : startSession();
    window.addEventListener('civicbridge:toggle-voice', handleToggle);
    return () => window.removeEventListener('civicbridge:toggle-voice', handleToggle);
  }, [isActive]);

  return (
    <div className="fixed bottom-12 right-12 z-50 flex flex-col items-end gap-6 pointer-events-none">
      {isActive && (
        <div className="bg-paper rounded-[40px] shadow-2xl border border-leaf/20 p-8 max-w-sm w-full pointer-events-auto animate-in slide-in-from-bottom-8 relative overflow-hidden">
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-3 h-3 rounded-full animate-pulse ${status === 'listening' ? 'bg-leaf' : 'bg-earth'}`} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-forest/40">{status}</span>
          </div>
          <p className="text-forest font-heading text-xl italic leading-tight">
            {transcription || "Listening for wisdom..."}
          </p>
        </div>
      )}

      <button
        onClick={isActive ? stopSession : startSession}
        className={`w-20 h-20 rounded-full pointer-events-auto flex items-center justify-center shadow-2xl border-4 border-paper transition-all active:scale-95 ${
          isActive ? 'bg-earth text-paper' : 'bg-forest text-paper hover:bg-leaf hover:text-forest'
        }`}
      >
        <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
          {isActive ? (
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          ) : (
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
          )}
        </svg>
      </button>
    </div>
  );
};

export default VoiceAssistant;