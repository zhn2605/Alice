import { describe, it, expect, beforeEach } from 'vitest';
import { createSession, getSessionAndUser, deleteSession, SESSION_TTL_MS } from '../../lib/auth/sessions';

function mockSupabase() {
    const tables: Record<string, any[]> = { sessions: [], users: [] };

    tables.users.push({
        id: 'u1', email: 'a@b.com', password_hash: 'x',
        created_at: new Date().toISOString(),
    });

    const from = (table: string) => {
        const rows = tables[table];
        return {
            insert: (row: any) => {
                rows.push(row);
                return { error: null };
            },
            select: (_cols: string) => ({
                eq: (col: string, val: any) => ({
                    single: <T = any>() => {
                        const found = rows.find((r: any) => r[col] === val);
                        return { data: (found ?? null) as T | null };
                    },
                }),
            }),
            delete: () => ({
                eq: (col: string, val: any) => {
                    const idx = rows.findIndex((r: any) => r[col] === val);
                    if (idx >= 0) rows.splice(idx, 1);
                    return { error: null };
                },
            }),
        };
    };

    return { from } as any;
}

describe('sessions', () => {
    let supabase: any;
    beforeEach(() => { supabase = mockSupabase(); });

    it('creates a session with a random id and 30-day expiry', async () => {
        const s = await createSession(supabase, 'u1');
        expect(s.id).toHaveLength(80);
        expect(s.expires_at).toBeGreaterThan(Date.now() + SESSION_TTL_MS - 1000);
    });

    it('returns null for unknown token', async () => {
        expect(await getSessionAndUser(supabase, 'nope')).toBeNull();
    });

    it('deletes a session', async () => {
        const s = await createSession(supabase, 'u1');
        await deleteSession(supabase, s.id);
        expect(await getSessionAndUser(supabase, s.id)).toBeNull();
    });
});
