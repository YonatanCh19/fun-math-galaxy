
-- שלב 1: הסרת הטריגר והפונקציה הישנים שיצרו פרופיל אוטומטי.
-- במערכת החדשה, הורים יוכלו ליצור פרופילים באופן ידני.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- שלב 2: מחיקת הטבלאות הקיימות כדי למנוע שגיאות מפתח זר.
-- אזהרה: פעולה זו תמחק לצמיתות את כל נתוני ההתקדמות והפרופילים הקיימים.
DROP TABLE IF EXISTS public.user_progress;
DROP TABLE IF EXISTS public.profiles;

-- שלב 3: יצירת טבלת 'profiles' חדשה לאחסון פרופילי הילדים.
-- כל פרופיל יהיה מקושר לחשבון המשתמש של ההורה (user_id).
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  pin TEXT, -- קוד פשוט עבור הילד לבחירת הפרופיל שלו. מאוחסן כטקסט רגיל.
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- שלב 4: הפעלת אבטחת רמת שורה (RLS) עבור טבלת הפרופילים החדשה.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- מדיניות: לאפשר להורים לנהל רק את הפרופילים המשויכים לחשבונם.
CREATE POLICY "Parents can manage their own children profiles."
  ON public.profiles FOR ALL
  USING (auth.uid() = user_id);

-- שלב 5: יצירה מחדש של טבלת 'user_progress', כעת מקושרת ל-profile_id במקום ל-user_id.
CREATE TABLE public.user_progress (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL UNIQUE REFERENCES public.profiles ON DELETE CASCADE,
  correct INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0,
  trophies INTEGER NOT NULL DEFAULT 0,
  coins INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- שלב 6: יצירת פונקציית עזר כדי לבדוק אם המשתמש הנוכחי הוא הבעלים של פרופיל נתון.
-- זה נחוץ להגדרת מדיניות RLS בטבלת user_progress.
CREATE OR REPLACE FUNCTION public.is_profile_owner(profile_id_to_check UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET SEARCH_PATH = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = profile_id_to_check AND user_id = auth.uid()
  );
$$;

-- שלב 7: הפעלת אבטחת רמת שורה (RLS) עבור טבלת user_progress.
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- מדיניות: לאפשר למשתמשים לגשת לרשומות התקדמות רק עבור פרופילים שבבעלותם (הילדים שלהם).
CREATE POLICY "Users can manage progress for their own children profiles."
  ON public.user_progress FOR ALL
  USING (public.is_profile_owner(profile_id));
