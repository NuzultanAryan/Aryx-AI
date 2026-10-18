import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import config from '../config/index.js';

/**
 * AI Provider abstraction layer.
 * Supports Google Gemini and OpenAI (including compatible APIs like Groq, Ollama, OpenRouter).
 * To switch providers, set AI_PROVIDER=google or AI_PROVIDER=openai in .env.
 */

class GoogleProvider {
  constructor() {
    this.name = 'google';
    this.modelName = config.ai.model || 'gemini-1.5-flash';
    this.client = null;
    this.initialized = false;
    this.initError = null;
  }

  initialize() {
    const key = config.ai.apiKey?.trim();
    if (!key || key === 'your_api_key_here') {
      this.initError = 'AI_API_KEY belum dikonfigurasi. Silakan tambahkan API key yang valid di file .env server.';
      return false;
    }
    try {
      this.client = new GoogleGenerativeAI(key);
      this.initialized = true;
      this.initError = null;
      return true;
    } catch (err) {
      this.initError = `Gagal menginisialisasi Google AI client: ${err.message}`;
      return false;
    }
  }

  isReady() {
    return this.initialized && this.client !== null;
  }

  getStatus() {
    return {
      provider: this.name,
      model: this.modelName,
      ready: this.isReady(),
      error: this.initError || null,
    };
  }

  _buildContents(messages) {
    return messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));
  }

  async *chatStream(messages, systemPrompt, signal, modelOverride) {
    if (!this.isReady()) {
      throw new Error(this.initError || 'AI provider belum siap dikonfigurasi.');
    }

    const targetModel = modelOverride || this.modelName;
    const model = this.client.getGenerativeModel({
      model: targetModel,
      systemInstruction: systemPrompt,
    });

    const contents = this._buildContents(messages);

    const result = await model.generateContentStream({
      contents,
    });

    for await (const chunk of result.stream) {
      if (signal?.aborted) break;
      const text = chunk.text();
      if (text) {
        yield text;
      }
    }
  }
}

class OpenAIProvider {
  constructor() {
    this.name = 'openai';
    this.modelName = config.ai.model || 'gpt-4o-mini';
    this.client = null;
    this.initialized = false;
    this.initError = null;
  }

  initialize() {
    const key = config.ai.apiKey?.trim();
    if (!key || key === 'your_api_key_here') {
      this.initError = 'AI_API_KEY belum dikonfigurasi. Silakan tambahkan API key yang valid di file .env server.';
      return false;
    }
    try {
      this.client = new OpenAI({
        apiKey: key,
        baseURL: process.env.AI_BASE_URL || undefined,
      });
      this.initialized = true;
      this.initError = null;
      return true;
    } catch (err) {
      this.initError = `Gagal menginisialisasi OpenAI client: ${err.message}`;
      return false;
    }
  }

  isReady() {
    return this.initialized && this.client !== null;
  }

  getStatus() {
    return {
      provider: this.name,
      model: this.modelName,
      ready: this.isReady(),
      error: this.initError || null,
    };
  }

  async *chatStream(messages, systemPrompt, signal, modelOverride) {
    if (!this.isReady()) {
      throw new Error(this.initError || 'AI provider belum siap dikonfigurasi.');
    }

    const formattedMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({ role: m.role, content: m.content })),
    ];

    const stream = await this.client.chat.completions.create({
      model: modelOverride || this.modelName,
      messages: formattedMessages,
      stream: true,
    }, { signal });

    for await (const chunk of stream) {
      if (signal?.aborted) break;
      const text = chunk.choices[0]?.delta?.content || '';
      if (text) {
        yield text;
      }
    }
  }
}

// Factory
let providerInstance = null;

export function getProvider() {
  if (!providerInstance) {
    const providerName = (config.ai.provider || 'google').toLowerCase();
    switch (providerName) {
      case 'groq':
      case 'openai':
        providerInstance = new OpenAIProvider();
        break;
      case 'google':
      default:
        providerInstance = new GoogleProvider();
        break;
    }
    providerInstance.initialize();
  }
  return providerInstance;
}

export function getAvailableModels() {
  const provider = (config.ai.provider || 'google').toLowerCase();
  const isGroq = provider === 'groq' || (process.env.AI_BASE_URL && process.env.AI_BASE_URL.includes('groq'));

  if (isGroq) {
    return [
      { id: 'qwen/qwen3.8-27b', name: 'Qwen 3.8 27B (Rekomendasi - Cerdas & Cepat)', provider: 'groq' },
      { id: 'openai/gpt-oss-120b', name: 'GPT OSS 120B (Penalaran Mendalam)', provider: 'groq' },
      { id: 'openai/gpt-oss-20b', name: 'GPT OSS 20B (Respons Kilat)', provider: 'groq' },
    ];
  }

  switch (provider) {
    case 'google':
      return [
        { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Cepat & Hemat)', provider: 'google' },
        { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (Kemampuan Penalaran Tinggi)', provider: 'google' },
        { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Next-gen)', provider: 'google' },
      ];
    case 'openai':
      return [
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Cepat)', provider: 'openai' },
        { id: 'gpt-4o', name: 'GPT-4o (Kemampuan Penuh)', provider: 'openai' },
      ];
    default:
      return [{ id: config.ai.model, name: config.ai.model, provider }];
  }
}
