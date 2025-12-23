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

// Helper to save tokens
export const saveTokens = (newData) => {
    writeFileSync(TOKEN_FILE, JSON.stringify(newData, null, 2));
};