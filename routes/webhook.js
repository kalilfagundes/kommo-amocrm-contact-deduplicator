import express from 'express';
import { searchContact } from '../controllers/searchContact.js';
import { mergeQueue } from '../queues/mergeQueue.js';
import parseWebhook from '../controllers/parseWebhook.js';

const router = express.Router();

router.use(express.json());

router.post('/', async (req, res) => {
    const parsedData = parseWebhook(req)
    console.log('Contact ID:', parsedData.contact_id)
    console.log('Contact Name:', parsedData.contact_name)
    console.log('Contact Phone:', parsedData.contact_phone)
    console.log('Contact Email:', parsedData.contact_email)

    let searchResult = []

    try {
        searchResult = await searchContact(parsedData.contact_phone);
    } catch (error) {
        console.error("Couldn't find contacts using phone number");
        try {
            searchResult = await searchContact(parsedData.contact_email);
        } catch (error) {
            console.error("Couldn't find contacts using email");
        }
    }
    if (searchResult.length === 1) {
        res.status(200).send('No duplicates found');
    } else if (searchResult.length === 0) {
        res.status(200).send('Contact not found');
    } else {
        await mergeQueue.add('merge-contacts', {
            searchResult,
            contactId: parsedData.contact_id,
            contactName: parsedData.contact_name
        });
        console.log('Duplicates found, added to queue.');
        res.status(200).send('Duplicates found. Added to processing queue.');
    }
});

export default router;