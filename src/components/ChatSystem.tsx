import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useChat } from '@/hooks/useChat';
import { useOnlinePresence } from '@/hooks/useOnlinePresence';
import { renderAvatarByType, AvatarCharacter } from '@/components/AvatarSelector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  MessageCircle, 
  Send, 
  ArrowLeft, 
  Users, 
  Search,
  Clock,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import LoadingSpinner from './LoadingSpinner';

interface ChatSystemProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatSystem({ isOpen, onClose }: ChatSystemProps) {
  const { selectedProfile } = useAuth();
  const { 
    conversations, 
    messages, 
    activeConversation, 
    loading, 
    error,
    fetchMessages, 
    sendMessage, 
    startConversation,
    setActiveConversation 
  } = useChat(selectedProfile);
  const { onlineUsers, loading: onlineLoading, error: onlineError, refetch } = useOnlinePresence(selectedProfile);
  
  const [view, setView] = useState<'conversations' | 'chat' | 'users'>('conversations');
  const [messageInput, setMessageInput] = useState('');
  const [search, setSearch] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Reset view when dialog opens
  useEffect(() => {
    if (isOpen) {
      setView('conversations');
      setActiveConversation(null);
      setSearch('');
      setMessageInput('');
    }
  }, [isOpen, setActiveConversation]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !activeConversation || sending) return;

    const currentConversation = conversations.find(c => c.id === activeConversation);
    if (!currentConversation?.other_profile) return;

    setSending(true);
    const success = await sendMessage(currentConversation.other_profile.id, messageInput);
    
