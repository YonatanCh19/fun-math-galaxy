
import { supabase } from '@/integrations/supabase/client';
import { AvatarCharacter } from '@/components/AvatarSelector';

export async function updateProfileAvatar(profileId: string, avatarCharacter: AvatarCharacter | null) {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ avatar_character: avatarCharacter })
      .eq('id', profileId);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error updating profile avatar:', error);
    return { success: false, error: error.message };
  }
}

export async function getProfileAvatar(profileId: string): Promise<AvatarCharacter | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('avatar_character')
      .eq('id', profileId)
      .single();

    if (error) {
      throw error;
    }

    return data?.avatar_character as AvatarCharacter || null;
  } catch (error: any) {
    console.error('Error fetching profile avatar:', error);
    return null;
  }
}
