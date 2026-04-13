import { hash, verify } from '@node-rs/argon2';

const OPTIONS = {
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
};

export async function hashPassword(password: string): Promise<string> {
    return await hash(password, OPTIONS);
}

export async function verifyPassword(storedHash: string, password: string): Promise<boolean> {
    try {
        return await verify(storedHash, password);
    } catch (err) {
        return false;
    }
}