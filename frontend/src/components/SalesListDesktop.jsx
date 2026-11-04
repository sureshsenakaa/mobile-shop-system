import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSales, deleteSale } from '../api/saleApi';
import { downloadSalePdf } from '../utils/pdf';
import { getProducts } from '../api/productApi';
import { API_BASE_URL, resolveMediaUrl } from '../api/config';
import { printReceipt } from '../utils/receiptPrinter';
import './SalesListDesktop.css';

const SalesListDesktop = ({ onAddClick, refreshKey, latestSaleId, authUser }) => {
    const navigate = useNavigate();
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


    const handleReturn = (sale) => {
        navigate(`/returns?saleId=${sale.id || sale._id}`);
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

    const handlePrint = (sale) => {
        printReceipt(sale, { authUser, productsMap });
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

            <div style={{ overflowX: 'auto' }}>
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
                                            <button onClick={() => downloadSalePdf(s, productsMap, authUser)} className="btn btn-sm btn-success">Download PDF</button>
                                            {!s.returned ? (
                                                <button onClick={() => handleReturn(s)} className="btn btn-sm btn-warning" title="Process Return / RMA">Return</button>
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
        </div>
    );
};

export default SalesListDesktop;