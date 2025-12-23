import axios from 'axios';
import fs from 'fs';
import { getStoredTokens } from '../scripts/tokenUtils.js';
// import { intelligentMerge } from "../utils/namePicker.js";
import { deduplicate } from "../utils/phoneDeduplicate.js";
import { unescapeHTML } from "../utils/unescapeHTML.js";
import { analyzeNamesWithIA } from "../utils/namePickerWithIA.js";
import dotenv from 'dotenv';
dotenv.config()

/**
 * merge logic
 * @param {Object} mergeInfo - Data to merge
 * @returns {Object} - Parsed data
 */

const mergeLogic = async (mergeInfo) => {
    if (mergeInfo != null) {
        const explicitlyHandledFields = ['NAME', 'MAIN_USER_ID', 'TAGS', 'LEADS', 'cfv_993074'];
        const contacts = mergeInfo.ids_and_creation_date
        const responseData = mergeInfo.merge_info.response

        //oldest contact
        const oldestContactId = contacts.sort((a, b) => a.created_at - b.created_at)[0].id
        const newestContactId = contacts.sort((a, b) => b.created_at - a.created_at)[0].id

        console.log("Oldest Contact ID:", oldestContactId)
        console.log("Newest Contact ID:", newestContactId)

        const contactIds = responseData.elements;

        const params = new URLSearchParams();

        // ID that will be maintained

        params.append('result_element[ID]', oldestContactId);

        // IDs participating the Merge

        for (const id of contactIds) {
            params.append('id[]', id);
            console.log("id[]", id);
        }

        // NAME
        const allNames = Object.values(responseData.compare_values.NAME).flatMap(entry => entry.values).map(name => name.value);
        // const chosenName = await intelligentMerge(allNames);
        const chosenName = await analyzeNamesWithIA(allNames);

        if (chosenName) {
            params.append('result_element[NAME]', chosenName);
            console.log("result_element[NAME]", chosenName);
        } else {
            // Fallback: use the newest contact's name
            const newestNameEntry = responseData.compare_values.NAME[newestContactId];
            const fallbackName = newestNameEntry?.values?.[0]?.value || 'Sem nome';
            params.append('result_element[NAME]', fallbackName);
            console.log("result_element[NAME] (fallback - newest)", fallbackName);
        }

        // Main User ID (Responsible User)
        const newestMainUserEntry = responseData.compare_values.MAIN_USER_ID[newestContactId];
        if (newestMainUserEntry && newestMainUserEntry.values[0]) {
            params.append('result_element[MAIN_USER_ID]', newestMainUserEntry.values[0].value);
            console.log("result_element[MAIN_USER_ID]", newestMainUserEntry.values[0].value);
        }

        // TAGS
        if (responseData.compare_values.TAGS) {
            const allTags = Object.values(responseData.compare_values.TAGS).flatMap(entry => entry.values);
            for (const tag of allTags) {
                params.append('result_element[TAGS][]', tag.value);
                console.log("result_element[TAGS][]", tag.value);
            }
        }

        // LEADS
        if (responseData.compare_values.LEADS) {
            const allLeads = Object.values(responseData.compare_values.LEADS).flatMap(entry => entry.values);
            for (const lead of allLeads) {
                for (const leadId of Object.keys(lead.value)) {
                    params.append('result_element[LEADS][]', leadId);
                    console.log("result_element[LEADS][]", leadId);
                }
            }
        }

        // Custom field values (cfv) - telefones
        if (responseData.compare_values.cfv_993074) {
            const allPhones = Object.values(responseData.compare_values.cfv_993074)
                .flatMap(entry => entry.values)
                .map(value => value.text.replace(/[^0-9]/g, ''));

            const deduplicatedPhones = await deduplicate(allPhones);
            console.log("Deduplicated Phones:", deduplicatedPhones);

            for (const phone of deduplicatedPhones) {
                params.append('result_element[cfv][993074][]', JSON.stringify({
                    "DESCRIPTION": "WORK",
                    "VALUE": phone
                }));
                console.log("result_element[cfv][993074][]", phone);
            }
        }


        // Checked Fields Logic
        for (const [key, fieldData] of Object.entries(responseData.compare_values)) {
            if (explicitlyHandledFields.includes(key)) continue;

            const checkedValues = Object.values(fieldData)
                .flatMap(entry => entry.values)
                .filter(item => item && item.checked === true);

            if (checkedValues.length > 0) {
                const control = responseData.controls ? responseData.controls[key] : null;
                let paramName = control ? control.name : null;

                for (const item of checkedValues) {
                    params.append(paramName, unescapeHTML(item.value));
                    console.log(paramName, unescapeHTML(item.value));
                }

            }
        }

        // Selected Fields Logic
        for (const [key, fieldData] of Object.entries(responseData.compare_values)) {
            if (explicitlyHandledFields.includes(key)) continue;

            const selectedValues = Object.values(fieldData)
                .flatMap(entry => entry.values)
                .filter(item => item && item.selected === true);

            if (selectedValues.length > 0) {
                const control = responseData.controls ? responseData.controls[key] : null;
                let paramName = control ? control.name : null;

                for (const item of selectedValues) {
                    params.append(paramName, unescapeHTML(item.value));
                    console.log(paramName, unescapeHTML(item.value));
                }
            }

        }


        // Get authentication tokens
        const tokens = getStoredTokens();

        // Build request configuration
        const requestConfig = {
            headers: {
                'accept': 'application/json, text/javascript, */*; q=0.01',
                'accept-language': 'pt-BR,pt;q=0.9,en;q=0.8',
                'cache-control': 'no-cache',
                'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'pragma': 'no-cache',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin',
                'x-requested-with': 'XMLHttpRequest',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
                'referer': `https://${process.env.DOMAIN}/contacts/list/contacts/`,
                'Cookie': `access_token=${tokens.access_token}; refresh_token=${tokens.refresh_token}; csrf_token=${tokens.csrf_token || ''}`
            },
            withCredentials: true
        };

        try {
            const url = `https://${process.env.DOMAIN}/ajax/merge/contacts/save`;

            console.log('\n--- MERGE REQUEST ---');
            console.log('URL:', url);
            console.log('Body:', params.toString());

            const response = await axios.post(url, params.toString(), requestConfig);

            console.log('\n--- MERGE RESPONSE ---');
            console.log('Status:', response.status);
            console.log('Data:', JSON.stringify(response.data, null, 2));

            // Salvar resultado do merge
            fs.writeFileSync('tests/results/mergeResult.json', JSON.stringify(response.data, null, 2));
            console.log('Resultado salvo em: mergeResult.json');

            return {
                success: true,
                status: response.status,
                data: response.data
            };
        } catch (error) {
            console.error('\n--- MERGE ERROR ---');
            console.error('Status:', error.response?.status);
            console.error('Error:', error.response?.data || error.message);

            // Salvar erro do merge
            fs.writeFileSync('tests/results/mergeError.json', JSON.stringify({
                status: error.response?.status,
                error: error.response?.data || error.message
            }, null, 2));
            console.log('Erro salvo em: mergeError.json');

            return {
                success: false,
                status: error.response?.status,
                error: error.response?.data || error.message
            };
        }
    }
}

export { mergeLogic };