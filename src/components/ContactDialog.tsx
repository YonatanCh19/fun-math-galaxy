import React from 'react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from './ui/button';
import { useTranslation } from '@/hooks/useTranslation';

export default function ContactDialog({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  console.log("Rendering: ContactDialog");
  
  const { t } = useTranslation();
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent dir="rtl" className="bg-orangeKid border-4 border-pinkKid rounded-2xl max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl text-center text-blue-900">{t('contact_us_title')}</AlertDialogTitle>
        </AlertDialogHeader>
        <div className="pt-4 text-center text-blue-900 space-y-4">
            <p className="font-bold text-xl">{t('yonatan_kalfon')}</p>
          <div>
            <p className="font-semibold text-lg">{t('contact_prompt')}</p>
            <a href="mailto:pais.yonatan@gmail.com" className="font-bold text-xl text-pinkKid hover:underline">
              pais.yonatan@gmail.com
            </a>
          </div>
        </div>
        <AlertDialogFooter className="pt-4">
          <AlertDialogCancel asChild>
            <Button variant="ghost" className="bg-pinkKid text-white hover:bg-pink-500 hover:text-white w-full font-bold text-lg py-2 px-4 rounded-lg">
              {t('close')}
            </Button>
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
