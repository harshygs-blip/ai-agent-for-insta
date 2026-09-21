// Vercel Serverless Function: Meta Instagram & WhatsApp Webhook
const https = require('https');

const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'harsh_store_verify_2026';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

const MASTER_SYSTEM_PROMPT = `You are the AI customer support and sales agent for 'The Harsh Seller' (FF Store / Instagram: ff_trusted_deals1).
You sell verified Free Fire (Garena) game accounts/IDs.
Always reply to the customer in natural, confident, and polite Hinglish (Hindi + English).

CORE BUSINESS RULES (NEVER BREAK):
1. PAYMENT FIRST ALWAYS: Never share login/password/email before payment. Login info is provided only after half or full payment.
2. PRICE IS FIXED: No discounts, no negotiations, ever. If someone asks for discount: "Sorry brother, price fixed hai, 500 se niche kuchh nahi hai".
3. MINIMUM BUDGET: Minimum standard price is ₹500 (or ₹300 for starter accounts). If someone asks below ₹500: "Sorry brother 500₹ se niche nai hai".
4. WHEN GREETED (hi / hello / id chahiye): Welcome the customer politely, mention budget ranges (₹500 to ₹7000), and ask their preference: "Konsa buy Karoge bro, screenshot de do id upload hai mere profile me. Official WhatsApp: +91 7318211010".
5. IF CUSTOMER WANTS TO SEE BEFORE PAYING: Offer Teamcode verification: "Teamcode me aake ID dikha dunga. Collection upload hai profile me."
6. IF CUSTOMER ASKS ABOUT SCAM / PROOF: Share trust message: "Brother hum bhi nahi chata haii ke kiska mehnat ka paisa barbad jaya isleya bhai hum koi scam nhi kar tha haii koi fraud nhi. Trust me ❤️. Proofs story highlights me upload hai."
7. PAYMENT METHODS: UPI (PhonePe, Google Pay, Paytm). "Pay and send me screenshot".
8. TONE: Direct, honest, confident, respectful Hinglish. Fast responses.`;

async function callGemini(userText) {
  if (!GEMINI_API_KEY) {
    return "Yes bolo bro! Konsa buy karna hai mere profile mai ID post hai dekhlo fir screenshot bhej do. Fast response ke liye WhatsApp: +91 7318211010";
  }

  const payload = JSON.stringify({
    system_instruction: { parts: [{ text: MASTER_SYSTEM_PROMPT }] },
    contents: [{ role: 'user', parts: [{ text: userText }] }],
    generationConfig: { temperature: 0.3, maxOutputTokens: 300 }
  });

  return new Promise((resolve) => {
    const req = https.request(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
      timeout: 8000
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const reply = parsed.candidates[0].content.parts[0].text.trim();
          resolve(reply);
        } catch (e) {
          resolve("Yes bolo bro! Profile me ID check kar lo aur WhatsApp par message karo: +91 7318211010");
        }
      });
    });
    req.on('error', () => resolve("Yes bolo bro! WhatsApp par message karo: +91 7318211010"));
    req.write(payload);
    req.end();
  });
}

module.exports = async (req, res) => {
  // 1. Meta Webhook Verification Handshake (GET)
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED');
      return res.status(200).send(challenge);
    } else {
      return res.status(403).send('Verification token mismatch');
    }
  }

  // 2. Incoming Message Event (POST)
  if (req.method === 'POST') {
    try {
      const body = req.body;
      let userText = "Hi";

      if (body.object === 'instagram' || body.object === 'page') {
        const entry = body.entry && body.entry[0];
        const messaging = entry && entry.messaging && entry.messaging[0];
        if (messaging && messaging.message && messaging.message.text) {
          userText = messaging.message.text;
        }
      }

      const reply = await callGemini(userText);
      return res.status(200).json({ status: 'SUCCESS', reply });
    } catch (err) {
      return res.status(200).json({ status: 'ERROR', message: err.message });
    }
  }

  return res.status(405).send('Method Not Allowed');
};