    if (success) {
      setMessageInput('');
      toast.success('הודעה נשלחה!');
    } else {
      toast.error('שגיאה בשליחת ההודעה');
    }
    setSending(false);
  };

  const handleStartChat = async (profileId: string) => {
    const conversationId = await startConversation(profileId);
    if (conversationId) {
      await fetchMessages(conversationId);
      setView('chat');
      toast.success('שיחה חדשה נוצרה!');
    } else {
      toast.error('שגיאה ביצירת שיחה');
    }
  };

  const handleOpenConversation = async (conversationId: string) => {
    await fetchMessages(conversationId);
    setView('chat');
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'עכשיו';
    } else if (diffInHours < 24) {
      return `לפני ${Math.floor(diffInHours)} שעות`;
    } else {
      return date.toLocaleDateString('he-IL');
    }
  };

  const filteredUsers = onlineUsers.filter(user => 
    user.profile.name?.toLowerCase().includes(search.toLowerCase())
  );

  const currentConversation = conversations.find(c => c.id === activeConversation);

  // Error display component
  const ErrorDisplay = ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
    <div className="flex flex-col items-center justify-center py-8 px-4">
      <AlertCircle size={48} className="text-red-500 mb-4" />
      <p className="text-red-600 text-center mb-4">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="flex items-center gap-2">
          <RefreshCw size={16} />
          נסה שוב
        </Button>
      )}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="w-[95vw] max-w-md h-[80vh] bg-gradient-to-b from-blue-50 to-purple-50 border-4 border-blue-300 rounded-2xl p-0 overflow-hidden"
        dir="rtl"
      >
        <DialogHeader className="p-4 pb-2 border-b border-blue-200">
          <DialogTitle className="text-xl text-blue-900 flex items-center gap-2">
            {view === 'conversations' && (
              <>
                <MessageCircle size={24} className="text-blue-600" />
                הצ'אט שלי
              </>
            )}
            {view === 'users' && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setView('conversations')}
                  className="mr-2"
                >
                  <ArrowLeft size={20} />
                </Button>
                <Users size={24} className="text-green-600" />
                בחר משתמש לצ'אט
              </>
            )}
            {view === 'chat' && currentConversation && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setView('conversations');
                    setActiveConversation(null);
                  }}
                  className="mr-2"
                >
                  <ArrowLeft size={20} />
                </Button>
                {renderAvatarByType(currentConversation.other_profile?.avatar_character as AvatarCharacter, 'sm')}
                {currentConversation.other_profile?.name}
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {/* Conversations List View */}
          {view === 'conversations' && (
            <div className="h-full flex flex-col">
              <div className="p-4 space-y-3">
                <Button
                  onClick={() => setView('users')}
                  className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold"
                >
                  <Users size={20} className="ml-2" />
                  התחל צ'אט חדש
                </Button>
              </div>

              <ScrollArea className="flex-1 px-4">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner message="טוען שיחות..." />
                  </div>
                ) : error ? (
                  <ErrorDisplay message={error} onRetry={() => window.location.reload()} />
                ) : conversations.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="font-bold mb-2">אין שיחות עדיין</p>
                    <p className="text-sm">התחל צ'אט חדש עם חבר!</p>
                  </div>
                ) : (
                  <div className="space-y-2 pb-4">
                    {conversations.map((conversation) => (
                      <Card
                        key={conversation.id}
                        className="cursor-pointer hover:bg-blue-50 transition-colors border-2 border-blue-200 hover:border-blue-400"
                        onClick={() => handleOpenConversation(conversation.id)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              {renderAvatarByType(conversation.other_profile?.avatar_character as AvatarCharacter, 'sm')}
                              {conversation.unread_count && conversation.unread_count > 0 && (
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                                  <span className="text-xs text-white font-bold">
                                    {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start">
                                <p className="font-bold text-blue-900 truncate">
                                  {conversation.other_profile?.name}
                                </p>
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <Clock size={12} />
                                  {formatTime(conversation.last_message_at)}
                                </span>
                              </div>
                              {conversation.last_message && (
                                <p className="text-sm text-gray-600 truncate">
                                  {conversation.last_message}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}

          {/* Users List View */}
          {view === 'users' && (
            <div className="h-full flex flex-col">
              <div className="p-4">
                <div className="relative">
                  <Search size={20} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="חפש משתמש..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pr-10 border-2 border-blue-200"
                  />
                </div>
              </div>

              <ScrollArea className="flex-1 px-4">
                {onlineLoading ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner message="טוען משתמשים..." />
                  </div>
                ) : onlineError ? (
                  <ErrorDisplay message={onlineError} onRetry={refetch} />
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="font-bold mb-2">אין משתמשים מחוברים</p>
                    <p className="text-sm">נסה לרענן או חכה שחברים יתחברו</p>
                    <Button onClick={refetch} className="mt-4" variant="outline">
                      <RefreshCw size={16} className="ml-2" />
                      רענן
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2 pb-4">
                    {filteredUsers.map((user) => (
                      <Card
                        key={user.profile_id}
                        className="cursor-pointer hover:bg-green-50 transition-colors border-2 border-green-200 hover:border-green-400"
                        onClick={() => handleStartChat(user.profile_id)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              {renderAvatarByType(user.profile.avatar_character as AvatarCharacter, 'sm')}
                              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
                            </div>
                            <div className="flex-1">
                              <p className="font-bold text-blue-900">{user.profile.name}</p>
                              <p className="text-sm text-green-600">מחובר עכשיו</p>
                            </div>
                            <Button
                              size="sm"
                              className="bg-blue-500 hover:bg-blue-600 text-white"
                            >
                              <MessageCircle size={16} />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}

          {/* Chat View */}
          {view === 'chat' && currentConversation && (
            <div className="h-full flex flex-col">
              {/* Messages */}
              <ScrollArea className="flex-1 px-4 py-2">
                {error ? (
                  <ErrorDisplay message={error} />
                ) : (
                  <div className="space-y-3">
                    {messages.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
                        <p>התחילו לכתוב הודעות!</p>
                      </div>
                    ) : (
                      messages.map((message) => {
                        const isFromMe = message.from_profile_id === selectedProfile?.id;
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[80%] p-3 rounded-2xl ${
                                isFromMe
                                  ? 'bg-blue-500 text-white rounded-br-sm'
                                  : 'bg-white border-2 border-gray-200 text-gray-800 rounded-bl-sm'
                              }`}
                            >
                              <p className="text-sm">{message.message}</p>
                              <p className={`text-xs mt-1 ${isFromMe ? 'text-blue-100' : 'text-gray-500'}`}>
                                {formatTime(message.created_at)}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 border-t border-blue-200">
                <div className="flex gap-2">
                  <Input
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="כתוב הודעה..."
                    className="flex-1 border-2 border-blue-200"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    disabled={sending}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim() || sending}
                    className="bg-blue-500 hover:bg-blue-600 text-white min-h-[44px] min-w-[44px]"
                  >
                    {sending ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <Send size={20} />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}