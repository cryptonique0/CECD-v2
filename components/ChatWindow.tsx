import React, { useState, useEffect, useRef } from 'react';
import { chatService, ChatMessage, ChatChannel } from '../services/chatService';

interface ChatWindowProps {
  incidentId: string;
  channelId: string;
  userId: string;
  userName: string;
  userRole: string;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  incidentId,
  channelId,
  userId,
  userName,
  userRole,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const channel = chatService.getChannelMessages(channelId);
    setMessages(channel);
    scrollToBottom();
  }, [channelId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!messageText.trim()) return;

    const newMessage = chatService.sendMessage(
      incidentId,
      channelId,
      userId,
      userName,
      userRole,
      messageText
    );

    setMessages([...messages, newMessage]);
    setMessageText('');
  };

  const handleEditMessage = (messageId: string, currentText: string) => {
    setEditingId(messageId);
    setEditText(currentText);
  };

  const handleSaveEdit = (messageId: string) => {
    const updated = chatService.editMessage(messageId, editText);
    if (updated) {
      setMessages(messages.map(m => (m.id === messageId ? updated : m)));
      setEditingId(null);
      setEditText('');
    }
  };

  const handleAddReaction = (messageId: string, emoji: string) => {
    chatService.addReaction(messageId, emoji, userId);
    const updated = chatService.getChannelMessages(channelId);
    setMessages(updated);
  };

  const getTimeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  const roleColors: Record<string, string> = {
    Volunteer: 'bg-green-500/20 text-green-400',
    Dispatcher: 'bg-blue-500/20 text-blue-400',
    Paramedic: 'bg-red-500/20 text-red-400',
    Firefighter: 'bg-orange-500/20 text-orange-400',
    Leader: 'bg-purple-500/20 text-purple-400',
  };

  return (
    <div className="flex flex-col h-full bg-slate-800 border border-white/10 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-white">Team Communications</h3>
          <p className="text-xs text-white/50">{messages.length} messages</p>
        </div>
        <div className="flex gap-2">
          <button className="p-2 hover:bg-white/10 rounded-lg transition-all text-white/60 hover:text-white">
            <span className="material-symbols-outlined text-lg">call</span>
          </button>
          <button className="p-2 hover:bg-white/10 rounded-lg transition-all text-white/60 hover:text-white">
            <span className="material-symbols-outlined text-lg">info</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-white/40">
            <div className="text-center">
              <span className="material-symbols-outlined text-4xl mb-2 block">mail</span>
              <p className="text-sm">No messages yet. Start the conversation!</p>
            </div>
          </div>
        ) : (
          messages.map(message => (
            <div key={message.id} className="group">
              <div className="flex gap-2">
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
                  {message.userName.charAt(0)}
                </div>

                {/* Message Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold text-white">{message.userName}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${roleColors[message.userRole] || 'bg-slate-600/20 text-slate-400'}`}>
                      {message.userRole}
                    </span>
                    <span className="text-xs text-white/40">{getTimeAgo(message.timestamp)}</span>
                  </div>

                  {/* Message Text */}
                  {editingId === message.id ? (
                    <div className="mt-1 flex gap-2">
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="flex-1 px-2 py-1 bg-slate-700 border border-white/10 rounded text-xs text-white"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveEdit(message.id)}
                        className="px-2 py-1 bg-primary text-white rounded text-xs font-semibold hover:bg-primary/80"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-2 py-1 bg-slate-700 text-white rounded text-xs hover:bg-slate-600"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-white/80 mt-1 break-words">{message.message}</p>
                      {message.isEdited && (
                        <p className="text-[10px] text-white/40 mt-1">(edited)</p>
                      )}
                    </>
                  )}

                  {/* Reactions */}
                  {message.reactions && Object.keys(message.reactions).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {Object.entries(message.reactions).map(([emoji, userIds]) => (
                        <button
                          key={emoji}
                          onClick={() => handleAddReaction(message.id, emoji)}
                          className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-xs transition-all flex items-center gap-1"
                        >
                          <span>{emoji}</span>
                          <span className="text-[10px] text-white/60">{userIds.length}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button
                    onClick={() => handleAddReaction(message.id, '👍')}
                    className="p-1 hover:bg-white/10 rounded transition-all text-white/60 hover:text-white"
                    title="Like"
                  >
                    <span className="material-symbols-outlined text-sm">thumb_up</span>
                  </button>
                  {message.userId === userId && (
                    <>
                      <button
                        onClick={() => handleEditMessage(message.id, message.message)}
                        className="p-1 hover:bg-white/10 rounded transition-all text-white/60 hover:text-white"
                        title="Edit"
                      >
                        <span className="material-symbols-outlined text-sm">edit</span>
                      </button>
                      <button
                        onClick={() => chatService.deleteMessage(message.id)}
                        className="p-1 hover:bg-red-500/20 rounded transition-all text-white/60 hover:text-red-400"
                        title="Delete"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/10">
        <div className="flex gap-2">
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 bg-slate-700 border border-white/10 rounded-lg text-sm text-white placeholder-white/40 focus:outline-none focus:border-primary"
          />
          <button
            onClick={handleSendMessage}
            disabled={!messageText.trim()}
            className="px-4 py-2 bg-primary hover:bg-primary/80 disabled:bg-primary/50 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">send</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
