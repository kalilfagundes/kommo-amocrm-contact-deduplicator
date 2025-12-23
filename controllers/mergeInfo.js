import axios from 'axios'
import { getStoredTokens } from '../scripts/tokenUtils.js';
import fs from 'fs'
import dotenv from 'dotenv'
dotenv.config()

/**
 * merge info
 * @param {Object} contacts - Data to merge
 * @returns {Object} - Parsed data
 */

const mergeInfo = async (contacts) => {

    const params = contacts.map(item => 'id[]=' + item.id).join('&');

    console.log("Merge Info IDS", contacts.map(item => item.id))

    const tokens = getStoredTokens();

    const requestConfig = {
        headers: {
            'Authorization': `Bearer ${tokens.access_token}`,
            // Match the headers from your working curl
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': '*/*',
            'Referer': `https://${process.env.DOMAIN}/`,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ...', // Use a standard browser UA
            // If you have a CSRF token stored, it MUST be in the cookie
            'Cookie': `access_token=${tokens.access_token}; refresh_token=${tokens.refresh_token}; csrf_token=${tokens.csrf_token || ''}`
        },
        withCredentials: true
    };

    try {
        const url = `https://${process.env.DOMAIN}/ajax/merge/contacts/info/`;

        const response = await axios.post(url, params, requestConfig);
        const saveResponse = response.data;

        fs.writeFileSync('tests/results/mergeInfo.json', JSON.stringify(saveResponse, null, 2));

        console.log("Merge Info IDs:", response.data.response?.elements)

        return { ids_and_creation_date: contacts, merge_info: response.data } || null;
    } catch (error) {
        console.error("Failed to get merge information:", error.response?.status, error.response?.data);
        return null;
    }

}

export { mergeInfo }