import { supabase } from '../lib/supabase';

export interface SurveyQuestion {
    id: string;
    text: string;
    is_buddhist_only: boolean;
    order_index: number;
    is_active: boolean;
    created_at?: string;
}

export const surveyAdminService = {
    async getAll() {
        const { data, error } = await supabase
            .from('survey_questions')
            .select('*')
            .order('order_index', { ascending: true });
        if (error) throw error;
        return data as SurveyQuestion[];
    },

    async create(question: Partial<SurveyQuestion>) {
        const { data, error } = await supabase
            .from('survey_questions')
            .insert([question])
            .select()
            .single();
        if (error) throw error;
        return data as SurveyQuestion;
    },

    async update(id: string, updates: Partial<SurveyQuestion>) {
        const { data, error } = await supabase
            .from('survey_questions')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data as SurveyQuestion;
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('survey_questions')
            .delete()
            .eq('id', id);
        if (error) throw error;
    }
};
