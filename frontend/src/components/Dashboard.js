import React, { useEffect, useState } from 'react';
import { getDailySales, getMonthlySummary } from '../api/saleApi';
import { addExpense, getMonthlyExpenses } from '../api/expenseApi';
import { getInvestors } from '../api/investorApi';
import { getProducts } from '../api/productApi';
import BrandStockPie from './BrandStockPie';
import AccessoryStockPie from './AccessoryStockPie';

const Dashboard = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  });
  const [summary, setSummary] = useState(null);
  const [expensesByCategory, setExpensesByCategory] = useState([]);
  const [investorSummaries, setInvestorSummaries] = useState([]);
  const [expandedInvestors, setExpandedInvestors] = useState(new Set());

  const [expenseForm, setExpenseForm] = useState({ category: 'Rent', amount: '', date: new Date().toISOString().slice(0,10), notes: '' });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const daily = await getDailySales();
        setData(daily);
        const s = await getMonthlySummary(month);
        setSummary(s);
        const cat = await getMonthlyExpenses(month);
        setExpensesByCategory(cat);
        // load investors and products to compute investor details
        try {
          const [investors, products] = await Promise.all([getInvestors(), getProducts()]);
          // build summaries per investor; match by id or investorName fallback
          const summaries = investors.map(inv => {
            const assignedProducts = products.filter(p => {
              try {
                if (p.investor && String(p.investor) === String(inv._id)) return true;
                if (p.investorName && String(p.investorName).trim() && String(p.investorName).trim() === String(inv.name).trim()) return true;
                return false;
              } catch (e) { return false; }
            });
            const allocatedCost = assignedProducts.reduce((sum, p) => sum + (Number(p.cost || 0) * Number(p.stock || 0)), 0);
            const invested = Number(inv.amountInvested || 0);
            const remaining = invested - allocatedCost;
            const pctUsed = invested > 0 ? (allocatedCost / invested) * 100 : invested === 0 && allocatedCost > 0 ? 100 : 0;
            return {
              _id: inv._id,
              name: inv.name,
              invested,
              allocatedCost,
              remaining,
              pctUsed,
              products: assignedProducts
            };
          });
          setInvestorSummaries(summaries);
        } catch (invErr) {
          console.error('Failed to load investors or products', invErr);
          setInvestorSummaries([]);
        }
      } catch (err) {
        console.error('Failed to load daily sales', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [month]);

  if (loading) return <div style={{ padding: 30 }}>Loading dashboard...</div>;

  // Prepare chart dimensions
  const width = 800;
  const height = 300;
  const padding = 40;

  const totals = data.map(d => d.total);
  const max = Math.max(...totals, 1);

  const barWidth = data.length ? (width - padding * 2) / data.length : (width - padding * 2);

  const handleExpenseChange = (e) => setExpenseForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const submitExpense = async (e) => {
    e.preventDefault();
    const payload = { ...expenseForm, amount: parseFloat(expenseForm.amount), date: new Date(expenseForm.date) };
    try {
      await addExpense(payload);
      // refresh summary and categories
      const s = await getMonthlySummary(month);
      setSummary(s);
      const cat = await getMonthlyExpenses(month);
      setExpensesByCategory(cat);
      setExpenseForm({ category: 'Rent', amount: '', date: new Date().toISOString().slice(0,10), notes: '' });
      alert('Expense added');
    } catch (err) {
      console.error(err);
      alert('Failed to add expense');
    }
  };

  return (
    <div className="card" style={{ maxWidth: width + 40, margin: '20px auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: '0 0 10px 0', color: '#000' }}>Daily Sales (Total)</h2>
          <p style={{ marginTop: 0, color: '#555' }}>Bar chart shows total sales per day.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label style={{ fontSize: 14, color: '#333' }}>Month:</label>
          <input type="month" value={month} onChange={e=>setMonth(e.target.value)} style={{ padding: 6 }} />
        </div>
      </div>

      <svg width={width} height={height} style={{ display: 'block', margin: '0 auto' }}>
        {/* Y axis lines and labels */}
          {[0,0.25,0.5,0.75,1].map((t,i) => {
          const y = padding + (height - padding * 2) * (1 - t);
          const value = Math.round(max * t);
          return (
            <g key={i}>
              <line x1={padding} x2={width - padding} y1={y} y2={y} stroke="#eee" />
              <text x={8} y={y + 4} fontSize={12} fill="#666">Rs. {value}</text>
            </g>
          );
        })}

        {/* Bars or placeholder when no data */}
        {data.length === 0 ? (
          <text x={width / 2} y={height / 2} fontSize={14} fill="#999" textAnchor="middle">No sales data for selected month</text>
        ) : (
          data.map((d, i) => {
            const barHeight = (d.total / max) * (height - padding * 2);
            const x = padding + i * barWidth + 6;
            const y = height - padding - barHeight;
            return (
              <g key={d.date}>
                <rect x={x} y={y} width={Math.max(1, barWidth - 12)} height={barHeight} fill="#0b3d91" />
                <text x={x + (barWidth - 12) / 2} y={height - padding + 16} fontSize={11} fill="#333" textAnchor="middle">{d.date.slice(5)}</text>
                <title>{`${d.date}: Rs. ${d.total} (${d.count} sales)`}</title>
              </g>
            );
          })
        )}
      </svg>

      {/* Stock pie charts: phones by brand and accessories by type */}
      <div style={{ marginTop: 18, display: 'flex', gap: 18, flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <div style={{ flex: '1 1 520px', minWidth: 360 }}>
          <BrandStockPie onlyPhones={true} />
        </div>
        <div style={{ flex: '1 1 420px', minWidth: 320 }}>
          <AccessoryStockPie />
        </div>
      </div>

      {/* Expense panel */}
      <div style={{ marginTop: 20, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 280 }}>
          <h3 style={{ margin: '8px 0' }}>Expense Tracking</h3>
          <form onSubmit={submitExpense} style={{ display: 'grid', gap: 8 }}>
            <label>Category</label>
            <select name="category" value={expenseForm.category} onChange={handleExpenseChange} className="input">
              <option>Rent</option>
              <option>Internet</option>
              <option>Salary</option>
              <option>Electricity</option>
              <option>Interest (Paid to investors)</option>
              <option>Other</option>
            </select>
            <label>Amount</label>
            <input name="amount" value={expenseForm.amount} onChange={handleExpenseChange} required type="number" step="0.01" className="input" />
            <label>Date</label>
            <input name="date" value={expenseForm.date} onChange={handleExpenseChange} required type="date" className="input" />
            <label>Notes</label>
            <input name="notes" value={expenseForm.notes} onChange={handleExpenseChange} className="input" />
            <button type="submit" className="btn btn-primary">Add Expense</button>
          </form>
        </div>

        <div style={{ width: 360 }}>
          <h3 style={{ margin: '8px 0' }}>Monthly Expense Report</h3>
          <div style={{ background:'#f8f9fb', padding:12, borderRadius:6 }}>
            <p style={{ margin: '6px 0' }}><strong>Sales:</strong> Rs. {summary ? summary.salesTotal.toFixed(2) : '0.00'}</p>
            <p style={{ margin: '6px 0' }}><strong>Expenses:</strong> Rs. {summary ? summary.expensesTotal.toFixed(2) : '0.00'}</p>
            <p style={{ margin: '6px 0' }}><strong>Net Profit:</strong> Rs. {summary ? summary.netProfit.toFixed(2) : '0.00'}</p>

            <h4 style={{ marginTop: 12 }}>By Category</h4>
            <ul>
              {expensesByCategory && expensesByCategory.length ? expensesByCategory.map(c => (
                <li key={c.category}>{c.category}: Rs. {c.total.toFixed(2)}</li>
              )) : <li>No expenses</li>}
            </ul>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 360 }}>
          <h3 style={{ margin: '8px 0' }}>Investors Details</h3>
          <div style={{ background:'#fafafa', padding:12, borderRadius:6 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
              <button onClick={async () => {
                try {
                  const [investors, products] = await Promise.all([getInvestors(), getProducts()]);
                  const summaries = investors.map(inv => {
                    const assignedProducts = products.filter(p => {
                      try {
                        if (p.investor && String(p.investor) === String(inv._id)) return true;
                        if (p.investorName && String(p.investorName).trim() && String(p.investorName).trim() === String(inv.name).trim()) return true;
                        return false;
                      } catch (e) { return false; }
                    });
                    const allocatedCost = assignedProducts.reduce((sum, p) => sum + (Number(p.cost || 0) * Number(p.stock || 0)), 0);
                    const invested = Number(inv.amountInvested || 0);
                    const remaining = invested - allocatedCost;
                    const pctUsed = invested > 0 ? (allocatedCost / invested) * 100 : invested === 0 && allocatedCost > 0 ? 100 : 0;
                    return { _id: inv._id, name: inv.name, invested, allocatedCost, remaining, pctUsed, products: assignedProducts };
                  });
                  setInvestorSummaries(summaries);
                } catch (e) {
                  console.error('Failed to refresh investors', e);
                }
              }} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #ccc', background:'#fff', cursor:'pointer' }}>Refresh</button>
            </div>
            {investorSummaries && investorSummaries.length ? (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #eee' }}>Investor</th>
                    <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #eee' }}>Invested</th>
                    <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #eee' }}>Allocated (Cost)</th>
                    <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #eee' }}>Remaining</th>
                    <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #eee' }}>Used %</th>
                  </tr>
                </thead>
                <tbody>
                  {investorSummaries.map(inv => (
                    <React.Fragment key={inv._id}>
                      <tr style={{ cursor: 'pointer' }} onClick={() => {
                        const next = new Set(expandedInvestors);
                        if (next.has(inv._id)) next.delete(inv._id); else next.add(inv._id);
                        setExpandedInvestors(next);
                      }}>
                        <td style={{ padding: '8px', verticalAlign: 'top' }}>{inv.name}</td>
                        <td style={{ padding: '8px', textAlign: 'right' }}>Rs. {inv.invested.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
                        <td style={{ padding: '8px', textAlign: 'right' }}>Rs. {inv.allocatedCost.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
                        <td style={{ padding: '8px', textAlign: 'right', color: inv.remaining < 0 ? '#c62828' : '#1b5e20' }}>Rs. {inv.remaining.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
                        <td style={{ padding: '8px', textAlign: 'right' }}>{inv.pctUsed.toFixed(1)}%</td>
                      </tr>
                      {expandedInvestors.has(inv._id) && (
                        <tr>
                          <td colSpan={5} style={{ padding: '8px 12px', background: '#fff' }}>
                            {inv.products && inv.products.length ? (
                              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                  <tr>
                                    <th style={{ textAlign: 'left', padding: '6px', borderBottom: '1px solid #eee' }}>Product</th>
                                    <th style={{ textAlign: 'right', padding: '6px', borderBottom: '1px solid #eee' }}>Cost</th>
                                    <th style={{ textAlign: 'right', padding: '6px', borderBottom: '1px solid #eee' }}>Stock</th>
                                    <th style={{ textAlign: 'right', padding: '6px', borderBottom: '1px solid #eee' }}>Value</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {inv.products.map(p => (
                                    <tr key={p._id}>
                                      <td style={{ padding: '6px' }}>{p.brand} {p.model}</td>
                                      <td style={{ padding: '6px', textAlign: 'right' }}>Rs. {Number(p.cost || 0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
                                      <td style={{ padding: '6px', textAlign: 'right' }}>{Number(p.stock || 0)}</td>
                                      <td style={{ padding: '6px', textAlign: 'right' }}>Rs. {(Number(p.cost || 0) * Number(p.stock || 0)).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            ) : (
                              <div style={{ color: '#666' }}>No products assigned to this investor.</div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ color: '#666' }}>No investors or no assigned products.</div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
