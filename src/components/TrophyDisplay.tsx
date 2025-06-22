import React from 'react';
import { Trophy } from 'lucide-react';

type TrophyDisplayProps = {
    trophies: number;
};

export default function TrophyDisplay({ trophies }: TrophyDisplayProps) {
    console.log("Rendering: TrophyDisplay");
    
    if (!trophies || trophies === 0) {
        return (
            <div className="flex items-center justify-center p-6">
                <p className="text-lg text-gray-600">עדיין אין לך גביעים</p>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center p-6">
            <div className="flex items-center gap-3 bg-gradient-to-r from-yellow-100 to-yellow-200 rounded-full px-6 py-4 shadow-lg border-2 border-yellow-400">
                <Trophy 
                    size={48} 
                    className="text-yellow-600 drop-shadow-md" 
                    fill="#FFD700"
                    strokeWidth={2}
                />
                <span className="text-3xl font-bold text-yellow-700 drop-shadow-sm">
                    {trophies}
                </span>
            </div>
        </div>
    );
}
