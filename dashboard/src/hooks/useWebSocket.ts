import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useLCIStore } from '../store/useLCIStore';
import { SpeechEngine } from '../audio/SpeechEngine';
import type { TTSSentencePayload } from '../audio/ProsodyTypes';

const SOCKET_URL = 'ws://localhost:3000';

export function useWebSocket() {
  const store = useLCIStore();

  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket'], reconnection: true });

    socket.on('connect', () => {
      store.setConnected(true);
      store.setCurrentThought('Connected to LCI backend.');
    });

    socket.on('disconnect', () => {
      store.setConnected(false);
      store.setCurrentThought('Connection lost. Reconnecting...');
    });

    socket.on('chemical_update', (data: { dopamine?: number; serotonin?: number; cortisol?: number; oxytocin?: number }) => {
      store.setChemicals(data);
    });

    socket.on('thought_stream', (data: { thought: string }) => {
      store.setCurrentThought(data.thought);
    });

    socket.on('memory_spark', (data: { id: string; title: string; type: 'episodic' | 'semantic' }) => {
      store.addMemorySpark({ ...data, timestamp: Date.now() });
    });

    socket.on('llm_token', (data: { token: string; done?: boolean }) => {
      if (data.done) {
        store.setIsSpeaking(false);
      } else {
        store.setIsSpeaking(true);
        store.appendStream(data.token);
      }
    });

    socket.on('cerebellum_log', (data: { entry: string }) => {
      store.addCerebellumLog(data.entry);
    });

    socket.on('status_update', (data: { status?: 'Awake' | 'Dreaming' | 'Offline'; persona?: string }) => {
      if (data.status) store.setStatus(data.status);
      if (data.persona) store.setPersona(data.persona);
    });

    socket.on('relationship_update', (data: { trust_score?: number; closeness_level?: number }) => {
      store.setRelationship(data);
    });

    socket.on('authority_request', (data: { id: string; command: string; path: string }) => {
      store.setPendingAuthority(data);
    });

    // Audio-Limbic TTS: Speak sentences with emotion-driven prosody
    socket.on('tts_sentence', (data: TTSSentencePayload) => {
      const engine = SpeechEngine.getInstance();
      const voiceEnabled = useLCIStore.getState().voiceEnabled;
      if (voiceEnabled) {
        engine.speak(data.text, data.prosody);
      }
    });

    // Dia TTS: Play HD Python generated Audio buffers
    socket.on('tts_audio_buffer', (data: { audioBase64: string; fallbackText: string; prosody: any }) => {
      const engine = SpeechEngine.getInstance();
      const voiceEnabled = useLCIStore.getState().voiceEnabled;
      if (voiceEnabled) {
        engine.speakBuffer(data.audioBase64, data.fallbackText, data.prosody);
      }
    });

    return () => { socket.disconnect(); };
  }, []);
}
