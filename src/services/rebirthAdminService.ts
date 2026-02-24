import { supabase } from '../lib/supabase';

export interface Realm {
    id: number;
    name: string;
    short_desc: string;
    image_url: string;
    description: string;
    life_days: number;
    dice_1: number;
    dice_2: number;
    dice_3: number;
    dice_4: number;
    dice_5: number;
    dice_6: number;
}

export const rebirthAdminService = {
    async getAllRealms(): Promise<Realm[]> {
        const { data, error } = await supabase
            .from('game_rebirth_realms')
            .select('*')
            .order('id');
        if (error) throw error;
        return data as Realm[];
    },

    async updateRealm(id: number, updates: Partial<Realm>): Promise<void> {
        const { error } = await supabase
            .from('game_rebirth_realms')
            .update(updates)
            .eq('id', id);
        if (error) throw error;
    }
};
