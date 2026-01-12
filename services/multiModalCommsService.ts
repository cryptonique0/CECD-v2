// multiModalCommsService.ts
// Multi-modal communication: voice, video, SMS, push-to-talk, translation

export type CommMode = 'voice' | 'video' | 'sms' | 'pushToTalk' | 'text' | 'translation';

export interface CommMessage {
  id: string;
  mode: CommMode;
  from: string;
  to: string;
  content: string;
  timestamp: number;
  language?: string;
  mediaUrl?: string;
  translatedContent?: string;
}

class MultiModalCommsService {
  private messages: CommMessage[] = [];

  sendMessage(mode: CommMode, from: string, to: string, content: string, language?: string, mediaUrl?: string): CommMessage {
    const msg: CommMessage = {
      id: `comm-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      mode,
      from,
      to,
      content,
      timestamp: Date.now(),
      language,
      mediaUrl
    };
    this.messages.push(msg);
    return msg;
  }

  getMessages(to: string): CommMessage[] {
    return this.messages.filter(m => m.to === to);
  }

  // AI-powered translation (stub)
  async translateMessage(content: string, fromLang: string, toLang: string): Promise<string> {
    // TODO: Integrate Gemini/OpenAI translation API
    return `[${toLang}] ${content}`;
  }

  // Push-to-talk (stub)
  sendPushToTalk(from: string, to: string, audioUrl: string): CommMessage {
    return this.sendMessage('pushToTalk', from, to, '', undefined, audioUrl);
  }

  // Voice (stub)
  sendVoice(from: string, to: string, audioUrl: string): CommMessage {
    return this.sendMessage('voice', from, to, '', undefined, audioUrl);
  }

  // Video (stub)
  sendVideo(from: string, to: string, videoUrl: string): CommMessage {
    return this.sendMessage('video', from, to, '', undefined, videoUrl);
  }

  // SMS (stub)
  sendSMS(from: string, to: string, content: string): CommMessage {
    return this.sendMessage('sms', from, to, content);
  }
}

export const multiModalCommsService = new MultiModalCommsService();
