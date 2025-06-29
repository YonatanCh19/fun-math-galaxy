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
  RefreshCw,
  X
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
    loading: chatLoading, 
    error: chatError,
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
  const [initialLoading, setInitialLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [messages]);

  // Focus input when entering chat view
  useEffect(() => {
    if (view === 'chat' && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [view]);

  // Reset view when dialog opens and handle initial loading
  useEffect(() => {
    if (isOpen) {
      setView('conversations');
      setActiveConversation(null);
      setSearch('');
      setMessageInput('');
      setInitialLoading(true);
      
      // Set initial loading to false after a short delay
      const timer = setTimeout(() => {
        setInitialLoading(false);
      }, 1000);
      
      return () => clearTimeout(timer);
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

  // Show initial loading screen
  if (initialLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent 
          className="w-[95vw] max-w-md h-[80vh] bg-gradient-to-b from-blue-50 to-purple-50 border-4 border-blue-300 rounded-2xl overflow-hidden"
          dir="rtl"
        >
          <DialogHeader className="p-4 pb-2 border-b border-blue-200">
            <DialogTitle className="text-xl text-blue-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle size={24} className="text-blue-600" />
                הצ'אט שלי
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-blue-600 hover:bg-blue-100 min-h-[44px] min-w-[44px]"
              >
                <X size={20} />
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <LoadingSpinner message="טוען צ'אט..." size="lg" />
              <p className="text-blue-600 mt-4 text-sm">מכין את הצ'אט שלך...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="w-[95vw] max-w-md h-[80vh] bg-gradient-to-b from-blue-50 to-purple-50 border-4 border-blue-300 rounded-2xl p-0 overflow-hidden"
        dir="rtl"
      >
        <DialogHeader className="p-4 pb-2 border-b border-blue-200 flex-shrink-0">
          <DialogTitle className="text-xl text-blue-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
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
                    className="mr-2 hover:bg-blue-100 min-h-[44px] min-w-[44px]"
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
                    className="mr-2 hover:bg-blue-100 min-h-[44px] min-w-[44px]"
                  >
                    <ArrowLeft size={20} />
                  </Button>
                  <div className="flex items-center gap-2">
                    {renderAvatarByType(currentConversation.other_profile?.avatar_character as AvatarCharacter, 'sm')}
                    <span className="font-bold">{currentConversation.other_profile?.name}</span>
                  </div>
                </>
              )}
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-blue-600 hover:bg-blue-100 min-h-[44px] min-w-[44px]"
            >
              <X size={20} />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Conversations List View */}
          {view === 'conversations' && (
            <div className="h-full flex flex-col">
              <div className="p-4 space-y-3 flex-shrink-0">
                <Button
                  onClick={() => setView('users')}
                  className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold min-h-[44px]"
                >
                  <Users size={20} className="ml-2" />
                  התחל צ'אט חדש
                </Button>
              </div>

              <ScrollArea className="flex-1 px-4">
                {chatLoading ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner message="טוען שיחות..." />
                  </div>
                ) : chatError ? (
                  <ErrorDisplay message={chatError} onRetry={() => window.location.reload()} />
                ) : conversations.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="font-bold mb-2 text-lg">אין שיחות עדיין</p>
                    <p className="text-sm mb-4">התחל צ'אט חדש עם חבר!</p>
                    <Button
                      onClick={() => setView('users')}
                      className="bg-blue-500 hover:bg-blue-600 text-white min-h-[44px]"
                    >
                      <Users size={16} className="ml-2" />
                      מצא חברים
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2 pb-4">
                    {conversations.map((conversation) => (
                      <Card
                        key={conversation.id}
                        className="cursor-pointer hover:bg-blue-50 transition-colors border-2 border-blue-200 hover:border-blue-400 hover:shadow-md"
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
              <div className="p-4 flex-shrink-0">
                <div className="relative">
                  <Search size={20} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="חפש משתמש..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pr-10 border-2 border-blue-200 focus:border-blue-400"
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
                    <p className="font-bold mb-2 text-lg">
                      {search ? `אין משתמשים בשם "${search}"` : 'אין משתמשים מחוברים'}
                    </p>
                    <p className="text-sm mb-4">
                      {search ? 'נסה לחפש שם אחר' : 'נסה לרענן או חכה שחברים יתחברו'}
                    </p>
                    <Button onClick={refetch} variant="outline" className="flex items-center gap-2 min-h-[44px]">
                      <RefreshCw size={16} />
                      רענן רשימה
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2 pb-4">
                    {filteredUsers.map((user) => (
                      <Card
                        key={user.profile_id}
                        className="cursor-pointer hover:bg-green-50 transition-colors border-2 border-green-200 hover:border-green-400 hover:shadow-md"
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
                              <p className="text-sm text-green-600 flex items-center gap-1">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                מחובר עכשיו
                              </p>
                            </div>
                            <Button
                              size="sm"
                              className="bg-blue-500 hover:bg-blue-600 text-white min-h-[36px] min-w-[36px]"
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
              {/* Messages Area */}
              <ScrollArea className="flex-1 px-4 py-2">
                {chatError ? (
                  <ErrorDisplay message={chatError} />
                ) : (
                  <div className="space-y-3">
                    {messages.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
                        <p className="font-bold mb-2">התחילו לכתוב הודעות!</p>
                        <p className="text-sm">זה המקום לשוחח עם {currentConversation.other_profile?.name}</p>
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
                              className={`max-w-[80%] p-3 rounded-2xl shadow-sm ${
                                isFromMe
                                  ? 'bg-blue-500 text-white rounded-br-sm'
                                  : 'bg-white border-2 border-gray-200 text-gray-800 rounded-bl-sm'
                              }`}
                            >
                              <p className="text-sm leading-relaxed break-words">{message.message}</p>
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

              {/* Message Input Area */}
              <div className="p-4 border-t border-blue-200 bg-white/50 flex-shrink-0">
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="כתוב הודעה..."
                    className="flex-1 border-2 border-blue-200 focus:border-blue-400 bg-white min-h-[44px]"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    disabled={sending}
                    maxLength={500}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim() || sending}
                    className="bg-blue-500 hover:bg-blue-600 text-white min-h-[44px] min-w-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sending ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <Send size={20} />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  ההודעות נשמרות ל-24 שעות ואז נמחקות אוטומטית
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}