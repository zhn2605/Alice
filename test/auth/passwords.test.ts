import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '../../lib/auth/passwords';

describe('passwords', () => {
    it('hashes and verifies a correct password', async () => {
        const hash = await hashPassword('correcthorsebatterystaple');
        expect(hash).toMatch(/^\$argon2id\$/);
        expect(await verifyPassword(hash, 'correcthorsebatterystaple')).toBe(true);
    });

    it('rejects an incorrect password', async () => {
        const hash = await hashPassword('hunter2');
        expect(await verifyPassword(hash, 'hunter3')).toBe(false);
    });

    it('produces distinct hashes for the same password', async () => {
        const hash1 = await hashPassword('samepassword');
        const hash2 = await hashPassword('samepassword');
        expect(hash1).not.toBe(hash2);
    });
});