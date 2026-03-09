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

export interface Treasure {
    id: string;
    realm_id: number;
    name: string;
    description: string;
    image_url: string;
    total_quantity: number;
    remaining_quantity: number;
    drop_rate_percent: number;
    is_active: boolean;
    created_at: string;
}

export interface TreasureWinner {
    id: string;
    treasure_id: string;
    user_id: string;
    claimed_at: string;
    profiles?: {
        full_name: string;
        email: string;
    };
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
    },

    // --- Treasure Management ---

    async getAllTreasures(): Promise<Treasure[]> {
        const { data, error } = await supabase
            .from('game_treasures')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data as Treasure[];
    },

    async createTreasure(treasure: Omit<Treasure, 'id' | 'created_at'>): Promise<void> {
        const { error } = await supabase
            .from('game_treasures')
            .insert([treasure]);
        if (error) throw error;
    },

    async updateTreasure(id: string, updates: Partial<Treasure>): Promise<void> {
        const { error } = await supabase
            .from('game_treasures')
            .update(updates)
            .eq('id', id);
        if (error) throw error;
    },

    async deleteTreasure(id: string): Promise<void> {
        const { error } = await supabase
            .from('game_treasures')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    async getTreasureWinners(treasureId: string): Promise<TreasureWinner[]> {
        const { data, error } = await supabase
            .from('game_treasure_winners')
            .select(`
                *,
                profiles:user_id(full_name, email)
            `)
            .eq('treasure_id', treasureId)
            .order('claimed_at', { ascending: false });

        if (error) throw error;
        return data as any;
    }
};
