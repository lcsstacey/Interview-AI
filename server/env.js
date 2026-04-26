import dotenv from 'dotenv';
dotenv.config();

export const env = {
  PORT: Number(process.env.PORT || 3001),
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  DEFAULT_PROVIDER: process.env.DEFAULT_PROVIDER || 'anthropic',
  DEFAULT_MODEL: process.env.DEFAULT_MODEL || 'claude-sonnet-4-6',
  WHISPER_MODEL: process.env.WHISPER_MODEL || 'whisper-1',
  NODE_ENV: process.env.NODE_ENV || 'development'
};

export const hasAnthropic = !!env.ANTHROPIC_API_KEY;
export const hasOpenAI = !!env.OPENAI_API_KEY;

export const MODELS = {
  anthropic: ['claude-opus-4-7', 'claude-sonnet-4-6', 'claude-haiku-4-5-20251001'],
  openai: ['gpt-4.1', 'gpt-4o', 'gpt-4o-mini']
};
