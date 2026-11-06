// Sales Knowledge Base for Mobile Shop POS & Repair System

const SYSTEM_KNOWLEDGE = {
    systemName: "Mobile Zone POS & Repair Management System",
    pricing: {
        oneMonth: "Rs. 1,500/=",
        sixMonths: "Rs. 8,000/=",
        oneYear: "Rs. 15,000/= (Best Value)",
        dailyCost: "Rs. 50/= per day"
    },
    bankDetails: {
        bank: "Hatton National Bank (HNB)",
        accountNo: "101020255990",
        branch: "Pelmadulla Branch",
        accountName: "Senaka K A S"
    },
    contacts: {
        phone: "074 072 3511 / 075 501 9560",
        whatsapp: "074 072 3511"
    },
    features: [
        "Fast POS Billing with Barcode & IMEI tracking",
        "Phone Repair Job Sheets & Live Tracking for Customers",
        "Stock Inventory Management with Low Stock Alerts",
        "Daily Cash Register, Profit/Loss & Shift Balancing",
        "Quotation & Invoicing System",
        "Supplier & Purchase Order (PO) Management",
        "Staff Permissions & Role Limits (Lock POS from seeing admin reports/profit)",
        "100% Compatible with Thermal Receipt Printers (58mm/80mm) & Handheld Barcode Scanners"
    ],

    // Quick instant fallback responses if Gemini is not used or quota is exceeded
    quickReplies: {
        welcomeSinhala: `ආයුබෝවන් sir! 🙏 

අපේ Mobile Shop & Repair Management Cloud System එක ගැන විමසීමට ස්තූතියි! 📱✨

මේකෙන් Phone IMEI & Barcode වලින් තත්පර 5න් බිල් ගැසීම, Phone Repairs Tracking, Stock සහ Daily Profit ලේසියෙන්ම බලාගන්න පුළුවන්.

Sir ගේ Shop එක තියෙන්නේ කොහේද? System එකේ වැඩ කරන හැටි බලන්න පොඩි Demo Video එකක් එවන්නද sir? 😊`,

        welcomeTamil: `வணக்கம் சார்! 🙏

Mobile Shop & Repair Center-களுக்கான எங்கள் Cloud POS System பற்றி கேட்டதற்கு நன்றி! 📱✨

இதில் Phone IMEI & Barcode மூலம் Fast Billing, Repair Job Sheets, Stock & Daily Profit கணக்குகளை மிக எளிதாக நிர்வகிக்கலாம்.

System எப்படி இயங்குகிறது என்று பார்க்க ஒரு சிறிய Demo Video அனுப்பவா சார்? 😊`,

        pricingSinhala: `අපේ System එකේ ගාස්තු විස්තර මෙන්න sir: 💎

✨ 01 Month: Rs. 1,500/= (දවසට Rs. 50/- පමණයි)
✨ 06 Months: Rs. 8,000/=
✨ 01 Year: Rs. 15,000/= (Best Value)

Laptop එකෙන් හෝ Phone එකෙන් කෙලින්ම Run කරන්න පුළුවන්. Sir ට Demo Link එකක් එවන්නද Try කරලා බලන්න? 😊`,

        pricingTamil: `கட்டண விபரங்கள் (Pricing): 💎

✨ 01 Month Plan: Rs. 1,500/= (நாளைக்கு Rs. 50 மட்டுமே)
✨ 06 Months Plan: Rs. 8,000/=
✨ 01 Year Plan: Rs. 15,000/= (Best Value)

System-ஐ Login செய்து பார்க்க Demo Link அனுப்பவா சார்? 😊`,

        hardwareSinhala: `Hardware ගැන කිසිම බයක් වෙන්න එපා sir! 🖨️✅

අපේ System එක ලංකාවේ තියෙන ඕනෑම:
✔️ 58mm / 80mm Thermal Receipt Printer (XP-58, Xprinter, etc.)
✔️ USB / Wireless Handheld Barcode Scanner
✔️ Regular A4 / A5 Invoices Printer
එක්ක 100% කිසිම අමතර Software නැතුව කෙලින්ම වැඩ කරනවා.

Shop එකේ දැනට Printer එකක් තියෙනවද sir?`,

        staffSinhala: `ඔව් සහතිකෙන්ම sir! 🛡️👥

Staff එකට Login වෙනම හදලා දෙන්න පුළුවන්. Staff එකට:
✔️ Sales (POS Billing) එකට විතරක් Login වෙන්න පුළුවන්.
❌ Stock Cost (ගත්ත මිල), Reports, Dashboard හෝ Profit බලන්න බෑ (Lock කරලා තියෙන්නේ).

ඔබ Shop එකේ නැති වෙලාවටත් ආරක්ෂිතව Shop එක Run කරගන්න මේකෙන් පුළුවන් sir! 👍`,

        paymentSinhala: `System එක සක්‍රිය (Activate) කරගන්නේ මෙහෙමයි sir: 🚀

1️⃣ පහත බැංකු ගිණුමට තෝරාගත් Plan එකේ මුදල තැන්පත් කරන්න:
🏦 Bank: Hatton National Bank (HNB)
🔢 Account: 101020255990
📍 Branch: Pelmadulla Branch
👤 Name: Senaka K A S

2️⃣ Payment Slip එක, Shop එකේ නම සහ Logo එක එවන්න.
මිනිත්තු 10ක් ඇතුළත System එක Activate කර Login විස්තර ලබාදෙනු ලැබේ! ✅`
    }
};

module.exports = SYSTEM_KNOWLEDGE;
