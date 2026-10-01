# WhatsApp Real-Estate Broker Platform MVP

A WhatsApp-first real-estate inventory assistant that lets brokers maintain their inventory through Excel and instantly search their own inventory by forwarding client requirements to WhatsApp.

## Project Overview

This MVP enables real-estate brokers to:
1. Upload their complete property inventory using a standardized Excel template via a React dashboard.
2. Link their WhatsApp number.
3. Instantly query their own inventory directly from WhatsApp using natural language ("2bhk Andheri West under 1.5cr").
4. Retrieve property details directly within WhatsApp.

## Architecture

- **Frontend**: React.js, Vite, Tailwind CSS, Lucide React
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Mongoose)
- **WhatsApp Integration**: Official Meta WhatsApp Business Cloud API
- **Excel Parsing**: `xlsx` package
- **Authentication**: JWT, bcrypt

### Data Flow
1. **Inventory Management**: Broker logs into Dashboard -> Uploads Excel -> Backend parses & validates -> MongoDB stores properties.
2. **WhatsApp Search**: Client messages Broker -> Broker forwards message to Platform WhatsApp number -> Meta Webhook triggered -> Backend maps sender to broker -> Natural language parsing -> MongoDB search -> WhatsApp response.

## Folder Structure

\`\`\`text
P1/
├── backend/
│   ├── src/
│   │   ├── config/          # Database configuration
│   │   ├── controllers/     # Route logic
│   │   ├── middleware/      # Authentication
│   │   ├── models/          # Mongoose models
│   │   ├── routes/          # Express routes
│   │   ├── services/        # Business logic, Excel parsing, NLP, WhatsApp
│   │   └── utils/           # Excel template generator
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/         # AuthContext
│   │   ├── hooks/
│   │   ├── layouts/         # Dashboard layout
│   │   ├── pages/           # Login, Register, Home, Inventory, Upload, History
│   │   ├── services/        # API client
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
└── README.md
\`\`\`

## Cost Breakdown

- **React/Vite**: ₹0
- **Node.js/Express**: ₹0
- **MongoDB local / Atlas free tier**: ₹0
- **Mongoose / xlsx / JWT / bcrypt**: ₹0
- **Tailwind CSS**: ₹0
- **Git/GitHub**: ₹0
- **Rule-based parser**: ₹0
- **ngrok/free tunnel**: ₹0

**Note on WhatsApp API**: During development, Meta provides test credentials and a test number at no cost. For production, sending/receiving messages beyond the free tier limits may incur charges depending on the country and message category.

## Environment Variables

### Backend (\`.env\` in \`backend/\`)
\`\`\`env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/realestate-mvp
JWT_SECRET=super_secret_key_123
WHATSAPP_ACCESS_TOKEN=your_meta_access_token
WHATSAPP_PHONE_NUMBER_ID=your_test_phone_number_id
WHATSAPP_VERIFY_TOKEN=your_custom_verify_token
WHATSAPP_API_VERSION=v17.0
\`\`\`

## Local Development Instructions

### 1. MongoDB Setup
Ensure you have MongoDB running locally on \`mongodb://localhost:27017\` or provide an Atlas URL in the \`.env\` file.

### 2. Backend Setup
\`\`\`bash
cd backend
npm install
npm run dev # or node server.js
\`\`\`
The backend will run on http://localhost:5000.

### 3. Frontend Setup
\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`
The frontend will run on http://localhost:5173.

### 4. ngrok Setup (For WhatsApp Webhooks)
\`\`\`bash
ngrok http 5000
\`\`\`
Copy the forwarding URL (e.g., \`https://xyz.ngrok-free.app\`).

### 5. Meta WhatsApp Cloud API Setup
1. Go to the [Meta Developer Dashboard](https://developers.facebook.com/).
2. Create an App -> Set up WhatsApp.
3. Add your webhook URL: \`https://xyz.ngrok-free.app/api/whatsapp/webhook\`.
4. Add the \`WHATSAPP_VERIFY_TOKEN\` you specified.
5. Get the Temporary Access Token and Phone Number ID and update the \`.env\` file.
6. Add your personal WhatsApp number as a recipient in the Meta dashboard.

## Testing Instructions

1. **Register**: Go to \`http://localhost:5173/register\` and create an account. **Make sure your WhatsApp number exactly matches the one you will use to send messages to the platform.**
2. **Download Template**: On the Upload page, click "Download Template".
3. **Upload Inventory**: Fill it out, upload, review the validation preview, and confirm.
4. **WhatsApp Testing**: Send a message like "2bhk Andheri West under 1.5cr" to the Meta Test Number.
5. **Verify**: You should receive a structured response with your properties, formatted nicely. Reply with \`1\` to get full details.
6. **Data Isolation**: Register a second account with a different WhatsApp number and upload different properties. Confirm you cannot access the first account's properties.

## Security Notes
- Broker passwords are hashed using bcrypt.
- API is protected via JWT and queries are strictly bound to \`req.user.id\`.
- Webhooks strictly enforce the \`brokerId\` lookup based on the normalized incoming sender number.
- MongoDB Injection protection is covered by Mongoose type casting.

## Limitations & Future Improvements
- **Parser Limitations**: The NLP parser is rule-based and uses regex. It handles standard structured messages effectively but could fail on complex edge cases.
- **Future Support for Local AI**: Can integrate local LLMs (like LLaMA via Ollama) to parse complex natural language into JSON while maintaining ₹0 cost.
- **Image Support**: Allow image uploads for property details via WhatsApp.
