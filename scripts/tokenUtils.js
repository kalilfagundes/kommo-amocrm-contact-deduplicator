import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const TOKEN_FILE = join(__dirname, '../tokens.json');

// Helper to get tokens
export const getStoredTokens = () => {
    return JSON.parse(readFileSync(TOKEN_FILE, 'utf-8'));
};

// Helper to save tokens.
// Merges into whatever is already stored: the OAuth refresh only returns
// access_token and refresh_token, but the /ajax/* calls also need csrf_token
// and session_id. A plain overwrite would drop them on the first refresh.
export const saveTokens = (newData) => {
    let current = {};
    try {
        current = getStoredTokens();
    } catch {
        // no token file yet, or unreadable: start from scratch
    }
    writeFileSync(TOKEN_FILE, JSON.stringify({ ...current, ...newData }, null, 2));
};