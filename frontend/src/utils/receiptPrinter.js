import { resolveMediaUrl } from '../api/config';

/**
 * Retrieves the configured printer settings from localStorage
 */
export function getPrinterSettings() {
    return {
        // 'thermal-80mm' | 'thermal-58mm' | 'standard-a4'
        receiptType: localStorage.getItem('receiptType') || 'thermal-80mm',
        receiptFooter: localStorage.getItem('receiptFooter') !== null 
            ? localStorage.getItem('receiptFooter') 
            : 'Thank you for your purchase! Warranty claims require this original bill.',
        showImei: localStorage.getItem('receiptShowImei') !== 'false',
        showCustomer: localStorage.getItem('receiptShowCustomer') !== 'false',
        showShopAddress: localStorage.getItem('receiptShowAddress') !== 'false',
        showShopPhone: localStorage.getItem('receiptShowPhone') !== 'false',
        customHeader: localStorage.getItem('receiptCustomHeader') || ''
    };
}

/**
 * Formats date into readable string
 */
function formatDate(d) {
    if (!d) return new Date().toLocaleString();
    const date = (typeof d === 'number' || (!isNaN(Number(d)) && String(d).trim() !== '')) 
        ? new Date(Number(d)) 
        : new Date(d);
    if (isNaN(date.getTime())) return String(d);
    return date.toLocaleString('en-GB', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: true 
    });
}

/**
 * Generates the receipt HTML based on selected printer type
 */
