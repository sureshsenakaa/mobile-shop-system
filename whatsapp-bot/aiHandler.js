require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const SYSTEM_KNOWLEDGE = require('./salesKnowledge');

// Conversation history buffer per customer JID
// Format for Gemini chat history: [{ role: 'user', parts: [{ text: '...' }] }, { role: 'model', parts: [{ text: '...' }] }]
const chatHistories = new Map();
const MAX_HISTORY = 10;

let genAI = null;
let model = null;

function initGemini() {
    const apiKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : '';
    if (apiKey && apiKey !== '') {
        try {
            genAI = new GoogleGenerativeAI(apiKey);
            model = genAI.getGenerativeModel({
                model: "gemini-1.5-flash",
                systemInstruction: SYSTEM_PROMPT,
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 350,
                }
            });
            console.log("✅ Google Gemini AI (Thinking Engine) initialized successfully!");
        } catch (err) {
            console.error("⚠️ Failed to initialize Gemini AI:", err.message);
        }
    } else {
        console.log("ℹ️ No GEMINI_API_KEY found in .env — using Context-Aware Fallback Engine.");
    }
}

const SYSTEM_PROMPT = `
You are "Senaka" / "Kasun", the Senior AI Sales Specialist for "Mobile Zone POS & Phone Shop Management System" in Sri Lanka.
You are chatting with real mobile shop owners on WhatsApp who messaged from Facebook ads.
Think carefully about what the customer is saying and respond naturally, like an experienced Sri Lankan tech salesperson.

CORE SYSTEM FEATURES:
- Fast POS Billing with Barcode & IMEI tracking (5-second billing).
- Phone Repair Job Sheets & Live Service Status Tracking (customers get repair alerts).
- Inventory & Stock Management with Low Stock Alerts.
- Daily Cash Register, Cash Balancing & Shift Reports, Real Profit/Loss calculation.
- 100% Compatible with Thermal Receipt Printers (58mm/80mm) and USB/Wireless Barcode Scanners.
- Staff Role Permissions: Shop owner can limit staff accounts so they can ONLY bill at POS, and CANNOT see profits, buy-costs, or admin reports.

PRICING PLANS:
- 1 Month: Rs. 1,500/= (only Rs. 50 per day)
- 6 Months: Rs. 8,000/=
- 1 Year: Rs. 15,000/= (Best Value)

BANK DETAILS (ONLY send when customer specifically asks how to buy, pay, or wants bank details):
- Bank: Hatton National Bank (HNB)
- Account No: 101020255990
- Branch: Pelmadulla Branch
- Name: Senaka K A S

CRITICAL SALES & THINKING RULES:
1. DYNAMIC CONVERSATION & MEMORY:
   - READ the conversation history carefully.
   - If the customer tells you their location (e.g. "Colombo", "Kandy", "Galle", "Kurunegala", "Jaffna"):
     Acknowledge it warmly! (e.g. "සුපිරි sir! Colombo පැත්තේ Phone shops කිහිපයකටම අපි System එක setup කරලා තියෙනවා...") and smoothly ask if they want to see the 30-second Demo Video or try a Demo Login.
   - If the customer says "Hari", "Ow", "Danna", "Ewanna", "Yes", "OK":
     They are agreeing to your previous question! Immediately send the demo video / preview or relevant info they agreed to.
   - NEVER repeat the exact same welcome greeting if you have already greeted them!
2. LANGUAGE ADAPTABILITY:
   - If customer speaks in Sinhala or Singlish -> Reply in friendly, polite, natural spoken Sinhala.
   - If customer speaks in Tamil or asks "Can u explain tamil" -> Reply in respectful, natural Sri Lankan Tamil (வணக்கம் சார்...).
   - If customer speaks in English -> Reply in professional, concise English.
3. CONCISENESS (DO NOT WRITE ESSAYS):
   - Keep answers SHORT & SWEET (maximum 2 to 4 sentences).
   - WhatsApp users do not read long text. Be direct, helpful, and friendly.
4. CALL TO ACTION:
   - Always end your message with a polite question to keep the conversation flowing.
5. NO PUSHINESS:
   - Do NOT send bank account details in the first 2 messages. First show value, let them see the demo, then provide bank details when they are ready.
`;

// Initialize Gemini on load
initGemini();

/**
 * Handle incoming customer message and return smart response
 */
