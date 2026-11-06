const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const path = require('path');
const { generateSalesReply } = require('./aiHandler');
require('dotenv').config();

// Track processed messages to prevent duplicate triggers
const processedMessageIds = new Set();

async function startBot() {
    console.log("Initializing WhatsApp Bot session...");
    const authPath = path.join(__dirname, 'auth_info_baileys');
    const { state, saveCreds } = await useMultiFileAuthState(authPath);
    
    let version;
    try {
        const vInfo = await fetchLatestBaileysVersion();
        version = vInfo.version;
    } catch {
        version = [2, 3000, 1015901307];
    }

    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }), // Suppress noisy protocol logs
        printQRInTerminal: true,
        auth: state,
        browser: ['Mobile Zone AI Assistant', 'Chrome', '124.0.0']
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log("\n==================================================================");
            console.log("📲 SCAN THIS QR CODE WITH YOUR WHATSAPP TO CONNECT THE BOT:");
            console.log("==================================================================\n");
            qrcode.generate(qr, { small: true });
            console.log("\n👉 How to connect:");
            console.log("1. Open WhatsApp on your mobile phone");
            console.log("2. Tap Settings (or 3 dots) -> Linked Devices -> Link a Device");
            console.log("3. Scan the QR code shown above!\n");
        }

        if (connection === 'close') {
            const statusCode = (lastDisconnect?.error)?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            console.log(`⚠️ Connection closed (code: ${statusCode}). Reconnecting: ${shouldReconnect}...`);
            if (shouldReconnect) {
                setTimeout(startBot, 4000);
            } else {
                console.log("❌ Device logged out. Please delete 'auth_info_baileys' folder and re-scan QR code.");
            }
        } else if (connection === 'open') {
            console.log("\n🚀 ==================================================================");
            console.log("✅ WHATSAPP SALES BOT IS LIVE & CONNECTED SUCCESSFULLY!");
            console.log("🤖 Waiting for customer messages from Facebook Ads & WhatsApp chats...");
            console.log("==================================================================\n");
        }
    });

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;

        for (const msg of messages) {
            // Ignore messages sent by bot itself, status broadcasts, or group chats
            if (!msg.message || msg.key.fromMe) continue;
            
            const messageId = msg.key.id;
            if (processedMessageIds.has(messageId)) continue;
            processedMessageIds.add(messageId);
            if (processedMessageIds.size > 2000) {
                processedMessageIds.clear();
            }

            const senderJid = msg.key.remoteJid;
            // Only respond to direct private chats
            if (!senderJid || senderJid.endsWith('@g.us') || senderJid === 'status@broadcast') continue;

            // Extract message text content
            const text = msg.message.conversation ||
                         msg.message.extendedTextMessage?.text ||
                         msg.message.imageMessage?.caption ||
                         '';

            if (!text || text.trim() === '') continue;

            const senderNumber = senderJid.split('@')[0];
            console.log(`\n📩 [Customer +${senderNumber}]: "${text}"`);

            try {
                // Natural typing indicator
                await sock.sendPresenceUpdate('composing', senderJid);
                
                // Human-like pause (1.5 seconds)
                await new Promise(res => setTimeout(res, 1500));

                // Generate intelligent reply via Gemini or smart fallback
                const reply = await generateSalesReply(senderJid, text);

                // Send the reply message
                await sock.sendMessage(senderJid, { text: reply });
                console.log(`💬 [Bot Replied to +${senderNumber}]:\n"${reply.split('\n')[0]}..."`);

                await sock.sendPresenceUpdate('paused', senderJid);
            } catch (err) {
                console.error(`❌ Failed to send reply to +${senderNumber}:`, err.message);
            }
        }
    });
}

startBot().catch(err => {
    console.error("Critical error in WhatsApp Bot:", err);
});
