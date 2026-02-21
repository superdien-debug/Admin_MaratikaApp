import { supabase } from '../lib/supabase';

export type AppNotification = {
    id: string;
    title: string;
    content: string;
    scheduled_at: string;
    is_sent: boolean;
    created_at: string;
    created_by: string;
    type: string;
};

export const notificationAdminService = {
    async getAll() {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .order('scheduled_at', { ascending: false });

        if (error) throw error;
        return data as AppNotification[];
    },

    async create(notification: Partial<AppNotification>) {
        const { data, error } = await supabase
            .from('notifications')
            .insert(notification)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async update(id: string, notification: Partial<AppNotification>) {
        const { data, error } = await supabase
            .from('notifications')
            .update(notification)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