async function generateSalesReply(senderJid, messageText) {
    const text = messageText.trim();
    const lowerText = text.toLowerCase();

    // Re-check Gemini if initialized dynamically
    if (!model && process.env.GEMINI_API_KEY) {
        initGemini();
    }

    // 1. If Gemini AI is active, use AI Thinking
    if (model) {
        try {
            let history = chatHistories.get(senderJid) || [];
            
            const chat = model.startChat({
                history: history
            });

            const result = await chat.sendMessage(text);
            const reply = result.response.text().trim();

            // Update conversation history
            history.push({ role: 'user', parts: [{ text }] });
            history.push({ role: 'model', parts: [{ text: reply }] });

            if (history.length > MAX_HISTORY * 2) {
                history = history.slice(-MAX_HISTORY * 2);
            }
            chatHistories.set(senderJid, history);

            return reply;
        } catch (err) {
            console.error("Gemini AI error, using fallback engine:", err.message);
        }
    }

    // 2. Intelligent Context-Aware Fallback Engine (when Gemini key is not added yet)
    let history = chatHistories.get(senderJid) || [];
    const hasSpokenBefore = history.length > 0;

    // Track user message in fallback history
    history.push({ role: 'user', parts: [{ text }] });
    chatHistories.set(senderJid, history);

    // Tamil query detection
    if (lowerText.includes('tamil') || /[\u0B80-\u0BFF]/.test(text)) {
        if (lowerText.includes('price') || lowerText.includes('how much') || lowerText.includes('cost') || lowerText.includes('விலை') || lowerText.includes('கட்டணம்')) {
            return SYSTEM_KNOWLEDGE.quickReplies.pricingTamil;
        }
        return SYSTEM_KNOWLEDGE.quickReplies.welcomeTamil;
    }

    // Pricing query
    if (lowerText.includes('price') || lowerText.includes('how much') || lowerText.includes('gana') || lowerText.includes('keeyada') || lowerText.includes('ගාන') || lowerText.includes('මිල')) {
        return SYSTEM_KNOWLEDGE.quickReplies.pricingSinhala;
    }

    // Agreement / Confirmation ("Hari", "Ow", "Ewanna", "Danna", "Ok", "Yes")
    if (/^(hari|ow|danna|ewanna|ok|yes|hri|ha|ela|sure)$/i.test(lowerText) || lowerText.includes('ewanna') || lowerText.includes('danna')) {
        return `නියමයි sir! 👍 

මෙන්න අපේ System එකෙන් තත්පර 5න් Barcode/IMEI Scan කරලා Thermal Bill එකක් Print වෙන හැටි බලන්න පුළුවන්: 📄✨

👉 Demo එක ඔයාටම Try කරලා බලන්න කැමති නම් කියන්න sir, මම Live Demo Login Link එකයි Details එවන්නම්! 😊`;
    }

    // Location response (e.g. "Colombo", "Kandy", "Galle", "Mage shop eka thiyenne...")
    if (lowerText.includes('colombo') || lowerText.includes('kandy') || lowerText.includes('galle') || lowerText.includes('matara') || lowerText.includes('kurunegala') || lowerText.includes('jaffna') || lowerText.includes('thiyenne') || lowerText.includes('shop eka')) {
        return `සුපිරි sir! 📍 ඔය පැත්තේ Mobile Shops කිහිපයකටම අපි මේ System එක දීලා තියෙනවා. 

Shop එකේ දැනට Thermal Printer එකක් හෝ Barcode Scanner එකක් තියෙනවද sir? නැත්නම් Manual ද බිල් දාන්නේ? 😊`;
    }

    // Hardware query (printer / scanner)
    if (lowerText.includes('printer') || lowerText.includes('scanner') || lowerText.includes('thermal') || lowerText.includes('barcode') || lowerText.includes('ප්‍රින්ටර්')) {
        return SYSTEM_KNOWLEDGE.quickReplies.hardwareSinhala;
    }

    // Staff permissions query
    if (lowerText.includes('staff') || lowerText.includes('limit') || lowerText.includes('login') || lowerText.includes('ස්ටාෆ්') || lowerText.includes('ලොගින්')) {
        return SYSTEM_KNOWLEDGE.quickReplies.staffSinhala;
    }

    // Payment / Buy / Bank query
    if (lowerText.includes('buy') || lowerText.includes('account') || lowerText.includes('bank') || lowerText.includes('ganna') || lowerText.includes('සල්ලි') || lowerText.includes('ගන්නේ කොහොමද') || lowerText.includes('ගන්න')) {
        return SYSTEM_KNOWLEDGE.quickReplies.paymentSinhala;
    }

    // If already spoke before and user sent random short text
    if (hasSpokenBefore) {
        return `තේරුණා sir! 😊 System එකේ Phone Repairs Tracking, IMEI Billing සහ Stock Management ඔක්කොම තියෙනවා.

Sir ට System එකේ Demo Video එකක් දාන්නද, නැත්නම් වෙන දැනගන්න ඕන දෙයක් තියෙනවද sir?`;
    }

    // First time default welcome
    return SYSTEM_KNOWLEDGE.quickReplies.welcomeSinhala;
}

module.exports = {
    generateSalesReply
};
