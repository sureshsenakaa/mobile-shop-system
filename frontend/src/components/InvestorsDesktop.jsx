import React, { useEffect, useState } from 'react';
import { addInvestor, getInvestors, deleteInvestor, recordInvestorPayment } from '../api/investorApi';

const InvestorsDesktop = () => {
  const [form, setForm] = useState({ name: '', amountInvested: '', dateInvested: new Date().toISOString().slice(0,10), monthlyRate: 0, notes: '' });
  const [investors, setInvestors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quickName, setQuickName] = useState('');
  const [quickMatches, setQuickMatches] = useState([]);
  const [processingQuick, setProcessingQuick] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getInvestors();
      setInvestors(data);
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { name: form.name, amountInvested: parseFloat(form.amountInvested), dateInvested: new Date(form.dateInvested), monthlyRate: parseFloat(form.monthlyRate), notes: form.notes };
    try {
      await addInvestor(payload);
      setForm({ name: '', amountInvested: '', dateInvested: new Date().toISOString().slice(0,10), monthlyRate: 0, notes: '' });
      await load();
      alert('Investor added');
    } catch (err) { console.error(err); alert('Failed to add investor'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this investor?')) return;
    try {
      await deleteInvestor(id);
      await load();
    } catch (err) { console.error(err); alert('Failed to delete'); }
  };

  const totalInvested = investors.reduce((s, i) => s + (i.amountInvested || 0), 0);
  const totalMonthlyPay = investors.reduce((s, i) => {
    const amount = Number(i.amountInvested || 0);
    const rate = Number(i.monthlyRate || 0);
    const monthly = Number(i.monthlyPayment ?? (amount * rate / 100));
    return s + (isNaN(monthly) ? 0 : monthly);
  }, 0);

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Investors</h2>
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <form onSubmit={handleSubmit} style={{ minWidth: 280, flex: '1 1 360px', display: 'grid', gap: 8 }}>
          <label>Name</label>
          <input name="name" value={form.name} onChange={handleChange} className="input" required />
          <label>Amount Invested (Rs.)</label>
          <input name="amountInvested" value={form.amountInvested} onChange={handleChange} type="number" step="0.01" className="input" required />
          <label>Date Invested</label>
          <input name="dateInvested" value={form.dateInvested} onChange={handleChange} type="date" className="input" required />
          <label>Monthly Rate (%)</label>
          <input name="monthlyRate" value={form.monthlyRate} onChange={handleChange} type="number" step="0.01" className="input" required />
          <label>Notes</label>
          <input name="notes" value={form.notes} onChange={handleChange} className="input" />
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" className="btn btn-primary">Add Investor</button>
            <button type="button" className="btn btn-ghost" onClick={() => setForm({ name: '', amountInvested: '', dateInvested: new Date().toISOString().slice(0,10), monthlyRate: 0, notes: '' })}>Clear</button>
          </div>
        </form>

        <div style={{ flex: '1 1 480px' }}>
          <div style={{ marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
            <input placeholder="Investor name..." value={quickName} onChange={e => setQuickName(e.target.value)} className="input" style={{ flex: 1 }} />
            <button className="btn btn-primary" onClick={async () => {
              const name = (quickName || '').trim();
              if (!name) { alert('Enter investor name'); return; }
              const nameLower = name.toLowerCase();
              // find exact matches first
              const exact = investors.filter(i => String(i.name).toLowerCase() === nameLower);
              let matches = exact;
              if (matches.length === 0) {
                // fallback to partial match
                matches = investors.filter(i => String(i.name).toLowerCase().includes(nameLower));
              }
              if (matches.length === 0) { alert('No matching investor found'); return; }
              if (matches.length === 1) {
                if (!window.confirm(`Mark payment to ${matches[0].name} as paid?`)) return;
                try {
                  setProcessingQuick(true);
                  const r = await recordInvestorPayment(matches[0]._id);
                  setProcessingQuick(false);
                  if (r && r.success) { alert('Payment recorded'); await load(); setQuickName(''); }
                  else { alert('Failed to record payment: ' + (r && r.error ? r.error : 'unknown')); }
                } catch (e) { setProcessingQuick(false); console.error(e); alert('Failed to record payment'); }
                return;
              }
              // multiple matches -> show list to pick
              setQuickMatches(matches);
            }}>{processingQuick ? 'Processing...' : 'Quick Pay'}</button>
          </div>
          {quickMatches.length > 0 && (
            <div style={{ marginBottom: 12, background: '#fff', padding: 8, borderRadius: 6 }}>
              <div style={{ marginBottom: 6 }}>Multiple matches — click to mark paid:</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {quickMatches.map(m => (
                  <button key={m._id} className="btn btn-ghost" onClick={async () => {
                    if (!window.confirm(`Mark payment to ${m.name} as paid?`)) return;
                    try {
                      setProcessingQuick(true);
                      const r = await recordInvestorPayment(m._id);
                      setProcessingQuick(false);
                      if (r && r.success) { alert('Payment recorded'); await load(); setQuickName(''); setQuickMatches([]); }
                      else { alert('Failed to record payment: ' + (r && r.error ? r.error : 'unknown')); }
                    } catch (e) { setProcessingQuick(false); console.error(e); alert('Failed to record payment'); }
                  }}>{m.name}</button>
                ))}
                <button className="btn btn-ghost" onClick={() => setQuickMatches([])}>Cancel</button>
              </div>
            </div>
          )}
          <h3>Current Investors</h3>
          <p className="muted">Total Invested: <strong>Rs. {totalInvested.toFixed(2)}</strong></p>
          <p className="muted">Total Monthly Pay: <strong>Rs. {totalMonthlyPay.toFixed(2)}</strong></p>

          {loading ? <p>Loading...</p> : (
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Amount</th>
                    <th>Rate (%)</th>
                    <th>Monthly Pay</th>
                    <th>Next Payment</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {investors.map(inv => (
                    <tr key={inv._id}>
                      <td>{inv.name}</td>
                      <td>Rs. {Number(inv.amountInvested).toFixed(2)}</td>
                      <td>{Number(inv.monthlyRate).toFixed(2)}</td>
                      <td>Rs. {Number(inv.monthlyPayment || (inv.amountInvested * (inv.monthlyRate||0)/100)).toFixed(2)}</td>
                      <td>{new Date(inv.nextPaymentDate).toLocaleDateString()}</td>
                      <td style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-ghost" onClick={() => handleDelete(inv._id)}>Delete</button>
                        <button className="btn btn-primary" onClick={async () => {
                          if (!window.confirm(`Mark payment to ${inv.name} as paid?`)) return;
                          try {
                            const r = await recordInvestorPayment(inv._id);
                            if (r && r.success) {
                              alert('Payment recorded');
                              await load();
                            } else {
                              alert('Failed to record payment: ' + (r && r.error ? r.error : 'unknown'));
                            }
                          } catch (e) {
                            console.error(e);
                            alert('Failed to record payment');
                          }
                        }}>Mark Paid</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvestorsDesktop;
