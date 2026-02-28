import { supabase } from '../lib/supabase';

export type YangtiStage = {
    stage_number: number;
    stage_group: string;
    title: string;
    description: string;
    metric_goal: string;
    created_at?: string;
    updated_at?: string;
};

export const yangtiAdminService = {
    async getAll(): Promise<YangtiStage[]> {
        const { data, error } = await supabase
            .from('yangti_stages')
            .select('*')
            .order('stage_number', { ascending: true });

        if (error) {
            console.error('Error fetching stages:', error);
            throw error;
        }
        return data || [];
    },

    async update(stage_number: number, updates: Partial<YangtiStage>): Promise<YangtiStage> {
        const payload = {
            ...updates,
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('yangti_stages')
            .update(payload)
            .eq('stage_number', stage_number)
            .select()
            .single();

        if (error) {
            console.error('Error updating stage:', error);
            throw error;
        }
        return data as YangtiStage;
    }
};
