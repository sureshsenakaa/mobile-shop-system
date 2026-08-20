import React, { useEffect, useState } from 'react';
import { getSuppliers } from '../api/supplierApi';
import { getProducts } from '../api/productApi';

const SupplierStockReport = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [report, setReport] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [suppliers, products] = await Promise.all([getSuppliers(), getProducts()]);

        // Build a map of supplierId -> { supplier, items: [{ product, stock }], totalStock }
        const map = {};

        // Initialize suppliers in map
        suppliers.forEach(s => {
          map[s._id] = { supplier: s, items: [], totalStock: 0 };
        });

        // Assign products to suppliers (use supplier id if present, otherwise group under 'unknown')
        products.forEach(p => {
          const supId = p.supplier || null;
          const qty = Number(p.stock || 0);
          if (supId && map[supId]) {
            map[supId].items.push({ id: p._id, name: p.model ? `${p.brand} ${p.model}` : p.model || p.brand || 'Unnamed', stock: qty });
            map[supId].totalStock += qty;
          } else {
            // create placeholder for unknown supplier
            const key = 'unknown';
            if (!map[key]) map[key] = { supplier: { name: 'Unassigned / Unknown', _id: null }, items: [], totalStock: 0 };
            map[key].items.push({ id: p._id, name: p.model ? `${p.brand} ${p.model}` : p.model || p.brand || 'Unnamed', stock: qty });
            map[key].totalStock += qty;
          }
        });

        // Convert map to array sorted by supplier name
        const reportArray = Object.values(map).sort((a, b) => {
          const an = (a.supplier && a.supplier.name) || '';
          const bn = (b.supplier && b.supplier.name) || '';
          return an.localeCompare(bn);
        });

        setReport(reportArray);
      } catch (err) {
        console.error('Failed to build supplier stock report', err);
        setError('Failed to load report');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div style={{ padding: 20 }}><h3>Building supplier stock report...</h3></div>;
  if (error) return <div style={{ padding: 20, color: '#f44336' }}>{error}</div>;

  return (
    <div style={{ maxWidth: 1000, margin: '20px auto', padding: 30, borderRadius: 12, boxShadow: '0 6px 20px rgba(0,0,0,0.1)', backgroundColor: '#fff', fontFamily: 'Roboto, sans-serif' }}>
      <h2 style={{ color: '#388e3c', marginBottom: 12, borderBottom: '2px solid #388e3c', paddingBottom: 8 }}>📦 Stock by Supplier</h2>

      {report.map(group => (
        <div key={group.supplier && group.supplier._id ? group.supplier._id : 'unknown'} style={{ marginBottom: 22, paddingBottom: 12, borderBottom: '1px dashed #eee' }}>
          <h3 style={{ margin: '6px 0' }}>{group.supplier && group.supplier.name}</h3>
          <div style={{ color: '#666', marginBottom: 8 }}>Total stock from this supplier: <strong style={{ color: '#333' }}>{group.totalStock}</strong></div>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                <th style={{ padding: '8px 6px', width: '60%' }}>Item</th>
                <th style={{ padding: '8px 6px', width: '20%' }}>Stock</th>
                <th style={{ padding: '8px 6px', width: '20%' }}>Product ID</th>
              </tr>
            </thead>
            <tbody>
              {group.items.map(item => (
                <tr key={item.id}>
                  <td style={{ padding: '8px 6px', borderBottom: '1px solid #f3f3f3' }}>{item.name}</td>
                  <td style={{ padding: '8px 6px', borderBottom: '1px solid #f3f3f3' }}>{item.stock}</td>
                  <td style={{ padding: '8px 6px', borderBottom: '1px solid #f3f3f3', color: '#999' }}>{item.id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {report.length === 0 && <div style={{ color: '#777' }}>No supplier or product data available.</div>}
    </div>
  );
};

export default SupplierStockReport;
