import React, { useEffect, useState } from 'react';
import { getSales, returnSale, deleteSale } from '../api/saleApi';
import { downloadSalePdf } from '../utils/pdf';
import { getProducts } from '../api/productApi';
import './SalesListDesktop.css';

const SalesListDesktop = ({ onAddClick, refreshKey, latestSaleId }) => {
    const [sales, setSales] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [productsMap, setProductsMap] = useState({});

    const formatDateString = (d) => {
        if (!d && d !== 0) return '';
        const date = (typeof d === 'number' || (!isNaN(Number(d)) && String(d).trim() !== '')) ? new Date(Number(d)) : new Date(d);
        if (isNaN(date.getTime())) return String(d);
        return date.toLocaleString();
    };

    const fetchSales = async () => {
        const salesData = await getSales();
        // If a latestSaleId is provided, move that sale to the top
        let ordered = Array.isArray(salesData) ? [...salesData] : [];
        if (latestSaleId) {
            const idx = ordered.findIndex(s => s._id === latestSaleId);
            if (idx > -1) {
                const [item] = ordered.splice(idx, 1);
                ordered.unshift(item);
            }
        }
        setSales(ordered);
    };

    useEffect(() => {
        fetchSales();
        // load product map for printing detailed info
        const loadProducts = async () => {
            try {
                const prods = await getProducts();
                const map = {};
                (prods || []).forEach(p => { if (p && p._id) map[p._id] = p; });
                setProductsMap(map);
            } catch (err) {
                setProductsMap({});
            }
        };
        loadProducts();
    }, [refreshKey, latestSaleId]);


    const handleReturn = async (id) => {
        const ok = window.confirm('Return this sale and add items back to inventory?');
        if (!ok) return;
        try {
            await returnSale(id);
            await fetchSales();
        } catch (err) {
            console.error(err);
            alert('Failed to return sale');
        }
    };

    const handleDeleteSale = async (id) => {
        const ok = window.confirm('Delete this sale permanently? This cannot be undone.');
        if (!ok) return;
        try {
            await deleteSale(id);
            await fetchSales();
        } catch (err) {
            console.error(err);
            alert('Failed to delete sale');
        }
    };

    // Filter sales based on search term
    const filteredSales = sales.filter(sale => {
        const productNames = Array.isArray(sale.items) ? sale.items.map(i => i.productName).join(' ') : (sale.productName || '');
        const totalQty = Array.isArray(sale.items) ? sale.items.reduce((s, it) => s + (it.quantity || 0), 0) : (sale.quantity || 0);
        return (
            (sale.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            productNames.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (formatDateString(sale.date) || '').includes(searchTerm) ||
            (sale.customerMobile || '').includes(searchTerm) ||
            String(totalQty).includes(searchTerm)
        );
    });

    // Calculate total revenue from filtered sales
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0);

    // Open a new window with a printable receipt for the given sale (handles multi-item sales)
    const formatProductExtra = (prod) => {
        if (!prod) return '';
        // consider it a phone if it has imei or ram/storage fields
        const hasImei = !!(prod.imei || prod.imei1 || prod.imei2 || prod.serialNumber);
        const hasSpecs = !!(prod.ram || prod.storage || prod.color);
        if (!hasImei && !hasSpecs) return '';
        const parts = [];
        if (prod.ram) parts.push(prod.ram);
        if (prod.storage) parts.push(prod.storage);
        if (prod.color) parts.push(prod.color);
        let html = '';
        if (parts.length) html += `<div style="font-size:12px;color:#555;margin-top:4px">${parts.join(' / ')}</div>`;
        if (hasImei) {
            const imei = prod.imei ? (Array.isArray(prod.imei) ? prod.imei.join(', ') : prod.imei) : [prod.imei1, prod.imei2].filter(Boolean).join(', ');
            if (imei) html += `<div style="font-size:12px;color:#333;margin-top:4px">IMEI: ${imei}</div>`;
        }
        return html;
    };

    const handlePrint = (sale) => {
        // robust customer fields: support older sale shapes where customer may be nested
        const customerName = sale.customerName || (sale.customer && (sale.customer.name || sale.customer.customerName)) || 'Walk-in';
        const customerMobile = sale.customerMobile || (sale.customer && (sale.customer.mobile || sale.customer.phone)) || '-';
        const rows = (sale.items || []).map(it => {
            const prod = it.productId ? productsMap[it.productId] : null;
            const extra = formatProductExtra(prod);
            // include warranty cell (allow handwritten notes) — use existing warranty if present
            const warrantyCell = it.warranty ? String(it.warranty) : '&nbsp;';
            return `<tr><td>${it.productName}${extra}</td><td style="text-align:right;">${it.quantity}</td><td style="text-align:right;">Rs. ${Number(it.price || (it.subtotal/(it.quantity||1))).toFixed(2)}</td><td style="text-align:right;">Rs. ${Number(it.subtotal).toFixed(2)}</td><td style="text-align:center; padding:10px 12px; min-width:120px;">${warrantyCell}</td></tr>`;
        }).join('');
        const receiptHtml = `
            <html>
            <head>
                <title>XTREME MOBILE Invoice</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    .header { text-align: center; margin-bottom: 20px; }
                    .items { width: 100%; border-collapse: collapse; margin-top: 10px; }
                    .items th, .items td { border: 1px solid #ddd; padding: 8px; }
                    .total { font-weight: bold; color: #2e7d32; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>XTREME MOBILE Invoice</h2>
                    <div>${formatDateString(sale.date)}</div>
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
                <script>
                    window.onload = function() { window.print(); };
                </script>
            </body>
            </html>
        `;

        const newWindow = window.open('', '_blank', 'width=600,height=800');
        if (newWindow) {
            newWindow.document.open();
            newWindow.document.write(receiptHtml);
            newWindow.document.close();
        } else {
            alert('Popup blocked. Please allow popups for this site to print receipts.');
        }
    };

    return (
        <div className="sales-card">
            <div className="sales-header">
                <div>
                    <h2 className="sales-title">Sales History</h2>
                    <p className="sales-subtitle">Total Revenue: <span className="cell-amount">Rs. {totalRevenue}</span></p>
                </div>
                <button onClick={onAddClick} className="btn btn-primary">+ New Sale</button>
            </div>

            {/* Search Bar */}
            <div className="search-row">
                <input
                    type="text"
                    placeholder="🔍 Search by customer name, product, date, or mobile..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
            </div>

            <table className="sales-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Product</th>
                        <th>Customer</th>
                        <th>Mobile</th>
                        <th>Qty</th>
                        <th>Discount</th>
                        <th>Total</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredSales.map(s => {
                        const isHighlighted = latestSaleId && s._id === latestSaleId;
                        return (
                            <tr key={s._id} className={`sales-row ${isHighlighted ? 'highlight' : ''}`}>
                                <td className="cell cell-muted">{formatDateString(s.date)}</td>
                                <td className="cell">{Array.isArray(s.items) ? s.items.map(i => i.productName).slice(0,2).join(', ') : (s.productName || '')}</td>
                                <td className="cell">{s.customerName || 'Walk-in'}</td>
                                <td className="cell cell-muted">{s.customerMobile || '-'}</td>
                                <td className="cell">{Array.isArray(s.items) ? s.items.reduce((sum, it) => sum + (it.quantity || 0), 0) : (s.quantity || '')}</td>
                                <td className="cell cell-muted">Rs. {s.discount ? Number(s.discount).toFixed(2) : '0.00'}</td>
                                <td className="cell cell-amount">Rs. {Number(s.total).toFixed(2)}</td>
                                <td className="cell">
                                    <div className="actions">
                                        <button onClick={() => handlePrint(s)} className="btn btn-sm btn-primary">Print</button>
                                        <button onClick={() => downloadSalePdf(s, productsMap)} className="btn btn-sm btn-success">Download PDF</button>
                                        {!s.returned ? (
                                            <button onClick={() => handleReturn(s._id)} className="btn btn-sm btn-warning">Return</button>
                                        ) : (
                                            <span className="badge-returned">Returned</span>
                                        )}
                                        <button onClick={() => handleDeleteSale(s._id)} className="btn btn-sm btn-danger">Delete</button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                    {filteredSales.length === 0 && <tr><td colSpan="8" className="empty-row">
                        {searchTerm ? `No sales found matching "${searchTerm}"` : 'No sales recorded yet.'}
                    </td></tr>}
                </tbody>
            </table>
        </div>
    );
};

export default SalesListDesktop;