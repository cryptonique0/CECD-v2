import { v4 as uuidv4 } from 'crypto-js';

export interface ChatMessage {
  id: string;
  incidentId: string;
  userId: string;
  userName: string;
  userRole: string;
  message: string;
  timestamp: number;
  attachments?: {
    type: 'image' | 'document' | 'location' | 'resource';
    url: string;
    name: string;
  }[];
  isEdited?: boolean;
  editedAt?: number;
  reactions?: Record<string, string[]>; // emoji -> userIds
}

export interface ChatChannel {
  id: string;
  incidentId: string;
  name: string;
  description: string;
  createdAt: number;
  members: string[]; // userIds
  isPrivate: boolean;
  category: 'general' | 'operations' | 'logistics' | 'medical' | 'security';
}

interface ChatService {
  createChannel(incidentId: string, name: string, category: ChatChannel['category'], members: string[]): ChatChannel;
  sendMessage(incidentId: string, channelId: string, userId: string, userName: string, userRole: string, message: string): ChatMessage;
  editMessage(messageId: string, newContent: string): ChatMessage | null;
  deleteMessage(messageId: string): boolean;
  addReaction(messageId: string, emoji: string, userId: string): void;
  removeReaction(messageId: string, emoji: string, userId: string): void;
  getChannelMessages(channelId: string): ChatMessage[];
  getIncidentChannels(incidentId: string): ChatChannel[];
  addMemberToChannel(channelId: string, userId: string): void;
  removeMemberFromChannel(channelId: string, userId: string): void;
  searchMessages(incidentId: string, query: string): ChatMessage[];
}

class ChatServiceImpl implements ChatService {
  private messages: Map<string, ChatMessage[]> = new Map();
  private channels: Map<string, ChatChannel[]> = new Map();

  createChannel(incidentId: string, name: string, category: ChatChannel['category'], members: string[]): ChatChannel {
    const channel: ChatChannel = {
      id: `ch-${uuidv4()}`,
      incidentId,
      name,
      description: `${category} channel for incident ${incidentId}`,
      createdAt: Date.now(),
      members,
      isPrivate: category !== 'general',
      category,
    };

    if (!this.channels.has(incidentId)) {
      this.channels.set(incidentId, []);
    }
    this.channels.get(incidentId)!.push(channel);
    this.messages.set(channel.id, []);
    return channel;
  }

  sendMessage(incidentId: string, channelId: string, userId: string, userName: string, userRole: string, message: string): ChatMessage {
    const msg: ChatMessage = {
      id: `msg-${uuidv4()}`,
      incidentId,
      userId,
      userName,
      userRole,
      message,
      timestamp: Date.now(),
    };

    if (!this.messages.has(channelId)) {
      this.messages.set(channelId, []);
    }
    this.messages.get(channelId)!.push(msg);
    return msg;
  }

  editMessage(messageId: string, newContent: string): ChatMessage | null {
    for (const messages of this.messages.values()) {
      const msg = messages.find(m => m.id === messageId);
      if (msg) {
        msg.message = newContent;
        msg.isEdited = true;
        msg.editedAt = Date.now();
        return msg;
      }
    }
    return null;
  }

  deleteMessage(messageId: string): boolean {
    for (const messages of this.messages.values()) {
      const idx = messages.findIndex(m => m.id === messageId);
      if (idx !== -1) {
        messages.splice(idx, 1);
        return true;
      }
    }
    return false;
  }

  addReaction(messageId: string, emoji: string, userId: string): void {
    for (const messages of this.messages.values()) {
      const msg = messages.find(m => m.id === messageId);
      if (msg) {
        if (!msg.reactions) msg.reactions = {};
        if (!msg.reactions[emoji]) msg.reactions[emoji] = [];
        if (!msg.reactions[emoji].includes(userId)) {
          msg.reactions[emoji].push(userId);
        }
      }
    }
  }

  removeReaction(messageId: string, emoji: string, userId: string): void {
    for (const messages of this.messages.values()) {
      const msg = messages.find(m => m.id === messageId);
      if (msg && msg.reactions && msg.reactions[emoji]) {
        msg.reactions[emoji] = msg.reactions[emoji].filter(id => id !== userId);
        if (msg.reactions[emoji].length === 0) {
          delete msg.reactions[emoji];
        }
      }
    }
  }

  getChannelMessages(channelId: string): ChatMessage[] {
    return this.messages.get(channelId) || [];
  }

  getIncidentChannels(incidentId: string): ChatChannel[] {
    return this.channels.get(incidentId) || [];
  }

  addMemberToChannel(channelId: string, userId: string): void {
    for (const channels of this.channels.values()) {
      const ch = channels.find(c => c.id === channelId);
      if (ch && !ch.members.includes(userId)) {
        ch.members.push(userId);
      }
    }
  }

  removeMemberFromChannel(channelId: string, userId: string): void {
    for (const channels of this.channels.values()) {
      const ch = channels.find(c => c.id === channelId);
      if (ch) {
        ch.members = ch.members.filter(id => id !== userId);
      }
    }
  }

  searchMessages(incidentId: string, query: string): ChatMessage[] {
    const channels = this.channels.get(incidentId) || [];
    const results: ChatMessage[] = [];
    for (const channel of channels) {
      const messages = this.messages.get(channel.id) || [];
      results.push(...messages.filter(m => m.message.toLowerCase().includes(query.toLowerCase()) || m.userName.toLowerCase().includes(query.toLowerCase())));
    }
    return results;
  }
}

export const chatService = new ChatServiceImpl();
