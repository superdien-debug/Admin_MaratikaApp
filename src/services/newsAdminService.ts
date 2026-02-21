import { supabase } from '../lib/supabase';

export interface NewsArticle {
    id: string;
    title: string;
    content: string;
    excerpt: string;
    image_url: string;
    author_id: string;
    created_at: string;
}

export const newsAdminService = {
    async getAll() {
        const { data, error } = await supabase
            .from('news')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data as NewsArticle[];
    },

    async create(article: Partial<NewsArticle>) {
        const { data, error } = await supabase
            .from('news')
            .insert(article)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async update(id: string, updates: Partial<NewsArticle>) {
        const { data, error } = await supabase
            .from('news')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('news')
            .delete()
            .eq('id', id);
        if (error) throw error;
    }
};
