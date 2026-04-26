import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useStore = create(
  persist(
    (set, get) => ({
      // ── config from server ──
      config: null,
      provider: 'anthropic',
      model: 'claude-sonnet-4-6',
      setProvider: (provider) => {
        const list = get().config?.models?.[provider] || [];
        set({ provider, model: list[0] || get().model });
      },
      setModel: (model) => set({ model }),

      // ── resume + notes ──
      resume: { name: '', text: '' },
      notes: { name: '', text: '' },
      stories: [], // [{title, situation, task, action, result}]
      setResume: (resume) => set({ resume }),
      setNotes: (notes) => set({ notes }),
      addStory: (story) => set({ stories: [...get().stories, { id: crypto.randomUUID(), ...story }] }),
      removeStory: (id) => set({ stories: get().stories.filter((s) => s.id !== id) }),

      // ── sessions history (for dashboard) ──
      sessions: [], // [{id, kind, mode, startedAt, endedAt, transcript, summary, questionCount}]
      saveSession: (session) =>
        set({ sessions: [{ id: crypto.randomUUID(), ...session }, ...get().sessions].slice(0, 50) }),
      removeSession: (id) => set({ sessions: get().sessions.filter((s) => s.id !== id) }),
      clearSessions: () => set({ sessions: [] }),

      // ── transient (not persisted) ──
      lastSummary: '',
      setLastSummary: (lastSummary) => set({ lastSummary }),

      loadConfig: async () => {
        try {
          const res = await fetch('/api/config');
          const config = await res.json();
          const provider =
            get().provider && config.providers[get().provider] ? get().provider : config.defaultProvider;
          const model = config.models[provider]?.includes(get().model)
            ? get().model
            : config.models[provider]?.[0] || config.defaultModel;
          set({ config, provider, model });
        } catch (e) {
          console.error('Failed to load config', e);
        }
      }
    }),
    {
      name: 'interview-studio-store',
      partialize: (s) => ({
        provider: s.provider,
        model: s.model,
        resume: s.resume,
        notes: s.notes,
        stories: s.stories,
        sessions: s.sessions
      })
    }
  )
);
