import express from 'express';
import webhookData from './routes/webhook.js';
import renewAccessToken from './scripts/tokenRefresher.js';

const app = express();

app.use(express.json());

app.post('/', webhookData);

app.listen(3000, () => {
  console.log('Server is running on port 3000');

  renewAccessToken();
});