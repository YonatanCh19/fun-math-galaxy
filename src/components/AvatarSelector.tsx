
import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { X, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type AvatarCharacter = 
  | 'cat' | 'dog' | 'lion' | 'bear' | 'unicorn' | 'astronaut'
  | 'wizard' | 'pirate' | 'royal' | 'robot' | 'superhero' | 'star' | 'green_circle';

export interface AvatarData {
  id: AvatarCharacter;
  emoji: string;
  name: string;
  color: string;
  category: 'animals' | 'fantasy' | 'professions';
}

const avatarsData: AvatarData[] = [
  // Animals
  { id: 'cat', emoji: '🐱', name: 'חתול', color: 'bg-orange-200', category: 'animals' },
  { id: 'dog', emoji: '🐶', name: 'כלב', color: 'bg-amber-200', category: 'animals' },
  { id: 'lion', emoji: '🦁', name: 'אריה', color: 'bg-yellow-200', category: 'animals' },
  { id: 'bear', emoji: '🐻', name: 'דוב', color: 'bg-amber-300', category: 'animals' },
  
  // Fantasy
  { id: 'unicorn', emoji: '🦄', name: 'חד קרן', color: 'bg-pink-200', category: 'fantasy' },
  { id: 'wizard', emoji: '🧙‍♂️', name: 'קוסם', color: 'bg-purple-200', category: 'fantasy' },
  { id: 'royal', emoji: '👑', name: 'נסיך/נסיכה', color: 'bg-yellow-100', category: 'fantasy' },
  { id: 'star', emoji: '⭐', name: 'כוכב', color: 'bg-yellow-100', category: 'fantasy' },
  
  // Professions
  { id: 'astronaut', emoji: '🚀', name: 'אסטרונאוט', color: 'bg-blue-200', category: 'professions' },
  { id: 'pirate', emoji: '🏴‍☠️', name: 'פיראט', color: 'bg-gray-200', category: 'professions' },
  { id: 'robot', emoji: '🤖', name: 'רובוט', color: 'bg-gray-300', category: 'professions' },
  { id: 'superhero', emoji: '🦸‍♂️', name: 'גיבור על', color: 'bg-red-200', category: 'professions' },
];

const categoryNames = {
  animals: 'חיות',
  fantasy: 'דמויות פנטזיה',
  professions: 'מקצועות'
};

interface AvatarSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (avatar: AvatarCharacter) => void;
  currentAvatar?: AvatarCharacter | null;
}

export function AvatarSelector({ isOpen, onClose, onSelect, currentAvatar }: AvatarSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<'animals' | 'fantasy' | 'professions'>('animals');
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarCharacter | null>(currentAvatar || null);

  const handleAvatarSelect = useCallback((avatar: AvatarCharacter) => {
    setSelectedAvatar(avatar);
    // Add selection animation delay
    setTimeout(() => {
      onSelect(avatar);
      onClose();
    }, 300);
  }, [onSelect, onClose]);

  const filteredAvatars = avatarsData.filter(avatar => avatar.category === selectedCategory);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        dir="rtl" 
        className="bg-kidGradient border-4 border-pinkKid rounded-xl text-blue-900 max-w-2xl max-h-[80vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle className="text-pinkKid text-xl sm:text-2xl font-bold text-center">
            בחר/י את הדמות שלך
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute left-4 top-4 text-pinkKid hover:bg-pinkKid/20 min-h-[44px] min-w-[44px]"
          >
            <X className="h-6 w-6" />
          </Button>
        </DialogHeader>

        {/* Category Tabs */}
        <div className="flex justify-center mb-6">
          <div className="bg-white/80 rounded-xl p-1 flex gap-1 flex-wrap">
            {(Object.keys(categoryNames) as Array<keyof typeof categoryNames>).map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "ghost"}
                onClick={() => setSelectedCategory(category)}
                className={`px-2 sm:px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all min-h-[44px] ${
                  selectedCategory === category 
                    ? "bg-pinkKid text-white shadow-md" 
                    : "text-blue-900 hover:bg-pinkKid/20"
                }`}
              >
                {categoryNames[category]}
              </Button>
            ))}
          </div>
        </div>

        {/* Avatar Grid */}
        <div className="grid grid-cols-4 gap-3 sm:gap-4 p-2 sm:p-4">
          {filteredAvatars.map((avatar, index) => (
            <div
              key={avatar.id}
              className="relative cursor-pointer"
              style={{ 
                animationDelay: `${index * 100}ms`,
              }}
              onClick={() => handleAvatarSelect(avatar.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleAvatarSelect(avatar.id);
                }
              }}
              tabIndex={0}
              role="button"
              aria-label={`בחר דמות ${avatar.name}`}
            >
              {/* Fixed size container - 120x120 pixels */}
              <div className={`
                w-[120px] h-[120px] rounded-xl flex flex-col items-center justify-center
                ${avatar.color} shadow-md border-2 border-white
                relative overflow-hidden cursor-pointer
                transition-all duration-300 ease-in-out
                hover:rotate-3 hover:shadow-lg hover:brightness-110
                ${selectedAvatar === avatar.id ? 'ring-4 ring-pinkKid ring-offset-2 shadow-xl rotate-1' : ''}
              `}>
                
                {/* Avatar emoji - full size */}
                <div className="flex flex-col items-center justify-center">
                  <span className="text-4xl sm:text-5xl" role="img" aria-label={avatar.name}>
                    {avatar.emoji}
                  </span>
                </div>
                
                {/* Selection indicator */}
                {selectedAvatar === avatar.id && (
                  <div className="absolute -top-2 -right-2 z-10">
                    <Sparkles className="h-6 w-6 text-yellow-400 animate-pulse" />
                  </div>
                )}
              </div>
              
              {/* Avatar name */}
              <p className="text-center text-xs font-semibold text-blue-900 mt-2">
                {avatar.name}
              </p>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper function to render avatar by type
export function renderAvatarByType(avatarType: AvatarCharacter | null | undefined, size: 'sm' | 'md' | 'lg' = 'md') {
  const avatar = avatarsData.find(a => a.id === avatarType);
  
  const sizeClasses = {
    sm: 'w-12 h-12 text-2xl',
    md: 'w-16 h-16 text-3xl',
    lg: 'w-20 h-20 text-4xl'
  };
  
  if (!avatar) {
    // Default green circle with user icon
    return (
      <div className={`${sizeClasses[size]} bg-greenKid rounded-full flex items-center justify-center`}>
        <svg className="w-1/2 h-1/2 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
        </svg>
      </div>
    );
  }
  
  return (
    <div className={`${sizeClasses[size]} ${avatar.color} rounded-full flex items-center justify-center shadow-md border-2 border-white`}>
      <span role="img" aria-label={avatar.name}>
        {avatar.emoji}
      </span>
    </div>
  );
}
