import qs from 'qs'

/**
 * Parses the webhook data from the request body.
 * @param {Object} req - Request object
 * @returns {Object} - Parsed data
 */

const parseWebhook = (req) => {
    const raw_data = req.body
    const data = qs.parse(raw_data)

    console.log(JSON.stringify(data))

    if (data.contacts && data.contacts.add) {
        const contact = data.contacts.add[0]
        const contact_id = contact.id
        const contact_name = contact.name

        // Find phone field
        const phoneField = contact.custom_fields?.find(field => field.name === 'Phone' || field.code === 'PHONE')
        const contact_phone = phoneField?.values?.['[0][value]'] ||
            (Array.isArray(phoneField?.values) ? phoneField.values[0]?.value : null)

        // Find email field
        const emailField = contact.custom_fields?.find(field => field.name === 'Email' || field.code === 'EMAIL')
        const contact_email = emailField?.values?.['[0][value]'] ||
            (Array.isArray(emailField?.values) ? emailField.values[0]?.value : null)

        return {
            contact_id,
            contact_name,
            contact_phone,
            contact_email
        }
    }
}

export default parseWebhook
