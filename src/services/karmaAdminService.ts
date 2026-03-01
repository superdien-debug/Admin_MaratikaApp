import { supabase } from '../lib/supabase';

export type KarmaPractice = {
    id: string;
    title: string;
    category: string;
    energy_type: string;
    tags: string[];
    target_flaw: string;
    practice_type: 'Normal' | 'Practitioner';
    content: string;
    created_at?: string;
};

export type AISkill = {
    id: string;
    name: string;
    description: string;
    instructions: string;
    system_prompt_key: string;
    category: string;
    created_at: string;
};

export type KarmaSession = {
    id: string;
    user_id: string;
    user_type: 'Normal' | 'Practitioner';
    skill_id?: string;
    routine: string;
    goals: string;
    flaws: string;
    ai_response: string;
    practices_used: string[];
    points_awarded: number;
    points_type: string;
    created_at: string;
    admin_rating?: number;
    admin_feedback?: string;
    is_trained?: boolean;
    profiles?: {
        display_name: string;
    };
};

export const karmaAdminService = {
    // Skills Management
    async getAllSkills(): Promise<AISkill[]> {
        const { data, error } = await supabase
            .from('ai_skills')
            .select('*')
            .order('created_at');
        if (error) throw error;
        return data || [];
    },

    async upsertSkill(skill: Partial<AISkill>) {
        const { data, error } = await supabase
            .from('ai_skills')
            .upsert(skill)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    // Practices Management
    async getAllPractices(): Promise<KarmaPractice[]> {
        const { data, error } = await supabase
            .from('karma_practices')
            .select('*')
            .order('id');
        if (error) throw error;
        return data || [];
    },

    async upsertPractice(practice: Partial<KarmaPractice>) {
        const { data, error } = await supabase
            .from('karma_practices')
            .upsert(practice)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async deletePractice(id: string) {
        const { error } = await supabase
            .from('karma_practices')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    // Sessions Review
    async getAllSessions(skillId?: string): Promise<KarmaSession[]> {
        let query = supabase
            .from('karma_coach_sessions')
            .select('*, profiles(display_name)');

        if (skillId) {
            query = query.eq('skill_id', skillId);
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    },

    async updateSessionFeedback(id: string, feedback: { admin_rating?: number, admin_feedback?: string, is_trained?: boolean }) {
        const { data, error } = await supabase
            .from('karma_coach_sessions')
            .update(feedback)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    }
};
