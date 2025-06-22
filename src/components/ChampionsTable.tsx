import React, { useEffect, useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { getUsersWithProgress, UserWithProgress } from '@/lib/userUtils';
import { Award } from 'lucide-react';

export default function ChampionsTable({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) {
  console.log("Rendering: ChampionsTable");
  
  const [usersWithProgress, setUsersWithProgress] = useState<UserWithProgress[]>([]);

  useEffect(() => {
    if (isOpen) {
      const fetchUsers = async () => {
        const usersData = await getUsersWithProgress();
        const sortedUsers = usersData
          .filter(user => user.progress && user.progress.correct > 0)
          .sort((a, b) => (b.progress?.correct ?? 0) - (a.progress?.correct ?? 0));
        setUsersWithProgress(sortedUsers);
      };
      fetchUsers();
    }
  }, [isOpen]);

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent dir="rtl" className="bg-orangeKid/95 border-4 border-blueKid rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-2xl text-blue-900">
            <Award className="text-yellow-500" />
            טבלת האלופים
          </AlertDialogTitle>
          <AlertDialogDescription className="text-blue-800 font-semibold">
            כאן מוצגים השחקנים עם הכי הרבה תשובות נכונות!
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="max-h-80 overflow-y-auto pr-2 bg-white/50 rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right font-bold text-blue-900">שם השחקן</TableHead>
                <TableHead className="text-right font-bold text-blue-900">תשובות נכונות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersWithProgress.map(user => (
                <TableRow key={user.id} className="border-b-blue-200">
                  <TableCell className="font-medium text-pinkKid">{user.name}</TableCell>
                  <TableCell className="font-semibold text-green-600">{user.progress?.correct ?? 0}</TableCell>
                </TableRow>
              ))}
              {usersWithProgress.length === 0 && (
                <TableRow>
                    <TableCell colSpan={2} className="text-center text-gray-500 py-4">
                        עדיין אין אלופים! התחילו לשחק כדי להופיע בטבלה.
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>סגור</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
