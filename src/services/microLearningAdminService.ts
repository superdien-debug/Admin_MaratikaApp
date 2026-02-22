import { supabase } from '../lib/supabase';

export interface MicroLearningPost {
    id: string;
    title: string;
    content: string;
    summary?: string;
    image_url?: string;
    author_id?: string;
    category: string;
    is_published: boolean;
    created_at?: string;
    updated_at?: string;
}

export const microLearningAdminService = {
    async getAll() {
        const { data, error } = await supabase
            .from('micro_learning')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as MicroLearningPost[];
    },

    async create(post: Partial<MicroLearningPost>) {
        const { data, error } = await supabase
            .from('micro_learning')
            .insert([post])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async update(id: string, updates: Partial<MicroLearningPost>) {
        const { data, error } = await supabase
            .from('micro_learning')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('micro_learning')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
