import React, { memo } from 'react';
import { Button } from '@/components/ui/button';

type RefreshPromptProps = {
  onRefresh: () => void;
  onDismiss: () => void;
};

const RefreshPrompt = memo(({ onRefresh, onDismiss }: RefreshPromptProps) => {
  console.log("Rendering: RefreshPrompt");
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 shadow-2xl text-center max-w-md mx-auto">
        <h3 className="text-xl font-bold text-blueKid mb-3">
          נראה שהאפליקציה קצת עייפה
        </h3>
        <p className="text-gray-600 mb-6">
          רוצה לרענן כדי שהכל ירוץ חלק יותר?
        </p>
        <div className="flex gap-3 justify-center">
          <Button 
            onClick={onRefresh}
            className="bg-greenKid hover:bg-green-500 text-white px-6 py-2"
          >
            רענן עכשיו
          </Button>
          <Button 
            onClick={onDismiss}
            variant="outline"
            className="px-6 py-2"
          >
            המשך כרגיל
          </Button>
        </div>
      </div>
    </div>
  );
});

RefreshPrompt.displayName = 'RefreshPrompt';

export default RefreshPrompt;
