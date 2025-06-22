import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { tips } from '@/lib/tips';

export default function TipsRepository({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  console.log("Rendering: TipsRepository");
  return (
    <Dialog open={isOpen} onOpenChange={onClose} >
      <DialogContent className="sm:max-w-[625px] bg-orangeKid border-4 border-pinkKid rounded-2xl" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-2xl text-blue-900">מאגר הטיפים</DialogTitle>
          <DialogDescription className="text-blue-800 font-semibold text-right">
            כל הטיפים והטריקים שיעזרו לכם להיות אלופי המתמטיקה!
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4 mt-4">
          <Accordion type="single" collapsible className="w-full">
            {tips.map((tip, index) => (
              <AccordionItem value={`item-${index}`} key={index}>
                <AccordionTrigger className="text-right font-bold text-blueKid hover:text-pinkKid">{index + 1}. {tip.title}</AccordionTrigger>
                <AccordionContent className="text-blue-900 bg-white/75 rounded-lg p-3 text-right">
                  {tip.content}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
