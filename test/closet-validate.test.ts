import { describe, it, expect } from 'vitest';
import { validateClosetName, validateDiscordWebhook } from '@/lib/closet/validate';

describe('validateClosetName', () => {
    it('accepts trimmed non-empty names', () => {
        expect(validateClosetName('My Closet')).toEqual({ ok: true, name: 'My Closet' });
    });
    it('trims surrounding whitespace', () => {
        expect(validateClosetName('  Hello  ')).toEqual({ ok: true, name: 'Hello' });
    });
    it('rejects non-strings', () => {
        expect(validateClosetName(undefined)).toEqual({ ok: false, error: 'name must be a string' });
        expect(validateClosetName(123)).toEqual({ ok: false, error: 'name must be a string' });
    });
    it('rejects empty after trim', () => {
        expect(validateClosetName('   ')).toEqual({ ok: false, error: 'name is required' });
    });
    it('rejects names longer than 80 chars after trim', () => {
        expect(validateClosetName('x'.repeat(81))).toEqual({
            ok: false,
            error: 'name must be 80 characters or fewer',
        });
    });
});

describe('validateDiscordWebhook', () => {
    it('accepts null', () => {
        expect(validateDiscordWebhook(null)).toEqual({ ok: true, url: null });
    });
    it('accepts empty string as null-clear', () => {
        expect(validateDiscordWebhook('')).toEqual({ ok: true, url: null });
    });
    it('accepts valid discord url', () => {
        const url = 'https://discord.com/api/webhooks/123/abc';
        expect(validateDiscordWebhook(url)).toEqual({ ok: true, url });
    });
    it('rejects non-discord url', () => {
        expect(validateDiscordWebhook('https://example.com/hook')).toEqual({
            ok: false,
            error: 'invalid discord webhook url',
        });
    });
    it('rejects non-string non-null', () => {
        expect(validateDiscordWebhook(42 as unknown as string)).toEqual({
            ok: false,
            error: 'webhookUrl must be a string or null',
        });
    });
});
