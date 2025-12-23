import axios from 'axios'
import { getStoredTokens } from '../scripts/tokenUtils.js'
import fs from 'fs'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import dotenv from 'dotenv'
dotenv.config()


/**
 * search contact by query
 * @param {string} query - Query to search
 * @returns {Object} - Parsed data
 */


// Extend dayjs to support custom formats
dayjs.extend(customParseFormat);

const searchContact = async (query) => {
    const tokens = getStoredTokens();

    const requestConfig = {
        headers: {
            'accept': 'application/json, text/javascript, */*; q=0.01',
            'accept-language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
            'cache-control': 'no-cache',
            'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'origin': `https://${process.env.DOMAIN}`,
            'pragma': 'no-cache',
            'referer': `https://${process.env.DOMAIN}/contacts/list/contacts/?skip_filter=Y&term=${encodeURIComponent(query)}`,
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin',
            'x-requested-with': 'XMLHttpRequest',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
            // Include all necessary cookies - the curl had many cookies
            'Cookie': `access_token=${tokens.access_token}; refresh_token=${tokens.refresh_token}; csrf_token=${tokens.csrf_token || ''}; session_id=${tokens.session_id || ''}`
        },
        withCredentials: true
    };

    try {
        // Use the actual endpoint from the curl
        const url = `https://${process.env.DOMAIN}/ajax/contacts/list/`;

        // Create form data as in the curl (--data-raw)
        const formData = new URLSearchParams({
            'skip_filter': 'Y',
            'term': query,
            'element_type': '1'
        });

        const response = await axios.post(url, formData.toString(), requestConfig);
        // console.log(JSON.stringify(response.data, null, 2));
        fs.writeFileSync('tests/results/searchResult.json', JSON.stringify(response.data.response.items, null, 2));


        // The response structure is: response.response.items
        const items = response.data?.response?.items || [];

        // Helper to parse Kommo's date formats (supports "Today HH:mm" and "DD/MM/YYYY HH:mm")
        const parseKommoDate = (dateStr) => {
            if (dateStr.startsWith('Today')) {
                // "Today 21:20" -> replace with actual date
                const time = dateStr.replace('Today ', '');
                return dayjs().format('YYYY-MM-DD') + ' ' + time + ':00';
            }
            return dayjs(dateStr, 'DD/MM/YYYY HH:mm').format('YYYY-MM-DD HH:mm:ss');
        };

        const contacts = items.map(item => ({
            created_at: parseKommoDate(item.date_create),
            id: item.id
        }));

        console.log(JSON.stringify(contacts, null, 2))

        return contacts


    } catch (error) {
        console.error("Contact search failed:", error.response?.status, error.response?.data);
        return [];
    }
}

export { searchContact }