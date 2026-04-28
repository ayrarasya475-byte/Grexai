import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import { SYSTEM_PROMPT } from '../config';

interface AIRequest {
  model: 'puter' | 'gemini' | 'deepseek' | 'grok';
  messages: { role: 'user' | 'assistant' | 'system', content: string }[];
  apiKey?: string;
}

export async function askAI(request: AIRequest): Promise<string> {
  const { model, messages, apiKey } = request;

  const messagesWithSystem = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...messages
  ];

  if (model === 'gemini') {
    if (!apiKey) throw new Error("Gemini API Key is required");
    const ai = new GoogleGenAI({ apiKey });
    // Convert messages to Gemini format
    const contents = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : m.role === 'system' ? 'user' : 'user', // very rough mapping, simpler to just use generic content
      parts: [{ text: m.content }]
    }));
    
    // Better system prompt handling for Gemini GenAI SDK
    // Actually the new SDK supports systemInstruction on generation config
    const geminiMessages = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: geminiMessages,
      config: {
        systemInstruction: SYSTEM_PROMPT
      }
    });

    return response.text || '';
  }
  
  if (model === 'deepseek') {
    if (!apiKey) throw new Error("Deepseek API Key is required");
    const openai = new OpenAI({ apiKey, baseURL: 'https://api.deepseek.com', dangerouslyAllowBrowser: true });
    const response = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: messagesWithSystem as any,
    });
    return response.choices[0].message.content || '';
  }

  if (model === 'grok') {
    if (!apiKey) throw new Error("Grok API Key is required");
    const openai = new OpenAI({ apiKey, baseURL: 'https://api.x.ai/v1', dangerouslyAllowBrowser: true });
    // Assuming grok uses x.ai endpoint
    const response = await openai.chat.completions.create({
      model: 'grok-beta',
      messages: messagesWithSystem as any,
    });
    return response.choices[0].message.content || '';
  }

  if (model === 'puter') {
    // We'll use window.puter if it's available
    if (typeof (window as any).puter !== 'undefined') {
       try {
         // Puter ai.chat format
         const formattedMessages = messagesWithSystem.map(m => {
           // Puter takes objects for chat, maybe simple strings or OpenAI format
           return { role: m.role, content: m.content };
         });
         const resp = await (window as any).puter.ai.chat(formattedMessages);
         return resp.message.content;
       } catch (err) {
         console.error("Puter AI error:", err);
         return "Terjadi kesalahan pada Puter API. " + String(err);
       }
    }
    return "Puter.js tidak termuat atau tidak tersedia.";
  }

  throw new Error("Unknown model selected");
}
