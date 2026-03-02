import { supabase } from '../lib/supabase';

export interface AIProfile {
    id: string;
    user_id: string;
    companion_name: string;
    emotional_state: string;
    avatar_url?: string;
    last_interaction_at: string;
    profiles?: {
        display_name: string;
        email: string;
    };
}

export interface AIMemory {
    id: string;
    user_id: string;
    content: string;
    importance: number;
    memory_type: 'core' | 'ephemeral';
    created_at: string;
}

export interface AISkill {
    id: string;
    title: string;
    description: string;
    icon_name: string;
    is_locked: boolean;
    required_mpoints: number;
    category: string;
}

export const companionAdminService = {
    async getAllProfiles(): Promise<AIProfile[]> {
        const { data, error } = await supabase
            .from('user_ai_profiles')
            .select('*, profiles(display_name, email)')
            .order('last_interaction_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async updateProfile(userId: string, data: Partial<AIProfile>) {
        const { error } = await supabase
            .from('user_ai_profiles')
            .update(data)
            .eq('user_id', userId);

        if (error) throw error;
    },

    async getUserMemories(userId: string): Promise<AIMemory[]> {
        const { data, error } = await supabase
            .from('user_ai_memories')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async deleteMemory(memoryId: string) {
        const { error } = await supabase
            .from('user_ai_memories')
            .delete()
            .eq('id', memoryId);

        if (error) throw error;
    },

    async getAllSkills(): Promise<AISkill[]> {
        const { data, error } = await supabase
            .from('ai_skills')
            .select('*')
            .order('category', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    async upsertSkill(skill: Partial<AISkill>) {
        const { error } = await supabase
            .from('ai_skills')
            .upsert(skill);

        if (error) throw error;
    },

    async deleteSkill(skillId: string) {
        const { error } = await supabase
            .from('ai_skills')
            .delete()
            .eq('id', skillId);

        if (error) throw error;
    }
};
