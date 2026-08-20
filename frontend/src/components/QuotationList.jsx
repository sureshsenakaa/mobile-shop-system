import React, { useState, useEffect } from 'react';
import { getQuotations, deleteQuotation, convertToSale } from '../api/quotationApi';

const fmt = (x) => `Rs. ${Number(x || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const QuotationList = ({ onAddClick }) => {
    const [quotations, setQuotations] = useState([]);
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    // Convert modal state
    const [convertModal, setConvertModal] = useState(null); // quotation object or null
    const [convertPayment, setConvertPayment] = useState('Cash');
    const [splitPayments, setSplitPayments] = useState({ cash: 0, card: 0, bank: 0, credit: 0 });
    const [converting, setConverting] = useState(false);

    const fetchQuotations = async () => {
        setLoading(true);
        try {
            const result = await getQuotations();
            setQuotations(Array.isArray(result) ? result : (result && result.quotations ? result.quotations : []));
        } catch (err) {
            console.error(err);
            setQuotations([]);
        }
        setLoading(false);
    };

    useEffect(() => { fetchQuotations(); }, []);

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this quotation permanently?')) return;
        try {
            await deleteQuotation(id);
            await fetchQuotations();
        } catch (err) {
            alert(err.message || 'Failed to delete quotation');
        }
    };

    const handleConvert = async () => {
        if (!convertModal) return;
        const id = convertModal._id || convertModal.id;

        if (convertPayment === 'Split') {
            const sum = Number(splitPayments.cash) + Number(splitPayments.card) + Number(splitPayments.bank) + Number(splitPayments.credit);
            if (Math.abs(sum - Number(convertModal.total)) > 0.01) {
                return alert(`Split payments must equal the total (${fmt(convertModal.total)}). Current sum: ${fmt(sum)}`);
            }
        }

        setConverting(true);
        try {
            await convertToSale(id, {
                paymentMethod: convertPayment,
                paymentDetails: convertPayment === 'Split' ? splitPayments : {}
            });
            alert('Quotation converted to sale successfully!');
            setConvertModal(null);
            setConvertPayment('Cash');
            setSplitPayments({ cash: 0, card: 0, bank: 0, credit: 0 });
            await fetchQuotations();
        } catch (err) {
            alert(err.message || 'Failed to convert quotation');
        }
        setConverting(false);
    };

    const handlePrint = (q) => {
        const rows = (q.items || []).map(it =>
            `<tr><td>${it.productName || ''}</td><td style="text-align:right;">${it.quantity || 1}</td><td style="text-align:right;">Rs. ${Number(it.price || 0).toFixed(2)}</td><td style="text-align:right;">Rs. ${Number(it.subtotal || 0).toFixed(2)}</td></tr>`
        ).join('');

        const receiptHtml = `
            <html>
            <head>
                <title>Quotation</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; color: #000; }
                    .header { text-align: center; margin-bottom: 20px; }
                    .items { width: 100%; border-collapse: collapse; margin-top: 10px; }
                    .items th, .items td { border: 1px solid #000; padding: 8px; }
                    .total { font-weight: bold; }
                    .disclaimer { margin-top: 30px; font-size: 12px; color: #666; border-top: 1px solid #ccc; padding-top: 10px; }
                    @media print { body { padding: 0; margin: 0; width: 100%; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>QUOTATION</h2>
                    <div>QT# ${q.quotationNumber || q._id || ''}</div>
                    <div>${q.date ? new Date(q.date).toLocaleDateString() : new Date().toLocaleDateString()}</div>
                </div>
                <div>
                    <div><strong>Customer:</strong> ${q.customerName || 'Walk-in'}</div>
                    <div><strong>Mobile:</strong> ${q.customerMobile || '-'}</div>
                </div>
                <table class="items">
                    <thead>
                        <tr><th>Description</th><th style="text-align:right;">Qty</th><th style="text-align:right;">Price</th><th style="text-align:right;">Amount</th></tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
                <div style="margin-top:20px; text-align:right;">
                    <div>Subtotal: Rs. ${Number(q.subtotal || 0).toFixed(2)}</div>
                    <div>Discount: Rs. ${Number(q.discount || 0).toFixed(2)}</div>
                    <div class="total">Grand Total: Rs. ${Number(q.total || 0).toFixed(2)}</div>
                </div>
                <div style="margin-top:20px;">
                    <strong>Valid Until:</strong> ${q.validUntil ? new Date(q.validUntil).toLocaleDateString() : '-'}
                </div>
                <div class="disclaimer">
                    This is a quotation only and does not constitute a confirmed sale. Prices and availability are subject to change. This quotation is valid until the date mentioned above.
                </div>
                <script>
                    window.onload = function() { window.print(); };
                </script>
            </body>
            </html>
        `;

        const printWindow = window.open('', '_blank', 'width=400,height=600');
        if (printWindow) {
            printWindow.document.open();
            printWindow.document.write(receiptHtml);
            printWindow.document.close();
        } else {
            alert('Popup blocked. Please allow popups for this site to print quotations.');
        }
    };

    const handleWhatsAppShare = (q) => {
        const itemsText = (q.items || []).map(it => 
            `- ${it.productName || 'Item'} x${it.quantity || 1} (Rs. ${Number(it.subtotal || 0).toFixed(2)})`
        ).join('%0A');

        let message = `*QUOTATION - ${q.quotationNumber}*%0A`;
        message += `-------------------------%0A`;
        if (q.customerName) message += `Customer: ${q.customerName}%0A`;
        message += `Date: ${new Date(q.dateCreated).toLocaleDateString()}%0A`;
        message += `-------------------------%0A`;
        message += `${itemsText}%0A`;
        message += `-------------------------%0A`;
        message += `Subtotal: Rs. ${Number(q.subtotal || 0).toFixed(2)}%0A`;
        if (q.discount > 0) message += `Discount: Rs. ${Number(q.discount || 0).toFixed(2)}%0A`;
        message += `*Total: Rs. ${Number(q.total || 0).toFixed(2)}*%0A`;
        if (q.validUntil) message += `%0AValid Until: ${new Date(q.validUntil).toLocaleDateString()}%0A`;
        message += `%0AThank you for doing business with us!`;

        let waUrl = `https://wa.me/?text=${message}`;
        // If customer has a mobile number, prepopulate it (remove leading 0 and add country code)
        if (q.customerMobile) {
            let num = q.customerMobile.replace(/\D/g, ''); // strip non-digits
            if (num.startsWith('0')) num = '94' + num.substring(1); // default to SL format
            waUrl = `https://wa.me/${num}?text=${message}`;
        }
        
        window.open(waUrl, '_blank');
    };

    // Filtered quotations
    const filtered = quotations.filter(q => {
        const statusMatch = filterStatus === 'all' || q.status === filterStatus;
        const searchMatch = !searchTerm ||
            (q.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (q.quotationNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (q._id || '').toLowerCase().includes(searchTerm.toLowerCase());
        return statusMatch && searchMatch;
    });

    const statusBadge = (status) => {
        const styles = {
            pending: { background: '#fff3e0', color: '#ef6c00' },
            converted: { background: '#e8f5e9', color: '#2e7d32' },
            expired: { background: '#ffebee', color: '#c62828' }
        };
        const s = styles[status] || styles.pending;
        return (
            <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: '600', ...s }}>
                {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Pending'}
            </span>
        );
    };

    const filterBtnStyle = (val) => ({
        padding: '8px 18px',
        border: '1px solid #e0e0e0',
        borderRadius: 8,
        background: filterStatus === val ? '#1976d2' : '#fff',
        color: filterStatus === val ? '#fff' : '#333',
        fontWeight: filterStatus === val ? '700' : '500',
        fontSize: 13,
        cursor: 'pointer',
        transition: 'all 0.2s'
    });

    return (
        <div className="card" style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h2 style={{ margin: 0, color: '#333' }}>📝 Quotations</h2>
                    <p style={{ margin: '4px 0 0', color: '#666', fontSize: 14 }}>{filtered.length} quotation(s) found</p>
                </div>
                <button className="btn btn-primary" onClick={onAddClick}>+ New Quotation</button>
            </div>

            {/* Filter tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                <button style={filterBtnStyle('all')} onClick={() => setFilterStatus('all')}>All</button>
                <button style={filterBtnStyle('pending')} onClick={() => setFilterStatus('pending')}>🟡 Pending</button>
                <button style={filterBtnStyle('converted')} onClick={() => setFilterStatus('converted')}>🟢 Converted</button>
                <button style={filterBtnStyle('expired')} onClick={() => setFilterStatus('expired')}>🔴 Expired</button>
            </div>

            {/* Search */}
            <div style={{ marginBottom: 20 }}>
                <input
                    type="text"
                    className="input"
                    placeholder="🔍 Search by customer name or quotation number..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>Loading quotations...</div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table>
                        <thead>
                            <tr>
                                <th>QT#</th>
                                <th>Date</th>
                                <th>Customer</th>
                                <th>Items</th>
                                <th style={{ textAlign: 'right' }}>Total</th>
                                <th>Valid Until</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(q => (
                                <tr key={q._id || q.id}>
                                    <td style={{ fontWeight: '600', fontSize: 13 }}>{q.quotationNumber || (q._id || '').slice(-6).toUpperCase()}</td>
                                    <td style={{ color: '#666', fontSize: 13 }}>{q.date ? new Date(q.date).toLocaleDateString() : '-'}</td>
                                    <td>{q.customerName || 'Walk-in'}</td>
                                    <td style={{ fontSize: 13, color: '#666', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {(q.items || []).map(i => i.productName).slice(0, 2).join(', ')}
                                        {(q.items || []).length > 2 ? ` +${(q.items || []).length - 2} more` : ''}
                                    </td>
                                    <td style={{ textAlign: 'right', fontWeight: '700' }}>{fmt(q.total)}</td>
                                    <td style={{ fontSize: 13, color: '#666' }}>{q.validUntil ? new Date(q.validUntil).toLocaleDateString() : '-'}</td>
                                    <td>{statusBadge(q.status)}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                            {(q.status === 'pending') && (
                                                <button
                                                    className="btn btn-sm btn-primary"
                                                    onClick={() => {
                                                        setConvertModal(q);
                                                        setConvertPayment('Cash');
                                                        setSplitPayments({ cash: 0, card: 0, bank: 0, credit: 0 });
                                                    }}
                                                    title="Convert to Sale"
                                                >🛒</button>
                                            )}
                                            <button className="btn btn-sm btn-ghost" onClick={() => handleWhatsAppShare(q)} title="Share via WhatsApp" style={{ color: '#25D366' }}>💬</button>
                                            <button className="btn btn-sm btn-ghost" onClick={() => handlePrint(q)} title="Print">🖨️</button>
                                            <button className="btn btn-sm btn-danger" onClick={() => handleDelete(q._id || q.id)} title="Delete">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 30, color: '#999' }}>
                                    {searchTerm ? `No quotations found matching "${searchTerm}"` : 'No quotations found.'}
                                </td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Convert to Sale Modal */}
            {convertModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
                    <div style={{ background: 'white', maxWidth: 450, width: '90%', padding: 30, borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.25)' }}>
                        <h3 style={{ marginTop: 0, color: '#333' }}>🛒 Convert Quotation to Sale</h3>

                        <div style={{ background: '#f5f7fa', borderRadius: 8, padding: 16, marginBottom: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <span style={{ color: '#666', fontSize: 13 }}>QT#</span>
                                <span style={{ fontWeight: '600' }}>{convertModal.quotationNumber || (convertModal._id || '').slice(-6).toUpperCase()}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <span style={{ color: '#666', fontSize: 13 }}>Customer</span>
                                <span style={{ fontWeight: '600' }}>{convertModal.customerName || 'Walk-in'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#666', fontSize: 13 }}>Total</span>
                                <span style={{ fontWeight: '700', color: '#2e7d32', fontSize: 18 }}>{fmt(convertModal.total)}</span>
                            </div>
                        </div>

                        <label className="form-label">Payment Method</label>
                        <select className="input" value={convertPayment} onChange={e => setConvertPayment(e.target.value)} style={{ marginBottom: 16 }}>
                            <option value="Cash">Cash</option>
                            <option value="Card">Card</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="Credit">Credit</option>
                            <option value="Split">Split Payment</option>
                        </select>

                        {convertPayment === 'Credit' && (
                            <div style={{ background: '#fff3e0', padding: '10px 14px', borderRadius: 8, marginBottom: 16, color: '#ef6c00', fontSize: 13 }}>
                                ⚠️ Customer credit balance will increase by {fmt(convertModal.total)}
                            </div>
                        )}

                        {convertPayment === 'Split' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 14, background: '#f5f7fa', borderRadius: 8, marginBottom: 16 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: 13 }}>Cash:</span>
                                    <input type="number" min="0" value={splitPayments.cash} onChange={e => setSplitPayments({ ...splitPayments, cash: Number(e.target.value) })} style={{ width: 120, padding: 6 }} />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: 13 }}>Card:</span>
                                    <input type="number" min="0" value={splitPayments.card} onChange={e => setSplitPayments({ ...splitPayments, card: Number(e.target.value) })} style={{ width: 120, padding: 6 }} />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: 13 }}>Bank:</span>
                                    <input type="number" min="0" value={splitPayments.bank} onChange={e => setSplitPayments({ ...splitPayments, bank: Number(e.target.value) })} style={{ width: 120, padding: 6 }} />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: 13 }}>Credit:</span>
                                    <input type="number" min="0" value={splitPayments.credit} onChange={e => setSplitPayments({ ...splitPayments, credit: Number(e.target.value) })} style={{ width: 120, padding: 6 }} />
                                </div>
                                <div style={{ textAlign: 'right', fontSize: 13, color: '#666', marginTop: 4 }}>
                                    Sum: {fmt(Number(splitPayments.cash) + Number(splitPayments.card) + Number(splitPayments.bank) + Number(splitPayments.credit))} / {fmt(convertModal.total)}
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                            <button className="btn btn-ghost" onClick={() => setConvertModal(null)} style={{ flex: 1 }} disabled={converting}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleConvert} style={{ flex: 1 }} disabled={converting}>
                                {converting ? 'Converting...' : '🛒 Convert to Sale'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuotationList;
