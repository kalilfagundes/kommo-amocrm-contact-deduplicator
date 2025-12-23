# Kommo Deduplicate

An automated contact deduplication server for [Kommo CRM](https://www.kommo.com/) that detects and merges duplicate contacts using AI-powered name analysis and intelligent merge logic.

It probably also works with AmoCRM but I haven't tested it yet.

**This is an on-going educational project and not intended for production use. It is not recommended to use this server in a production environment.**

## 🎯 What It Does

This server listens for webhooks from Kommo CRM and automatically:

1. **Detects duplicate contacts** - Searches for contacts matching by phone number or email
2. **Uses AI for smart merging** - Leverages Google Gemini AI to choose the most complete and accurate contact name. But there's also a namePicker that does not use IA in utils/ folder.
3. **Merges contacts intelligently** - Combines all data (tags, leads, phone numbers, custom fields) while keeping the oldest contact record. 

IMPORTANT: Selection fields values are prioritized based on contact creation date, infering that newer contacts will have more updated data. All check fields values are conservated regardless.

4. **Processes asynchronously** - Uses BullMQ queues to handle merges without blocking webhook responses. BullMQ uses rate limits to not overload KOMMOs/AmoCRM server.

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Kommo CRM     │────▶│  Webhook Route  │────▶│   Search for    │
│   (Webhook)     │     │   (Express)     │     │   Duplicates    │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                          │
                        ┌─────────────────┐               │
                        │   Merge Queue   │◀──────────────┘
                        │    (BullMQ)     │       (if duplicates found)
                        └────────┬────────┘
                                 │
                        ┌────────▼────────┐
                        │   Merge Logic   │
                        │  + AI Analysis  │
                        └────────┬────────┘
                                 │
                        ┌────────▼────────┐
                        │   Kommo API     │
                        │  (Save Merge)   │
                        └─────────────────┘
```

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **Node.js** | Runtime environment |
| **Express 5** | Web framework for webhook handling |
| **BullMQ** | Job queue for async merge processing |
| **Redis** | Message broker for BullMQ |
| **Google Gemini AI** | Intelligent name analysis |
| **Axios** | HTTP client for Kommo API calls |
| **Day.js** | Date/time parsing |
| **Docker** | Containerization |

## 📦 Installation

### Prerequisites

- Node.js 18+
- Redis server (or use Docker)
- Kommo CRM account with Integration's API access
- Google AI API key

## 🚀 Steps to run

1. Create an Integration, configure it in Kommo/AmoCRM and get the client ID, client secret, redirect URI and Authorization Code.
2. Get the first access_token and refresh_token via https://developers.kommo.com/reference/get-token and add it to tokens.json. From this, the server will refresh the tokens every 23 hours.
3. Configure .env file using .env.example as template
4. Run the server using docker.
5. Configure a webhook in Kommo CRM for added contacts to be sent to your server's URL (port 3000)
6. When a contact is created, the webhook triggers the deduplication process
7. If duplicates are found, they are automatically merged with intelligent field selection


## 📁 Project Structure

```
kommo-deduplicate/
├── controllers/
│   ├── mergeInfo.js       # Fetches merge preview data from Kommo
│   ├── mergeLogic.js      # Main merge logic and API call
│   ├── parseWebhook.js    # Parses incoming webhook data
│   └── searchContact.js   # Searches for duplicate contacts
├── queues/
│   └── mergeQueue.js      # BullMQ queue for async processing
├── routes/
│   └── webhook.js         # Express webhook route handler
├── scripts/
│   ├── tokenRefresher.js  # OAuth token refresh handler
│   └── tokenUtils.js      # Token storage utilities
├── utils/
│   ├── namePicker.js      # Rule-based name selection
│   ├── namePickerWithIA.js # AI-powered name selection
│   ├── phoneDeduplicate.js # Phone number deduplication
│   └── unescapeHTML.js    # HTML entity decoder
├── server.js              # Main application entry point
├── docker-compose.yml     # Docker services configuration
└── Dockerfile             # Container build instructions
```

## 🔧 Development

```bash
# Run in development mode with hot reload
npm run dev

# Run tests
npm test

# Start production server
npm start
```

## 📝 License

ISC