export function generateReceiptHtml(sale, options = {}) {
    const settings = { ...getPrinterSettings(), ...options };
    const { authUser, productsMap = {} } = options;

    const customerName = sale.customerName || (sale.customer && (sale.customer.name || sale.customer.customerName)) || 'Walk-in';
    const customerMobile = sale.customerMobile || (sale.customer && (sale.customer.mobile || sale.customer.phone)) || '';

    const shop = sale.Shop || sale.shop || authUser || {};
    const shopName = settings.customHeader || shop.name || shop.shopName || (authUser && authUser.role !== 'super_admin' ? authUser.shopName : null) || 'MOBILE ZONE';
    const logoUrl = shop.logoUrl || (authUser && authUser.logoUrl);
    const shouldPrintLogo = shop.printLogo !== undefined ? shop.printLogo : (authUser && authUser.printLogo);
    const shopPhone = shop.phone || authUser?.phone || '';
    const shopAddress = shop.address || authUser?.address || '';

    let logoHtml = '';
    if (shouldPrintLogo && logoUrl) {
        const fullLogo = resolveMediaUrl(logoUrl);
        const maxW = settings.receiptType === 'thermal-58mm' ? '120px' : (settings.receiptType === 'thermal-80mm' ? '160px' : '200px');
        logoHtml = `<div style="text-align:center; margin-bottom: 8px;">
            <img src="${fullLogo}" style="max-width: ${maxW}; max-height: 70px; object-fit: contain; filter: grayscale(100%);" />
        </div>`;
    }

    const items = Array.isArray(sale.items) ? sale.items : [];
    const dateStr = formatDate(sale.date);
    const saleId = sale.id || sale._id ? `SALE-${sale.id || sale._id}` : '';

    // Payment details formatting
    let paymentText = sale.paymentMethod || 'Cash';
    if (sale.paymentMethod === 'Split' && sale.paymentDetails) {
        const parts = [];
        if (sale.paymentDetails.cash) parts.push(`Cash: Rs.${sale.paymentDetails.cash}`);
        if (sale.paymentDetails.card) parts.push(`Card: Rs.${sale.paymentDetails.card}`);
        if (sale.paymentDetails.bank) parts.push(`Bank: Rs.${sale.paymentDetails.bank}`);
        if (sale.paymentDetails.credit) parts.push(`Credit: Rs.${sale.paymentDetails.credit}`);
        if (parts.length) paymentText = `Split (${parts.join(', ')})`;
    }

    // -------------------------------------------------------------
    // 1. THERMAL 80MM / 58MM TEMPLATE
    // -------------------------------------------------------------
    if (settings.receiptType === 'thermal-80mm' || settings.receiptType === 'thermal-58mm') {
        const is58 = settings.receiptType === 'thermal-58mm';
        const bodyWidth = is58 ? '56mm' : '76mm';
        const maxWidth = is58 ? '210px' : '290px';
        const fontSize = is58 ? '10px' : '12px';
        const titleSize = is58 ? '14px' : '16px';

        const itemRows = items.map(it => {
            const prod = it.productId && productsMap[it.productId] ? productsMap[it.productId] : null;
            let imei = it.imei;
            if (!imei && prod) {
                imei = prod.imei ? (Array.isArray(prod.imei) ? prod.imei.join(', ') : prod.imei) : [prod.imei1, prod.imei2].filter(Boolean).join(', ');
            }

            const specs = [];
            if (prod?.ram) specs.push(prod.ram);
            if (prod?.storage) specs.push(prod.storage);
            if (prod?.color) specs.push(prod.color);

            const specText = specs.length ? ` (${specs.join('/')})` : '';
            const imeiText = (settings.showImei && imei) ? `<div style="font-size: ${is58 ? '9px' : '10px'}; font-family: monospace;">IMEI: ${imei}</div>` : '';

            const unitPrice = Number(it.price || (it.subtotal / (it.quantity || 1)));
            const sub = Number(it.subtotal || (unitPrice * it.quantity));

            return `
                <tr>
                    <td colspan="3" style="padding-top: 4px; font-weight: bold;">${it.productName}${specText}</td>
                </tr>
                <tr>
                    <td style="padding-left: 6px; width: 40%; font-size: ${is58 ? '9px' : '11px'}; color: #222;">
                        ${it.quantity} x Rs.${unitPrice.toFixed(0)}
                    </td>
                    <td colspan="2" style="text-align: right; font-weight: 600;">
                        Rs.${sub.toFixed(2)}
                    </td>
                </tr>
                ${imeiText ? `<tr><td colspan="3" style="padding-left: 6px; color: #444;">${imeiText}</td></tr>` : ''}
            `;
        }).join('');

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Receipt - ${saleId}</title>
                <style>
                    @page {
                        size: ${is58 ? '58mm' : '80mm'} auto;
                        margin: 0;
                    }
                    @media print {
                        body {
                            width: ${bodyWidth} !important;
                            margin: 0 auto !important;
                            padding: ${is58 ? '2mm 1mm' : '3mm 2mm'} !important;
                        }
                    }
                    body {
                        font-family: 'Courier New', Courier, monospace, -apple-system, sans-serif;
                        width: ${bodyWidth};
                        max-width: ${maxWidth};
                        margin: 0 auto;
                        padding: 8px 4px;
                        color: #000;
                        background: #fff;
                        font-size: ${fontSize};
                        line-height: 1.25;
                    }
                    .center { text-align: center; }
                    .right { text-align: right; }
                    .bold { font-weight: bold; }
                    .shop-name { font-size: ${titleSize}; font-weight: 900; margin: 2px 0; text-transform: uppercase; }
                    .dashed-line { border-top: 1px dashed #000; margin: 4px 0; }
                    .double-line { border-top: 1px dashed #000; border-bottom: 1px dashed #000; height: 3px; margin: 5px 0; }
                    table { width: 100%; border-collapse: collapse; }
                </style>
            </head>
            <body>
                <div class="center">
                    ${logoHtml}
                    <div class="shop-name">${shopName}</div>
                    ${settings.showShopAddress && shopAddress ? `<div style="font-size: ${is58 ? '9px' : '11px'};">${shopAddress}</div>` : ''}
                    ${settings.showShopPhone && shopPhone ? `<div style="font-size: ${is58 ? '9px' : '11px'}; font-weight: bold;">Tel: ${shopPhone}</div>` : ''}
                </div>

                <div class="dashed-line"></div>

                <div style="display: flex; justify-content: space-between; font-size: ${is58 ? '9px' : '11px'};">
                    <span>${saleId}</span>
                    <span>${dateStr}</span>
                </div>

                ${settings.showCustomer && (customerName !== 'Walk-in' || customerMobile) ? `
                    <div style="font-size: ${is58 ? '9px' : '11px'}; margin-top: 2px;">
                        <span>Customer: <strong>${customerName}</strong></span>
                        ${customerMobile ? `<span> (${customerMobile})</span>` : ''}
                    </div>
                ` : ''}

                <div class="dashed-line"></div>

                <table>
                    <tbody>
                        ${itemRows}
                    </tbody>
                </table>

                <div class="dashed-line"></div>

                <table style="font-size: ${is58 ? '10px' : '12px'};">
                    <tr>
                        <td>Subtotal:</td>
                        <td class="right">Rs. ${Number(sale.subtotal).toFixed(2)}</td>
                    </tr>
                    ${Number(sale.discount || 0) > 0 ? `
                        <tr>
                            <td>Discount:</td>
                            <td class="right">-Rs. ${Number(sale.discount).toFixed(2)}</td>
                        </tr>
                    ` : ''}
                    <tr style="font-weight: bold; font-size: ${is58 ? '12px' : '14px'};">
                        <td style="padding-top: 3px;">NET TOTAL:</td>
                        <td class="right" style="padding-top: 3px;">Rs. ${Number(sale.total).toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td style="font-size: ${is58 ? '9px' : '11px'}; color: #333;">Payment:</td>
                        <td class="right" style="font-size: ${is58 ? '9px' : '11px'};">${paymentText}</td>
                    </tr>
                </table>

                <div class="double-line"></div>

                ${settings.receiptFooter ? `
                    <div class="center" style="font-size: ${is58 ? '9px' : '10px'}; margin-top: 6px; padding: 0 4px; font-style: italic;">
                        ${settings.receiptFooter}
                    </div>
                ` : ''}

                <div class="center" style="font-size: ${is58 ? '9px' : '10px'}; margin-top: 6px; font-weight: bold;">
                    *** Thank You! Come Again ***
                </div>

                <script>
                    window.onload = function() {
                        window.print();
                    };
                </script>
            </body>
            </html>
        `;
    }

    // -------------------------------------------------------------
    // 2. STANDARD A4 / A5 INVOICE TEMPLATE
    // -------------------------------------------------------------
    const a4Rows = items.map(it => {
        const prod = it.productId && productsMap[it.productId] ? productsMap[it.productId] : null;
        let imei = it.imei;
        if (!imei && prod) {
            imei = prod.imei ? (Array.isArray(prod.imei) ? prod.imei.join(', ') : prod.imei) : [prod.imei1, prod.imei2].filter(Boolean).join(', ');
        }
        const unitPrice = Number(it.price || (it.subtotal / (it.quantity || 1)));
        const sub = Number(it.subtotal || (unitPrice * it.quantity));
        const imeiPart = (settings.showImei && imei) ? `<div style="font-size: 11px; color: #475569; font-family: monospace;">IMEI / S/N: ${imei}</div>` : '';

        return `
            <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px 12px;">
                    <div style="font-weight: 600; color: #0f172a;">${it.productName}</div>
                    ${imeiPart}
                </td>
                <td style="padding: 10px 12px; text-align: center; color: #334155;">${it.quantity}</td>
                <td style="padding: 10px 12px; text-align: right; color: #334155;">Rs. ${unitPrice.toFixed(2)}</td>
                <td style="padding: 10px 12px; text-align: right; font-weight: 600; color: #0f172a;">Rs. ${sub.toFixed(2)}</td>
            </tr>
        `;
    }).join('');

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Invoice - ${saleId}</title>
            <style>
                @page {
                    size: A4 portrait;
                    margin: 15mm;
                }
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 24px;
                    color: #0f172a;
                    background: #fff;
                    font-size: 13px;
                    line-height: 1.5;
                }
                @media print {
                    body { padding: 0; margin: 0; }
                }
                table { width: 100%; border-collapse: collapse; }
                .border-box { border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; }
            </style>
        </head>
        <body>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; border-bottom: 2px solid #e2e8f0; padding-bottom: 16px;">
                <div>
                    ${logoHtml}
                    <h1 style="margin: 0; font-size: 24px; color: #1e3a8a; text-transform: uppercase;">${shopName}</h1>
                    ${shopAddress ? `<div style="color: #64748b; font-size: 12px; margin-top: 4px;">${shopAddress}</div>` : ''}
                    ${shopPhone ? `<div style="color: #64748b; font-size: 12px;">Tel: ${shopPhone}</div>` : ''}
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: 1px;">INVOICE</div>
                    <div style="font-weight: 600; color: #3b82f6; margin-top: 4px;">${saleId}</div>
                    <div style="font-size: 12px; color: #64748b; margin-top: 2px;">Date: ${dateStr}</div>
                </div>
            </div>

            <div style="display: flex; gap: 20px; margin-bottom: 24px;">
                <div class="border-box" style="flex: 1;">
                    <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748b; margin-bottom: 6px;">Customer Details</div>
                    <div style="font-size: 14px; font-weight: bold; color: #0f172a;">${customerName}</div>
                    ${customerMobile ? `<div style="color: #475569; font-size: 13px; margin-top: 2px;">Mobile: ${customerMobile}</div>` : ''}
                </div>
                <div class="border-box" style="flex: 1;">
                    <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748b; margin-bottom: 6px;">Payment Summary</div>
                    <div style="font-size: 13px;">Method: <strong>${paymentText}</strong></div>
                    <div style="font-size: 13px; margin-top: 2px;">Status: <strong style="color: #059669;">PAID</strong></div>
                </div>
            </div>

            <table>
                <thead>
                    <tr style="background: #f8fafc; border-bottom: 2px solid #cbd5e1; font-size: 12px; text-transform: uppercase; color: #475569;">
                        <th style="padding: 10px 12px; text-align: left;">Item Description</th>
                        <th style="padding: 10px 12px; text-align: center;">Qty</th>
                        <th style="padding: 10px 12px; text-align: right;">Unit Price</th>
                        <th style="padding: 10px 12px; text-align: right;">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${a4Rows}
                </tbody>
            </table>

            <div style="display: flex; justify-content: flex-end; margin-top: 20px;">
                <div style="width: 280px;">
                    <div style="display: flex; justify-content: space-between; padding: 4px 0; color: #475569;">
                        <span>Subtotal:</span>
                        <span>Rs. ${Number(sale.subtotal).toFixed(2)}</span>
                    </div>
                    ${Number(sale.discount || 0) > 0 ? `
                        <div style="display: flex; justify-content: space-between; padding: 4px 0; color: #dc2626;">
                            <span>Discount:</span>
                            <span>-Rs. ${Number(sale.discount).toFixed(2)}</span>
                        </div>
                    ` : ''}
                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-top: 2px solid #0f172a; margin-top: 4px; font-size: 16px; font-weight: bold; color: #0f172a;">
                        <span>Grand Total:</span>
                        <span>Rs. ${Number(sale.total).toFixed(2)}</span>
                    </div>
                </div>
            </div>

            ${settings.receiptFooter ? `
                <div style="margin-top: 40px; padding-top: 15px; border-top: 1px dashed #cbd5e1; font-size: 11px; color: #64748b; text-align: center; font-style: italic;">
                    ${settings.receiptFooter}
                </div>
            ` : ''}

            <div style="margin-top: 40px; display: flex; justify-content: space-between; font-size: 12px; color: #64748b; padding-top: 30px;">
                <div style="border-top: 1px solid #cbd5e1; width: 180px; text-align: center; padding-top: 4px;">
                    Customer Signature
                </div>
                <div style="border-top: 1px solid #cbd5e1; width: 180px; text-align: center; padding-top: 4px;">
                    Authorized Signature
                </div>
            </div>

            <script>
                window.onload = function() {
                    window.print();
                };
            </script>
        </body>
        </html>
    `;
}

/**
 * Opens a print popup and automatically prints the receipt
 */
export function printReceipt(sale, options = {}) {
    const html = generateReceiptHtml(sale, options);
    const settings = { ...getPrinterSettings(), ...options };
    
    const popupWidth = settings.receiptType === 'standard-a4' ? 820 : (settings.receiptType === 'thermal-58mm' ? 320 : 400);
    const newWindow = window.open('', '_blank', `width=${popupWidth},height=750,menubar=no,toolbar=no,location=no,status=no`);

    if (newWindow) {
        newWindow.document.open();
        newWindow.document.write(html);
        newWindow.document.close();
    } else {
        alert('Popup blocked. Please allow popups in your browser settings to print receipts.');
    }
}
