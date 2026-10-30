import { API_BASE_URL } from '../api/config';

// Lightweight helper to download HTML as PDF using html2pdf (loaded from CDN at runtime)
const HTML2PDF_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.9.3/html2pdf.bundle.min.js';

function ensureHtml2PdfLoaded() {
  return new Promise((resolve, reject) => {
    if (typeof window.html2pdf !== 'undefined') return resolve(window.html2pdf);
    // check if script already injected
    const existing = document.querySelector(`script[src="${HTML2PDF_CDN}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(window.html2pdf));
      existing.addEventListener('error', () => reject(new Error('Failed to load html2pdf')));
      return;
    }
    const script = document.createElement('script');
    script.src = HTML2PDF_CDN;
    script.onload = () => {
      if (typeof window.html2pdf !== 'undefined') resolve(window.html2pdf);
      else reject(new Error('html2pdf not available after load'));
    };
    script.onerror = () => reject(new Error('Failed to load html2pdf script'));
    document.head.appendChild(script);
  });
}

export async function downloadHtmlStringAsPdf(htmlString, filename = 'document.pdf') {
  // Create container element
  const container = document.createElement('div');
  container.style.padding = '20px';
  container.style.maxWidth = '800px';
  container.innerHTML = htmlString;
  document.body.appendChild(container);

  // Wait for images inside the container to load to avoid html2canvas capturing before images are ready
  const waitForImages = (root, timeout = 5000) => new Promise((resolve) => {
    const imgs = Array.from(root.querySelectorAll('img'));
    if (imgs.length === 0) return resolve();
    let remaining = imgs.length;
    const mark = (img) => {
      if (img._handled) return;
      img._handled = true;
      remaining -= 1;
      if (remaining <= 0) resolve();
    };
    imgs.forEach(img => {
      if (img.complete && img.naturalWidth !== 0) return mark(img);
      img.addEventListener('load', () => mark(img), { once: true });
      img.addEventListener('error', () => mark(img), { once: true });
    });
    // safety timeout: resolve anyway after timeout
    setTimeout(() => resolve(), timeout);
  });

  try {
    // Ensure images are loaded before generating PDF
    await waitForImages(container, 8000);
    const html2pdf = await ensureHtml2PdfLoaded();
    // use recommended options: letter, portrait, margin
    const opt = {
      margin:       10,
      filename:     filename,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'pt', format: 'a4', orientation: 'portrait' }
    };
    await html2pdf().set(opt).from(container).save();
  } catch (err) {
    console.error('PDF generation failed', err);
    // Fallback: open print window
    const w = window.open('', '_blank', 'width=600,height=800');
    if (w) {
      w.document.open();
      w.document.write(htmlString);
      w.document.close();
      w.focus();
      w.print();
    } else {
      alert('Could not generate or download PDF. Please allow popups.');
    }
  } finally {
    // cleanup
    container.remove();
  }
}

export function buildSaleReceiptHtml(sale, productsMap = {}, extraShopInfo = {}) {
  const formatDateString = (d) => {
    if (!d && d !== 0) return '';
    const date = (typeof d === 'number' || (!isNaN(Number(d)) && String(d).trim() !== '')) ? new Date(Number(d)) : new Date(d);
    if (isNaN(date.getTime())) return String(d);
    return date.toLocaleString();
  };

  const formatProductExtra = (item) => {
    // Prefer fields present on the sale item, fall back to product map lookup
    let prod = null;
    if (item.productId && productsMap && productsMap[item.productId]) prod = productsMap[item.productId];
    // also allow item to already contain specs
    const ram = item.ram || (prod && prod.ram) || '';
    const storage = item.storage || (prod && prod.storage) || '';
    const color = item.color || (prod && prod.color) || '';
    const imei = item.imei || (prod && (prod.imei || (prod.imei1 || '') + (prod.imei2 ? (', ' + prod.imei2) : ''))) || '';
    const parts = [];
    if (ram) parts.push(ram);
    if (storage) parts.push(storage);
    if (color) parts.push(color);
    let html = '';
    if (parts.length) html += `<div style="font-size:12px;color:#555;margin-top:4px">${parts.join(' / ')}</div>`;
    if (imei) html += `<div style="font-size:12px;color:#333;margin-top:4px">IMEI: ${imei}</div>`;
    return html;
  };

  // Determine shop details from sale.Shop, extraShopInfo, or localStorage auth user
  let userStorage = null;
  try {
    userStorage = JSON.parse(localStorage.getItem('user') || '{}');
  } catch (e) {}

  const shop = sale.Shop || sale.shop || extraShopInfo || {};
  const shopName = shop.name || shop.shopName || extraShopInfo.shopName || extraShopInfo.name || (userStorage?.role !== 'super_admin' ? userStorage?.shopName : null) || 'INVOICE';
  const shopPhone = shop.phone || extraShopInfo.phone || (userStorage?.role !== 'super_admin' ? userStorage?.phone : null) || '';
  const shopAddress = shop.address || extraShopInfo.address || (userStorage?.role !== 'super_admin' ? userStorage?.address : null) || '';

  let logoUrl = shop.logoUrl || extraShopInfo.logoUrl || (userStorage?.role !== 'super_admin' ? userStorage?.logoUrl : null) || null;
  if (logoUrl && typeof logoUrl === 'string' && !logoUrl.startsWith('http') && !logoUrl.startsWith('data:')) {
    const backendOrigin = API_BASE_URL.replace(/\/api\/?$/, '');
    logoUrl = `${backendOrigin}${logoUrl.startsWith('/') ? '' : '/'}${logoUrl}`;
  }

  const logoHtml = logoUrl 
    ? `<img src="${logoUrl}" alt="${shopName}" style="max-height:75px; max-width:130px; object-fit:contain; display:block;" />`
    : '';

  const contactParts = [];
  if (shopAddress) contactParts.push(shopAddress);
  if (shopPhone) contactParts.push(`Tel: ${shopPhone}`);
  const contactHtml = contactParts.length ? `<div style="font-size:12px;color:#555;margin-top:2px;">${contactParts.join(' &bull; ')}</div>` : '';

  const customerName = sale.customerName || (sale.customer && (sale.customer.name || sale.customer.customerName)) || 'Walk-in';
  const customerMobile = sale.customerMobile || (sale.customer && (sale.customer.mobile || sale.customer.phone)) || '-';

  const rows = (sale.items || []).map(it => {
    const extra = formatProductExtra(it);
    const warrantyCell = it.warranty ? String(it.warranty) : '&nbsp;';
    return `<tr><td>${it.productName || ''}${extra}</td><td style="text-align:right;">${it.quantity}</td><td style="text-align:right;">Rs. ${Number(it.price || (it.subtotal/(it.quantity||1))).toFixed(2)}</td><td style="text-align:right;">Rs. ${Number(it.subtotal).toFixed(2)}</td><td style="text-align:center; padding:10px 12px; min-width:120px;">${warrantyCell}</td></tr>`;
  }).join('');

  return `
    <html>
    <head>
      <meta charset="utf-8" />
      <title>${shopName && shopName !== 'INVOICE' ? `${shopName} Invoice` : 'Invoice'}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; color: #111; }
        .header { display:flex; align-items:center; gap:16px; margin-bottom: 20px; text-align: left; border-bottom: 2px solid #eee; padding-bottom: 15px; }
        .items { width: 100%; border-collapse: collapse; margin-top: 15px; }
        .items th, .items td { border: 1px solid #ddd; padding: 8px; }
        .items th { background-color: #f9fafb; font-size: 13px; text-transform: uppercase; color: #374151; }
        .total { font-weight: bold; color: #2e7d32; font-size: 16px; }
      </style>
    </head>
    <body>
      <div class="header">
        ${logoHtml}
        <div style="flex:1;">
          <h2 style="margin:0; font-size:22px; color:#111;">${shopName}</h2>
          ${shopName !== 'INVOICE' ? `<div style="font-size:12px; font-weight:bold; letter-spacing:1px; color:#666; margin-top:2px;">INVOICE</div>` : ''}
          ${contactHtml}
          <div style="font-size:12px; color:#666; margin-top:3px;">Date: ${formatDateString(sale.date)}</div>
        </div>
      </div>
      <div style="margin-bottom: 15px; background: #fdfdfd; padding: 10px; border-radius: 6px; border: 1px solid #f0f0f0;">
        <div><strong>Customer:</strong> ${customerName}</div>
        <div><strong>Mobile:</strong> ${customerMobile}</div>
      </div>
      <table class="items">
        <thead>
          <tr><th>Description</th><th style="text-align:right;">Qty</th><th style="text-align:right;">Price</th><th style="text-align:right;">Amount</th><th style="text-align:center;">Warranty</th></tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
      <div style="margin-top:20px; text-align:right;">
        <div style="margin-bottom:4px;">Subtotal: Rs. ${Number(sale.subtotal).toFixed(2)}</div>
        <div style="margin-bottom:4px;">Discount: Rs. ${Number(sale.discount || 0).toFixed(2)}</div>
        <div class="total">Grand Total: Rs. ${Number(sale.total).toFixed(2)}</div>
      </div>
    </body>
    </html>
  `;
}

export async function downloadSalePdf(sale, productsMap = {}, extraShopInfo = {}) {
  let html = buildSaleReceiptHtml(sale, productsMap, extraShopInfo);
  
  let userStorage = null;
  try {
    userStorage = JSON.parse(localStorage.getItem('user') || '{}');
  } catch (e) {}

  const shop = sale.Shop || sale.shop || extraShopInfo || {};
  const shopName = shop.name || shop.shopName || extraShopInfo.shopName || userStorage?.shopName || 'sale';
  const safeShopName = shopName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  const filename = `${safeShopName || 'sale'}-invoice-${sale._id || sale.id || Date.now()}.pdf`;

  // Inline any <img> sources as base64 data URLs to prevent html2canvas / html2pdf cross-origin issues
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const images = Array.from(doc.querySelectorAll('img'));
    let hasReplaced = false;

    for (const img of images) {
      const src = img.getAttribute('src');
      if (src && !src.startsWith('data:')) {
        try {
          const resp = await fetch(src, { mode: 'cors' });
          if (resp && resp.ok) {
            const blob = await resp.blob();
            const dataUrl = await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
            img.setAttribute('src', dataUrl);
            hasReplaced = true;
          }
        } catch (fetchErr) {
          console.warn('Could not inline image URL for PDF:', src, fetchErr);
        }
      }
    }

    if (hasReplaced) {
      html = doc.documentElement.outerHTML;
    }
  } catch (err) {
    console.warn('Image inlining process error, proceeding with original HTML', err);
  }

  return downloadHtmlStringAsPdf(html, filename);
}

export default { downloadSalePdf, buildSaleReceiptHtml };
