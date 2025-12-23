import axios from 'axios'
import { getStoredTokens, saveTokens } from './tokenUtils.js'
import dotenv from 'dotenv'

dotenv.config()

const clientId = process.env.CLIENT_ID
const clientSecret = process.env.CLIENT_SECRET
const redirectUri = process.env.REDIRECT_URI

const RENEW_INTERVAL = (23 * 60 + 30) * 60 * 1000;

async function renewAccessToken() {
    console.log(`[${new Date().toLocaleTimeString()}] Attempting to renew token...`);
    try {
        const requestData = {
            grant_type: 'refresh_token',
            refresh_token: getStoredTokens().refresh_token,
            redirect_uri: redirectUri,
            client_id: clientId,
            client_secret: clientSecret
        }

        const requestHeaders = {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }

        const { access_token: newAccessToken, refresh_token: newRefreshToken } = await axios.post(`https://${process.env.DOMAIN}/oauth2/access_token`, requestData, requestHeaders).then(response => response.data)

        saveTokens({
            access_token: newAccessToken,
            refresh_token: newRefreshToken
        })

        console.log(`[${new Date().toLocaleTimeString()}] Token renewed successfully.`);
    } catch (error) {
        console.error(`[${new Date().toLocaleTimeString()}] Error renewing token:`, error);
    }

    setTimeout(renewAccessToken, RENEW_INTERVAL)

}

export default renewAccessToken;