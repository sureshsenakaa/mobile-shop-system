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

export function buildSaleReceiptHtml(sale, productsMap = {}) {
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
      <title>XTREME MOBILE Invoice</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .header { display:flex; align-items:center; gap:12px; margin-bottom: 20px; text-align: left; }
        .items { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .items th, .items td { border: 1px solid #ddd; padding: 8px; }
        .total { font-weight: bold; color: #2e7d32; }
      </style>
    </head>
    <body>
      <div class="header">
        <img src="/shop.jpg" alt="Shop Logo" style="max-width:80px; width:80px; height:auto; display:block;" />
        <div style="flex:1;">
          <h2 style="margin:0;">XTREME MOBILE Invoice</h2>
          <div>${formatDateString(sale.date)}</div>
        </div>
      </div>
      <div>
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
        <div>Subtotal: Rs. ${Number(sale.subtotal).toFixed(2)}</div>
        <div>Discount: Rs. ${Number(sale.discount || 0).toFixed(2)}</div>
        <div class="total">Grand Total: Rs. ${Number(sale.total).toFixed(2)}</div>
      </div>
    </body>
    </html>
  `;
}

export async function downloadSalePdf(sale, productsMap = {}) {
  let html = buildSaleReceiptHtml(sale, productsMap);
  const filename = `sale-${sale._id || Date.now()}.pdf`;

  // Try to inline the shop logo as a data URL to avoid image loading / CORS issues
  try {
    if (html.includes('src="/shop.jpg"')) {
      const resp = await fetch('/shop.jpg');
      if (resp && resp.ok) {
        const blob = await resp.blob();
        const dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(new Error('Failed to convert blob to data URL'));
          reader.readAsDataURL(blob);
        });
        html = html.replace(/src="\/shop.jpg"/g, `src="${dataUrl}"`);
      }
    }
  } catch (err) {
    // Non-fatal: continue with original HTML if inlining fails
    console.warn('Could not inline /shop.jpg, proceeding without inlining', err);
  }

  return downloadHtmlStringAsPdf(html, filename);
}

export default { downloadSalePdf, buildSaleReceiptHtml };
