import { SupabaseClient } from '@supabase/supabase-js';
import { randomBytes } from 'node:crypto';

export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface SessionRow {
    id: string;
    user_id: string;
    expires_at: number;
}

export interface UserRow {
    id: string;
    email: string;
    password_hash: string;
    created_at: string;
}

export async function createSession(supabase: SupabaseClient, userId: string): Promise<SessionRow> {
    const id = randomBytes(40).toString('hex');
    const expires_at = Date.now() + SESSION_TTL_MS;

    const { error } = await supabase.from('sessions').insert({ id, user_id: userId, expires_at });
    if (error) throw error;

    return { id, user_id: userId, expires_at };
}

export async function getSessionAndUser(
    supabase: SupabaseClient,
    token: string,
): Promise<{ session: SessionRow; user: UserRow } | null> {
    const { data: session } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', token)
        .single();
    if (!session) return null;

    if (session.expires_at <= Date.now()) {
        await supabase.from('sessions').delete().eq('id', token);
        return null;
    }

    const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user_id)
        .single();
    if (!user) return null;

    return { session, user };
}

export async function deleteSession(supabase: SupabaseClient, token: string): Promise<void> {
    await supabase.from('sessions').delete().eq('id', token);
}
