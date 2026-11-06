require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const SYSTEM_KNOWLEDGE = require('./salesKnowledge');

// Conversation history buffer (keeps recent messages per customer)
const chatHistories = new Map();
const MAX_HISTORY = 6;

let genAI = null;
let model = null;

if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '') {
    try {
        genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY.trim());
        model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 250, // Keep responses crisp and concise
            }
        });
        console.log("✅ Google Gemini AI initialized successfully!");
    } catch (err) {
        console.error("⚠️ Failed to initialize Gemini AI:", err.message);
    }
} else {
    console.log("ℹ️ No GEMINI_API_KEY found in .env — using Smart Rule-Based Fallback Engine.");
}

const SYSTEM_PROMPT = `
You are the official AI Sales Specialist for "Mobile Zone POS & Phone Shop Management System" in Sri Lanka.
Your mission is to engage potential shop owners who messaged from Facebook ads, answer their questions, build trust, and gently guide them to try a demo or activate their shop subscription.

SYSTEM KNOWLEDGE:
- Product: Cloud-based POS Billing & Management System for Mobile Phone Shops & Repair Centers.
- Key Capabilities:
  1. Barcode & IMEI tracking for mobile phones and accessories (5-second fast billing).
  2. Phone Repair Job Sheets & Live Status Tracking for customers.
  3. Stock & Inventory Management with Low Stock Alerts.
  4. Daily Cash Register, Shift Balancing, and Real Profit/Loss calculation.
  5. 100% Compatible with Thermal Receipt Printers (58mm, 80mm) and Handheld Barcode Scanners.
  6. Staff Accounts & Permissions: Shop owners can limit staff so they can ONLY bill at POS, and CANNOT see profits, buy-costs, or admin reports.
- Pricing:
  - 1 Month: Rs. 1,500/= (only Rs. 50 per day)
  - 6 Months: Rs. 8,000/=
  - 1 Year: Rs. 15,000/= (Best Value)
- Bank Details (ONLY share if customer specifically asks how to pay, buy, or wants bank account):
  - Bank: Hatton National Bank (HNB)
  - Account No: 101020255990
  - Branch: Pelmadulla Branch
  - Name: Senaka K A S

CRITICAL SALES RULES:
1. LANGUAGE ADAPTABILITY:
   - If customer writes in Sinhala (or Singlish like "system eka kohomada laba ganne"): Reply in polite, friendly, natural spoken Sinhala.
   - If customer writes in Tamil (or Tanglish, or asks for Tamil): Reply in polite, natural Sri Lankan Tamil (வணக்கம் சார்...).
   - If customer writes in English: Reply in clear, professional English.
2. CONCISENESS (VERY IMPORTANT):
   - Keep answers SHORT and easy to read on mobile (maximum 2 to 4 sentences).
   - NEVER dump huge walls of text or long essays.
3. CONVERSATIONAL HOOK:
   - Always end your message with a polite, low-pressure question (e.g. "Shop එක තියෙන්නේ කොහේද sir?", "Demo video එකක් එවන්නද sir?", "Shop එකේ දැනට Printer එකක් තියෙනවද sir?").
4. BANK DETAILS TIMING:
   - DO NOT send bank account details in the first greeting or inquiry. Only provide bank details when the customer says they want to buy, activate, or asks for payment details.
`;

/**
 * Handle incoming customer message and return smart response
 */
async function generateSalesReply(senderJid, messageText) {
    const text = messageText.trim();
    const lowerText = text.toLowerCase();

    // 1. If Gemini AI is active, use it for hyper-natural, contextual replies
    if (model) {
        try {
            // Get or create conversation history
            let history = chatHistories.get(senderJid) || [];
            
            // Build contents for Gemini
            const contents = [
                { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
                { role: "model", parts: [{ text: "Understood. I will act as the warm, professional, concise Mobile Zone sales specialist, adapting fluently to Sinhala, Tamil, or English." }] }
            ];

            // Add previous dialog
            history.forEach(h => {
                contents.push({ role: h.role, parts: [{ text: h.text }] });
            });

            // Add current message
            contents.push({ role: "user", parts: [{ text }] });

            const result = await model.generateContent({ contents });
            const reply = result.response.text().trim();

            // Save to history buffer
            history.push({ role: "user", text });
            history.push({ role: "model", text: reply });
            if (history.length > MAX_HISTORY * 2) {
                history = history.slice(-MAX_HISTORY * 2);
            }
            chatHistories.set(senderJid, history);

            return reply;
        } catch (err) {
            console.error("Gemini API error, falling back to smart rules:", err.message);
        }
    }

    // 2. Smart Rule-Based Fallback Engine
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

    // Default welcome / general inquiry
    return SYSTEM_KNOWLEDGE.quickReplies.welcomeSinhala;
}

module.exports = {
    generateSalesReply
};
