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
    },

    async getRealmPractices(realmId: number): Promise<string[]> {
        const { data, error } = await supabase
            .from('game_rebirth_realm_practices')
            .select('practice_id')
            .eq('realm_id', realmId);
        if (error) throw error;
        return data.map(rp => rp.practice_id);
    },

    async updateRealmPractices(realmId: number, practiceIds: string[]): Promise<void> {
        try {
            // Remove existing links
            const { error: delError } = await supabase
                .from('game_rebirth_realm_practices')
                .delete()
                .eq('realm_id', realmId);
            if (delError) throw delError;

            if (practiceIds.length === 0) return;

            // Insert new links
            const { error: insError } = await supabase
                .from('game_rebirth_realm_practices')
                .insert(practiceIds.map(pid => ({ realm_id: realmId, practice_id: pid })));
            if (insError) throw insError;
        } catch (err) {
            console.error('[RebirthAdminService] updateRealmPractices failed:', err);
            throw err;
        }
    }
};
