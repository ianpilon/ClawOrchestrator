import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { NodeData } from '@/lib/mockData';

interface VoiceAIProps {
  peopleData: NodeData[];
  onPersonFound: (person: NodeData) => void;
}

export function VoiceAI({ peopleData, onPersonFound }: VoiceAIProps) {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [status, setStatus] = useState('Ready - tap to start');

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const playbackContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<ArrayBuffer[]>([]);
  const isPlayingRef = useRef(false);

  const checkForProfileRequest = useCallback((text: string) => {
    const patterns = [
      /(?:show me|display|pull up|find)\s+([a-z\s]+?)(?:'s|\s+profile|\s*$|\.)/i,
      /(?:tell me about|who is)\s+([a-z\s]+?)(?:'s|\s*$|\.)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const requestedName = match[1].trim().toLowerCase();
        if (requestedName.length < 2) continue;

        const person = peopleData.find(p => {
          const fullName = p.name.toLowerCase();
          const firstName = p.name.split(' ')[0].toLowerCase();
          const lastName = p.name.split(' ').pop()?.toLowerCase() || '';

          return requestedName.includes(firstName) ||
                 requestedName.includes(lastName) ||
                 fullName.includes(requestedName);
        });

        if (person) {
          setTimeout(() => {
            onPersonFound(person);
            setStatus(`Found: ${person.name}`);
          }, 600);
          return true;
        }
      }
    }
    return false;
  }, [peopleData, onPersonFound]);

  const floatTo16BitPCM = (float32Array: Float32Array): Int16Array => {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return int16Array;
  };

  const playAudioChunk = useCallback(async (base64Audio: string) => {
    try {
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      if (!playbackContextRef.current) {
        playbackContextRef.current = new AudioContext({ sampleRate: 24000 });
      }

      const int16Array = new Int16Array(bytes.buffer);
      const float32Array = new Float32Array(int16Array.length);
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768;
      }

      const audioBuffer = playbackContextRef.current.createBuffer(1, float32Array.length, 24000);
      audioBuffer.getChannelData(0).set(float32Array);

      audioQueueRef.current.push(audioBuffer as unknown as ArrayBuffer);

      if (!isPlayingRef.current) {
        playNextInQueue();
      }
    } catch (err) {
      console.error('Audio playback error:', err);
    }
  }, []);

  const playNextInQueue = useCallback(() => {
    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      return;
    }

    isPlayingRef.current = true;
    const audioBuffer = audioQueueRef.current.shift() as unknown as AudioBuffer;

    if (playbackContextRef.current) {
      const source = playbackContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(playbackContextRef.current.destination);
      source.onended = () => playNextInQueue();
      source.start();
    }
  }, []);

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);

      if (data.type === 'session.ready') {
        setStatus('Listening...');
        setIsConnecting(false);
      }

      if (data.type === 'response.audio_transcript.delta' || 
          data.type === 'response.output_audio_transcript.delta' ||
          data.type === 'transcript.delta') {
        const newText = data.delta || data.text || '';
        setTranscript(prev => {
          const updated = prev + newText;
          checkForProfileRequest(updated);
          return updated;
        });
      }

      if ((data.type === 'response.audio.delta' || data.type === 'audio.delta') && (data.delta || data.audio)) {
        playAudioChunk(data.delta || data.audio);
      }

      if (data.type === 'input_audio_buffer.speech_started' || data.type === 'speech.started') {
        setStatus('Hearing you...');
        setTranscript('');
      }

      if (data.type === 'input_audio_buffer.speech_stopped' || data.type === 'speech.stopped') {
        setStatus('Processing...');
      }

      if (data.type === 'response.done' || data.type === 'response.completed') {
        setStatus('Listening...');
      }

      if (data.type === 'session.created' || data.type === 'session.updated') {
        setStatus('Connected');
      }

      if (data.type === 'error') {
        console.error('xAI error:', data.error);
        setStatus('Error - try again');
      }
    } catch (err) {
      console.error('Message parse error:', err);
    }
  }, [checkForProfileRequest, playAudioChunk]);

  const startAudioCapture = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        }
      });

      mediaStreamRef.current = stream;
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });

      const source = audioContextRef.current.createMediaStreamSource(stream);
      processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);

      processorRef.current.onaudioprocess = (e) => {
        const float32 = e.inputBuffer.getChannelData(0);
        const int16 = floatTo16BitPCM(float32);

        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(int16.buffer);
        }
      };

      source.connect(processorRef.current);
      processorRef.current.connect(audioContextRef.current.destination);
    } catch (err) {
      console.error('Audio capture error:', err);
      setStatus('Mic access denied');
      throw err;
    }
  }, []);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    setStatus('Connecting...');

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/voice`;

    wsRef.current = new WebSocket(wsUrl);
    wsRef.current.onmessage = handleMessage;

    wsRef.current.onopen = async () => {
      try {
        await startAudioCapture();
      } catch {
        wsRef.current?.close();
        setIsActive(false);
        setIsConnecting(false);
      }
    };

    wsRef.current.onerror = (err) => {
      console.error('WebSocket error:', err);
      setStatus('Connection failed');
      setIsConnecting(false);
      setIsActive(false);
    };

    wsRef.current.onclose = () => {
      setStatus('Disconnected');
      setIsActive(false);
      setIsConnecting(false);
    };
  }, [handleMessage, startAudioCapture]);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    audioContextRef.current?.close();
    playbackContextRef.current?.close();
    mediaStreamRef.current?.getTracks().forEach(track => track.stop());

    wsRef.current = null;
    audioContextRef.current = null;
    playbackContextRef.current = null;
    mediaStreamRef.current = null;
    processorRef.current = null;
    audioQueueRef.current = [];
    isPlayingRef.current = false;

    setIsActive(false);
    setTranscript('');
    setStatus('Ready - tap to start');
  }, []);

  const toggleVoice = async () => {
    if (isActive || isConnecting) {
      disconnect();
    } else {
      setIsActive(true);
      await connect();
    }
  };

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return (
    <div className="hud-panel p-3 w-56 relative flex flex-col">
      <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-primary/50" />
      <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-primary/50" />
      <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-primary/50" />
      <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-primary/50" />
      
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-6 h-6 border flex items-center justify-center flex-shrink-0 transition-colors ${isActive ? 'bg-emerald-500/30 border-emerald-500/50' : 'bg-primary/20 border-primary/30'}`}>
          {isActive ? <Volume2 className="w-3 h-3 text-emerald-400" /> : <Mic className="w-3 h-3 text-primary" />}
        </div>
        <div className="flex items-center gap-1.5">
          <img src="/xai-logo.png" alt="xAI" className="h-3 w-auto opacity-70" />
          <span className="text-xs font-mono text-foreground uppercase tracking-wide">Voice AI</span>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col justify-center">
        <div className="flex items-center gap-2 py-2 px-2 bg-black/30 border border-white/5 mb-2">
          <div className={`w-2 h-2 flex-shrink-0 ${isActive ? 'bg-emerald-500 animate-pulse' : isConnecting ? 'bg-yellow-500 animate-pulse' : 'bg-emerald-500/80'}`} />
          <span className="text-[11px] font-mono text-muted-foreground truncate">{status}</span>
        </div>

        {transcript && (
          <div className="py-1.5 px-2 bg-black/20 border border-white/5 mb-2 max-h-12 overflow-y-auto">
            <span className="text-[10px] font-mono text-primary/80 leading-tight">{transcript}</span>
          </div>
        )}
        
        <Button 
          onClick={toggleVoice}
          disabled={isConnecting}
          className={`w-full font-mono uppercase text-[10px] rounded-none h-8 transition-all ${
            isActive 
              ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 hover:border-red-500/50' 
              : 'bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 hover:border-primary/50'
          }`}
          data-testid="button-voice-start"
        >
          {isActive ? <MicOff className="w-3 h-3 mr-2" /> : <Mic className="w-3 h-3 mr-2" />}
          {isConnecting ? 'Connecting...' : isActive ? 'Stop' : 'Start'}
        </Button>
      </div>
      
      <div className="mt-2 text-center">
        <span className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-widest">
          Powered by Grok Voice AI
        </span>
      </div>
    </div>
  );
}
