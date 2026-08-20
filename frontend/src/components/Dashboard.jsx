import React, { useEffect, useState } from 'react';
import { getDailySales, getMonthlySummary } from '../api/saleApi';
import { getShopNotice } from '../api/shopApi';
import { addExpense, getMonthlyExpenses, getExpenses, deleteExpense, updateExpense } from '../api/expenseApi';
import { getInvestors } from '../api/investorApi';
import { getProducts } from '../api/productApi';
import BrandStockPie from './BrandStockPie';
import AccessoryStockPie from './AccessoryStockPie';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './Dashboard.css';

const Dashboard = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  });
  const [summary, setSummary] = useState(null);
  const [expensesByCategory, setExpensesByCategory] = useState([]);
  const [rawExpenses, setRawExpenses] = useState([]);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [editExpenseData, setEditExpenseData] = useState({});
  const [investorSummaries, setInvestorSummaries] = useState([]);
  const [expandedInvestors, setExpandedInvestors] = useState(new Set());
  const [totalInventoryValue, setTotalInventoryValue] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [globalNotice, setGlobalNotice] = useState(null);

  const [expenseForm, setExpenseForm] = useState({ category: 'Rent', amount: '', date: new Date().toISOString().slice(0,10), notes: '' });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const daily = await getDailySales();
        setData(daily);
        const s = await getMonthlySummary(month);
        setSummary(s);
        const [cat, rawExp, noticeData] = await Promise.all([
          getMonthlyExpenses(month),
          getExpenses(month),
          getShopNotice().catch(() => null)
        ]);
        setExpensesByCategory(cat);
        setRawExpenses(rawExp);
        if (noticeData && noticeData.message) setGlobalNotice(noticeData.message);
        // load investors and products to compute investor details
        try {
          const [investors, products] = await Promise.all([getInvestors(), getProducts()]);
          
          const invVal = products.reduce((sum, p) => sum + (Number(p.cost || 0) * Number(p.stock || 0)), 0);
          setTotalInventoryValue(invVal);

          const lowStock = products.filter(p => Number(p.stock || 0) <= 5 && Number(p.stock || 0) > 0);
          setLowStockProducts(lowStock);

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

  if (loading) return <div style={{ padding: 30 }}>Loading premium dashboard...</div>;

  const handleExpenseChange = (e) => setExpenseForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const submitExpense = async (e) => {
    e.preventDefault();
    const payload = { ...expenseForm, amount: parseFloat(expenseForm.amount), date: new Date(expenseForm.date) };
    try {
      await addExpense(payload);
      const s = await getMonthlySummary(month);
      setSummary(s);
      const [cat, rawExp] = await Promise.all([
        getMonthlyExpenses(month),
        getExpenses(month)
      ]);
      setExpensesByCategory(cat);
      setRawExpenses(rawExp);
      setExpenseForm({ category: 'Rent', amount: '', date: new Date().toISOString().slice(0,10), notes: '' });
      alert('Expense added');
    } catch (err) {
      console.error(err);
      alert('Failed to add expense');
    }
  };

  const handleDeleteExpense = async (id) => {
    if (window.confirm('Delete this expense?')) {
      try {
        await deleteExpense(id);
        const [cat, rawExp, s] = await Promise.all([ getMonthlyExpenses(month), getExpenses(month), getMonthlySummary(month) ]);
        setExpensesByCategory(cat);
        setRawExpenses(rawExp);
        setSummary(s);
      } catch (e) {
        alert('Failed to delete expense');
      }
    }
  };

  const handleEditExpense = async () => {
    try {
      await updateExpense(editingExpenseId, editExpenseData);
      setEditingExpenseId(null);
      const [cat, rawExp, s] = await Promise.all([ getMonthlyExpenses(month), getExpenses(month), getMonthlySummary(month) ]);
      setExpensesByCategory(cat);
      setRawExpenses(rawExp);
      setSummary(s);
    } catch (e) {
      alert('Failed to update expense');
    }
  };

  const formatCurrency = (val) => {
    return 'Rs. ' + Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const chartData = data.map(d => ({
    name: d.date.slice(5), // MM-DD
    sales: d.total,
    count: d.count
  }));

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Dashboard Overview</h1>
          <p className="dashboard-subtitle">Monitor your business performance and inventory.</p>
        </div>
        <div>
          <input 
            type="month" 
            value={month} 
            onChange={e => setMonth(e.target.value)} 
            className="dash-input"
          />
        </div>
      </div>

      {globalNotice && (
        <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', padding: '15px 20px', marginBottom: '20px', display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
          <span style={{ fontSize: '24px' }}>📢</span>
          <div>
            <h4 style={{ margin: 0, color: '#0369a1', fontSize: '15px' }}>System Notice from Super Admin</h4>
            <p style={{ margin: '6px 0 0', color: '#0c4a6e', fontSize: '14px', whiteSpace: 'pre-wrap' }}>
              {globalNotice}
            </p>
          </div>
        </div>
      )}

      {lowStockProducts.length > 0 && (
        <div style={{ background: '#fef2f2', border: '1px solid #f87171', borderRadius: '8px', padding: '15px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>⚠️</span>
            <div>
              <h4 style={{ margin: 0, color: '#991b1b', fontSize: '15px' }}>Low Stock Alert</h4>
              <p style={{ margin: '4px 0 0', color: '#b91c1c', fontSize: '13px' }}>
                You have {lowStockProducts.length} product(s) with 5 or fewer items in stock.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card kpi-sales">
          <div className="kpi-label">Total Sales (Month)</div>
          <div className="kpi-value">{formatCurrency(summary?.salesTotal)}</div>
        </div>
        <div className="kpi-card kpi-profit">
          <div className="kpi-label">Net Profit (Month)</div>
          <div className="kpi-value">{formatCurrency(summary?.netProfit)}</div>
        </div>
        <div className="kpi-card kpi-expenses">
          <div className="kpi-label">Total Expenses (Month)</div>
          <div className="kpi-value">{formatCurrency(summary?.expensesTotal)}</div>
        </div>
        <div className="kpi-card kpi-inventory">
          <div className="kpi-label">Inventory Value</div>
          <div className="kpi-value">{formatCurrency(totalInventoryValue)}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="dashboard-tabs">
        <button className={`dash-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview & Charts</button>
        <button className={`dash-tab ${activeTab === 'expenses' ? 'active' : ''}`} onClick={() => setActiveTab('expenses')}>Expenses</button>
        <button className={`dash-tab ${activeTab === 'investors' ? 'active' : ''}`} onClick={() => setActiveTab('investors')}>Investors</button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          <div className="dashboard-section">
            <div className="section-header">
              <h2 className="section-title">Daily Sales Trend</h2>
            </div>
            <div style={{ height: 350, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4338ca" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#4338ca" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <YAxis tickLine={false} axisLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(value) => `Rs. ${value}`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
                    formatter={(value) => [`Rs. ${value}`, 'Sales']}
                  />
                  <Area type="monotone" dataKey="sales" stroke="#4338ca" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="charts-grid">
            <div className="dashboard-section" style={{ marginBottom: 0 }}>
              <h2 className="section-title">Phones by Brand</h2>
              <div style={{ marginTop: 20 }}>
                <BrandStockPie onlyPhones={true} />
              </div>
            </div>
            <div className="dashboard-section" style={{ marginBottom: 0 }}>
              <h2 className="section-title">Accessories</h2>
              <div style={{ marginTop: 20 }}>
                <AccessoryStockPie />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Expenses Tab */}
      {activeTab === 'expenses' && (
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          <div className="dashboard-section" style={{ flex: '1', minWidth: '300px' }}>
            <h2 className="section-title">Add New Expense</h2>
            <form onSubmit={submitExpense} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500' }}>Category</label>
                <select name="category" value={expenseForm.category} onChange={handleExpenseChange} className="dash-input" style={{ width: '100%' }}>
                  <option>Rent</option>
                  <option>Internet</option>
                  <option>Salary</option>
                  <option>Electricity</option>
                  <option>Interest (Paid to investors)</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500' }}>Amount</label>
                <input name="amount" value={expenseForm.amount} onChange={handleExpenseChange} required type="number" step="0.01" className="dash-input" style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500' }}>Date</label>
                <input name="date" value={expenseForm.date} onChange={handleExpenseChange} required type="date" className="dash-input" style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500' }}>Notes</label>
                <input name="notes" value={expenseForm.notes} onChange={handleExpenseChange} className="dash-input" style={{ width: '100%' }} />
              </div>
              <button type="submit" className="action-btn" style={{ background: '#4338ca', color: 'white', padding: '10px' }}>Save Expense</button>
            </form>

            <div style={{ marginTop: '30px' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '15px' }}>Summary by Category</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {expensesByCategory && expensesByCategory.length ? expensesByCategory.map(c => (
                  <li key={c.category} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ color: '#64748b' }}>{c.category}</span>
                    <span style={{ fontWeight: '600', color: '#334155' }}>{formatCurrency(c.total)}</span>
                  </li>
                )) : <li style={{ color: '#94a3b8' }}>No expenses this month</li>}
              </ul>
            </div>
          </div>

          <div className="dashboard-section" style={{ flex: '2', minWidth: '400px' }}>
            <h2 className="section-title">Expense History</h2>
            <div style={{ overflowX: 'auto' }}>
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rawExpenses && rawExpenses.length ? rawExpenses.map(exp => {
                    const isEditing = editingExpenseId === (exp._id || exp.id);
                    return (
                      <tr key={exp._id || exp.id}>
                        {isEditing ? (
                          <>
                            <td><input type="date" value={editExpenseData.date?.slice(0,10) || ''} onChange={e => setEditExpenseData({...editExpenseData, date: e.target.value})} className="dash-input" style={{ padding: '6px' }}/></td>
                            <td>
                              <select value={editExpenseData.category || ''} onChange={e => setEditExpenseData({...editExpenseData, category: e.target.value})} className="dash-input" style={{ padding: '6px' }}>
                                <option>Rent</option><option>Internet</option><option>Salary</option><option>Electricity</option><option>Interest (Paid to investors)</option><option>Other</option>
                              </select>
                            </td>
                            <td><input type="number" step="0.01" value={editExpenseData.amount || ''} onChange={e => setEditExpenseData({...editExpenseData, amount: e.target.value})} className="dash-input" style={{ padding: '6px', width: '100px', float: 'right' }}/></td>
                            <td style={{ textAlign: 'center' }}>
                              <button onClick={handleEditExpense} className="action-btn" style={{ background: '#10b981', color: 'white', marginRight: '8px' }}>Save</button>
                              <button onClick={() => setEditingExpenseId(null)} className="action-btn" style={{ background: '#94a3b8', color: 'white' }}>Cancel</button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td>{new Date(exp.date).toLocaleDateString()}</td>
                            <td>
                              <span className="badge badge-info">{exp.category}</span>
                              {exp.notes && <span style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>{exp.notes}</span>}
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: '500' }}>{formatCurrency(exp.amount)}</td>
                            <td style={{ textAlign: 'center' }}>
                              <button onClick={() => { setEditingExpenseId(exp._id || exp.id); setEditExpenseData({...exp}); }} className="action-btn btn-edit" style={{ marginRight: '8px' }}>Edit</button>
                              <button onClick={() => handleDeleteExpense(exp._id || exp.id)} className="action-btn btn-delete">Delete</button>
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 0' }}>No individual expenses recorded.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Investors Tab */}
      {activeTab === 'investors' && (
        <div className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">Investors Overview</h2>
            <button className="action-btn" style={{ background: '#f1f5f9', color: '#334155' }}>Refresh Data</button>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            {investorSummaries && investorSummaries.length ? (
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Investor</th>
                    <th style={{ textAlign: 'right' }}>Invested</th>
                    <th style={{ textAlign: 'right' }}>Allocated (Cost)</th>
                    <th style={{ textAlign: 'right' }}>Remaining</th>
                    <th style={{ textAlign: 'right' }}>Used %</th>
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
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4338ca', fontSize: '12px', fontWeight: 'bold' }}>
                              {inv.name.charAt(0).toUpperCase()}
                            </div>
                            <strong>{inv.name}</strong>
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>{formatCurrency(inv.invested)}</td>
                        <td style={{ textAlign: 'right' }}>{formatCurrency(inv.allocatedCost)}</td>
                        <td style={{ textAlign: 'right' }}>
                          <span className={`badge ${inv.remaining < 0 ? 'badge-danger' : 'badge-success'}`}>
                            {formatCurrency(inv.remaining)}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                            <div style={{ width: '60px', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: `${Math.min(inv.pctUsed, 100)}%`, height: '100%', background: inv.pctUsed > 100 ? '#ef4444' : '#10b981' }}></div>
                            </div>
                            <span style={{ fontSize: '13px', fontWeight: '500' }}>{inv.pctUsed.toFixed(1)}%</span>
                          </div>
                        </td>
                      </tr>
                      {expandedInvestors.has(inv._id) && (
                        <tr>
                          <td colSpan="5" style={{ padding: '0', background: '#fafafa' }}>
                            <div style={{ padding: '16px 24px', borderLeft: '4px solid #4338ca' }}>
                              <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#475569' }}>Assigned Inventory</h4>
                              {inv.products && inv.products.length ? (
                                <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                                  <thead>
                                    <tr>
                                      <th style={{ textAlign: 'left', paddingBottom: '8px', color: '#64748b', fontWeight: '500', borderBottom: '1px solid #e2e8f0' }}>Product</th>
                                      <th style={{ textAlign: 'right', paddingBottom: '8px', color: '#64748b', fontWeight: '500', borderBottom: '1px solid #e2e8f0' }}>Cost</th>
                                      <th style={{ textAlign: 'right', paddingBottom: '8px', color: '#64748b', fontWeight: '500', borderBottom: '1px solid #e2e8f0' }}>Stock</th>
                                      <th style={{ textAlign: 'right', paddingBottom: '8px', color: '#64748b', fontWeight: '500', borderBottom: '1px solid #e2e8f0' }}>Value</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {inv.products.map(p => (
                                      <tr key={p._id}>
                                        <td style={{ padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>{p.brand} {p.model}</td>
                                        <td style={{ padding: '8px 0', textAlign: 'right', borderBottom: '1px solid #f1f5f9' }}>{formatCurrency(p.cost)}</td>
                                        <td style={{ padding: '8px 0', textAlign: 'right', borderBottom: '1px solid #f1f5f9' }}>{Number(p.stock || 0)}</td>
                                        <td style={{ padding: '8px 0', textAlign: 'right', borderBottom: '1px solid #f1f5f9', fontWeight: '500' }}>{formatCurrency(Number(p.cost || 0) * Number(p.stock || 0))}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              ) : (
                                <p style={{ margin: 0, color: '#94a3b8', fontSize: '13px' }}>No inventory assigned to this investor.</p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ color: '#94a3b8', textAlign: 'center', padding: '40px 0' }}>No investors data available.</p>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
