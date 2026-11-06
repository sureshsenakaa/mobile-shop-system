import React, { useState, useEffect } from 'react';
import { getTodayRegister, openRegister, closeRegister, getRegisterHistory } from '../api/cashRegisterApi';

const fmt = (x) => `Rs. ${Number(x || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const CashRegister = () => {
    const [activeTab, setActiveTab] = useState('today');
    const [loading, setLoading] = useState(true);
    const [register, setRegister] = useState(null);
    const [data, setData] = useState({});

    // Open register form
    const [openingBalance, setOpeningBalance] = useState('');

    // Close register form
    const [closingBalance, setClosingBalance] = useState('');
    const [notes, setNotes] = useState('');
    const [closing, setClosing] = useState(false);

    // Denomination Calculator Modal
    const [showCalculator, setShowCalculator] = useState(false);
    const [denoms, setDenoms] = useState({
        d5000: '', d1000: '', d500: '', d100: '', d50: '', d20: '', d10: '', d5: '', coins: ''
    });

    const handleDenomChange = (field, val) => setDenoms(prev => ({ ...prev, [field]: val }));
    const calcDenomTotal = () => {
        return (Number(denoms.d5000) || 0) * 5000 +
               (Number(denoms.d1000) || 0) * 1000 +
               (Number(denoms.d500) || 0) * 500 +
               (Number(denoms.d100) || 0) * 100 +
               (Number(denoms.d50) || 0) * 50 +
               (Number(denoms.d20) || 0) * 20 +
               (Number(denoms.d10) || 0) * 10 +
               (Number(denoms.d5) || 0) * 5 +
               (Number(denoms.coins) || 0);
    };
    const handleUseTotal = () => {
        setClosingBalance(calcDenomTotal());
        setShowCalculator(false);
    };

    // History
    const [historyMonth, setHistoryMonth] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    });
    const [history, setHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    const fetchToday = async () => {
        setLoading(true);
        try {
            const result = await getTodayRegister();
            if (result && result.register) {
                setRegister(result.register);
                setData(result);
            } else if (result && result.status) {
                setRegister(result);
                setData(result);
            } else {
                setRegister(null);
                setData({});
            }
        } catch (err) {
            console.error(err);
            setRegister(null);
            setData({});
        }
        setLoading(false);
    };

    const fetchHistory = async () => {
        setHistoryLoading(true);
        try {
            const result = await getRegisterHistory(historyMonth);
            setHistory(Array.isArray(result) ? result : (result && result.history ? result.history : []));
        } catch (err) {
            console.error(err);
            setHistory([]);
        }
        setHistoryLoading(false);
    };

    useEffect(() => { fetchToday(); }, []);
    useEffect(() => { if (activeTab === 'history') fetchHistory(); }, [activeTab, historyMonth]);

    const handleOpen = async () => {
        const bal = parseFloat(openingBalance);
        if (isNaN(bal) || bal < 0) return alert('Please enter a valid opening balance');
        try {
            await openRegister(bal);
            setOpeningBalance('');
            await fetchToday();
        } catch (err) {
            alert(err.message || 'Failed to open register');
        }
    };

    const handleClose = async () => {
        const bal = parseFloat(closingBalance);
        if (isNaN(bal) || bal < 0) return alert('Please enter a valid closing balance');
        if (!window.confirm('Are you sure you want to close the register for today?')) return;
        setClosing(true);
        try {
            await closeRegister(bal, notes);
            setClosingBalance('');
            setNotes('');
            await fetchToday();
        } catch (err) {
            alert(err.message || 'Failed to close register');
        } finally {
            setClosing(false);
        }
    };

    const difference = register && register.status === 'open'
        ? (parseFloat(closingBalance) || 0) - (Number(data.expectedBalance) || 0)
        : register ? (Number(register.closingBalance || 0) - Number(data.expectedBalance || register.expectedBalance || 0)) : 0;

    const tabBtnStyle = (tab) => ({
        padding: '10px 24px',
        border: 'none',
        borderBottom: activeTab === tab ? '3px solid #1976d2' : '3px solid transparent',
        background: 'transparent',
        color: activeTab === tab ? '#1976d2' : '#666',
        fontWeight: activeTab === tab ? '700' : '500',
        fontSize: 15,
        cursor: 'pointer',
        transition: 'all 0.2s'
    });

    const handlePrintZReport = (targetRegister = null) => {
        const reg = targetRegister || register;
        if (!reg) return;

        const diff = Number(reg.closingBalance || 0) - Number(reg.expectedBalance || 0);
        const openerName = reg.opener?.username || (reg.openedBy ? `User ${reg.openedBy}` : '-');
        const closerName = reg.closer?.username || (reg.closedBy ? `User ${reg.closedBy}` : '-');

        const receiptHtml = `
            <html>
            <head>
                <title>Z-Report - Shift #${reg.shiftNumber || 1}</title>
                <style>
                    body { font-family: 'Courier New', monospace, Arial; padding: 20px; color: #000; font-size: 13px; max-width: 320px; margin: 0 auto; }
                    hr { border-top: 1px dashed #000; border-bottom: none; margin: 8px 0; }
                    .row { display: flex; justify-content: space-between; margin: 4px 0; }
                    .bold { font-weight: bold; }
                    .center { text-align: center; }
                    @media print {
                        body { padding: 0; margin: 0; width: 100%; }
                    }
                </style>
            </head>
            <body>
                <h3 class="center" style="margin:0 0 4px 0;">CASH REGISTER REPORT</h3>
                <h4 class="center" style="margin:0 0 10px 0;">(Z-REPORT / SHIFT SUMMARY)</h4>
                <div class="row"><span>Date:</span><span>${reg.date ? new Date(reg.date).toLocaleDateString() : '-'}</span></div>
                <div class="row bold"><span>Shift:</span><span>Shift #${reg.shiftNumber || 1}</span></div>
                <div class="row"><span>Status:</span><span>${reg.status === 'open' ? 'OPEN (IN PROGRESS)' : 'CLOSED'}</span></div>
                <hr>
                <div class="row"><span>Opened By:</span><span>${openerName}</span></div>
                <div class="row"><span>Opened At:</span><span>${reg.openedAt ? new Date(reg.openedAt).toLocaleTimeString() : '-'}</span></div>
                ${reg.status === 'closed' ? `
                <div class="row"><span>Closed By:</span><span>${closerName}</span></div>
                <div class="row"><span>Closed At:</span><span>${reg.closedAt ? new Date(reg.closedAt).toLocaleTimeString() : '-'}</span></div>
                ` : ''}
                <hr>
                <div class="row"><span>Opening Float:</span><span>${fmt(reg.openingBalance)}</span></div>
                <div class="row"><span>Cash In:</span><span>${fmt(reg.cashIn || data.cashIn)}</span></div>
                <div class="row"><span>Card/Bank In:</span><span>${fmt(reg.cardIn || data.cardIn)}</span></div>
                <div class="row"><span>Cash Out (Expenses):</span><span>${fmt(reg.cashOut || data.cashOut)}</span></div>
                <hr>
                <div class="row bold" style="font-size:14px;"><span>Expected Drawer:</span><span>${fmt(reg.expectedBalance || data.expectedBalance)}</span></div>
                <div class="row bold" style="font-size:14px;"><span>Counted Cash:</span><span>${reg.closingBalance !== null && reg.closingBalance !== undefined ? fmt(reg.closingBalance) : 'Pending'}</span></div>
                <hr>
                <div class="row bold"><span>Difference:</span><span>${fmt(diff)} ${diff >= 0 ? '(OK)' : '(SHORT)'}</span></div>
                ${reg.notes ? `<div style="margin-top:8px;"><span>Notes:</span><p style="margin:2px 0;">${reg.notes}</p></div>` : ''}
                <hr>
                <p class="center" style="font-size:11px; margin-top:12px;">-- END OF SHIFT REPORT --</p>
                <script>
                    window.onload = function() { window.print(); };
                </script>
            </body>
            </html>
        `;

        const newWindow = window.open('', '_blank', 'width=400,height=600');
        if (newWindow) {
            newWindow.document.open();
            newWindow.document.write(receiptHtml);
            newWindow.document.close();
        } else {
            alert('Popup blocked. Please allow popups for this site to print receipts.');
        }
    };

    const cardStyle = (bg) => ({
        background: bg,
        borderRadius: 12,
        padding: '20px',
        flex: 1,
        textAlign: 'center',
        minWidth: 150
    });

    const cardValueStyle = { fontSize: 24, fontWeight: 'bold', margin: '10px 0' };
    const cardLabelStyle = { fontSize: 13, color: '#666' };

    return (
        <div className="card" style={{ maxWidth: 1100, margin: '0 auto' }}>
            <h2 style={{ textAlign: 'center', color: '#333', marginBottom: 0 }}>🏧 Daily Cash Register</h2>

            <div style={{ display: 'flex', borderBottom: '1px solid #e0e0e0', marginBottom: 20, marginTop: 10 }}>
                <button style={tabBtnStyle('today')} onClick={() => setActiveTab('today')}>📅 Today</button>
                <button style={tabBtnStyle('history')} onClick={() => setActiveTab('history')}>📋 History</button>
            </div>

            {activeTab === 'today' && (
                <div>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>Loading...</div>
                    ) : !register ? (
                        /* --- Open Shift #1 Form --- */
                        <div style={{ maxWidth: 440, margin: '40px auto', textAlign: 'center' }}>
                            <div style={{ fontSize: 48, marginBottom: 16 }}>🔐</div>
                            <h3 style={{ color: '#333', marginBottom: 8 }}>Cash Register Not Opened</h3>
                            <p style={{ color: '#666', marginBottom: 24 }}>Open Shift #1 to start tracking today's cash flow.</p>
                            <label className="form-label" style={{ textAlign: 'left' }}>Opening Cash Float (Rs.)</label>
                            <input
                                className="input"
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="Enter opening cash float (e.g. 5000)..."
                                value={openingBalance}
                                onChange={e => setOpeningBalance(e.target.value)}
                                style={{ marginBottom: 16 }}
                            />
                            <button className="btn btn-primary" onClick={handleOpen} style={{ width: '100%', padding: '12px', fontSize: 15 }}>
                                🔓 Start Shift #1
                            </button>
                        </div>
                    ) : (
                        /* --- Shift Open or Closed --- */
                        <div>
                            {/* Summary Cards */}
                            <div style={{ display: 'flex', gap: 15, marginBottom: 24, flexWrap: 'wrap' }}>
                                <div style={cardStyle('#e8f5e9')}>
                                    <div style={cardLabelStyle}>💵 Cash In</div>
                                    <div style={{ ...cardValueStyle, color: '#2e7d32' }}>{fmt(data.cashIn)}</div>
                                    <div style={cardLabelStyle}>Sales + Repairs</div>
                                </div>
                                <div style={cardStyle('#e3f2fd')}>
                                    <div style={cardLabelStyle}>💳 Card/Bank In</div>
                                    <div style={{ ...cardValueStyle, color: '#1565c0' }}>{fmt(data.cardIn)}</div>
                                    <div style={cardLabelStyle}>Card & Bank Transfers</div>
                                </div>
                                <div style={cardStyle('#ffebee')}>
                                    <div style={cardLabelStyle}>📤 Cash Out</div>
                                    <div style={{ ...cardValueStyle, color: '#c62828' }}>{fmt(data.cashOut)}</div>
                                    <div style={cardLabelStyle}>Expenses & Drops</div>
                                </div>
                                <div style={cardStyle('#fff8e1')}>
                                    <div style={cardLabelStyle}>💰 Expected Drawer Balance</div>
                                    <div style={{ fontSize: 26, fontWeight: 'bold', margin: '10px 0', color: '#e65100' }}>{fmt(data.expectedBalance)}</div>
                                    <div style={cardLabelStyle}>Float ({fmt(register.openingBalance)}) + In - Out</div>
                                </div>
                            </div>

                            {/* Extra Info Pills */}
                            <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
                                <div style={{ background: '#f5f7fa', borderRadius: 8, padding: '10px 16px', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ fontSize: 13, color: '#666' }}>Active Shift:</span>
                                    <span style={{ fontWeight: '700', color: '#1976d2', background: '#e3f2fd', padding: '2px 10px', borderRadius: 12, fontSize: 13 }}>
                                        Shift #{register.shiftNumber || 1}
                                    </span>
                                </div>
                                <div style={{ background: '#f5f7fa', borderRadius: 8, padding: '10px 16px', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ fontSize: 13, color: '#666' }}>Opened By:</span>
                                    <span style={{ fontWeight: '700', color: '#333' }}>
                                        {register.opener?.username || (register.openedBy ? `User ${register.openedBy}` : '-')}
                                    </span>
                                    <span style={{ fontSize: 12, color: '#888' }}>
                                        ({register.openedAt ? new Date(register.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'})
                                    </span>
                                </div>
                                <div style={{ background: '#f5f7fa', borderRadius: 8, padding: '10px 16px', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ fontSize: 13, color: '#666' }}>Opening Float:</span>
                                    <span style={{ fontWeight: '700', color: '#333' }}>{fmt(register.openingBalance)}</span>
                                </div>
                                <div style={{ background: '#f5f7fa', borderRadius: 8, padding: '10px 16px', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ fontSize: 13, color: '#666' }}>Sales Count:</span>
                                    <span style={{ fontWeight: '700', color: '#333' }}>{data.salesCount || 0}</span>
                                </div>
                                <div style={{ background: '#f5f7fa', borderRadius: 8, padding: '10px 16px', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ fontSize: 13, color: '#666' }}>Status:</span>
                                    <span style={{
                                        fontWeight: '600',
                                        padding: '2px 10px',
                                        borderRadius: 12,
                                        fontSize: 13,
                                        background: register.status === 'open' ? '#fff3e0' : '#e8f5e9',
                                        color: register.status === 'open' ? '#ef6c00' : '#2e7d32'
                                    }}>
                                        {register.status === 'open' ? '🟡 In Progress' : '🟢 Closed'}
                                    </span>
                                </div>
                            </div>

                            {/* Shift Actions Row */}
                            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                                {register.status === 'open' ? (
                                    /* --- Close Shift Section --- */
                                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24, flex: 1, minWidth: 320, maxWidth: 520 }}>
                                        <h3 style={{ marginTop: 0, color: '#1e293b' }}>🔒 Close Shift #{register.shiftNumber || 1}</h3>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                            <label className="form-label" style={{ margin: 0 }}>Actual Cash Counted (Rs.)</label>
                                            <button className="btn" style={{ padding: '4px 8px', fontSize: 13, background: '#e3f2fd', color: '#1565c0', border: '1px solid #bbdefb', borderRadius: 4, cursor: 'pointer' }} onClick={() => setShowCalculator(true)}>
                                                🧮 Calculator
                                            </button>
                                        </div>
                                        <input
                                            className="input"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            placeholder="Count physical cash in drawer and enter..."
                                            value={closingBalance}
                                            onChange={e => setClosingBalance(e.target.value)}
                                        />

                                        {closingBalance !== '' && (
                                            <div style={{
                                                marginTop: 12,
                                                padding: '12px 16px',
                                                borderRadius: 8,
                                                background: difference >= 0 ? '#e8f5e9' : '#ffebee',
                                                color: difference >= 0 ? '#2e7d32' : '#c62828',
                                                fontWeight: '700',
                                                fontSize: 15
                                            }}>
                                                Difference: {fmt(difference)} {difference >= 0 ? '✅ (Balanced / Excess)' : '⚠️ (Cash Shortage)'}
                                            </div>
                                        )}

                                        <label className="form-label" style={{ marginTop: 16 }}>Handover Notes (optional)</label>
                                        <textarea
                                            className="input"
                                            rows={2}
                                            placeholder="Notes for handover or discrepancy..."
                                            value={notes}
                                            onChange={e => setNotes(e.target.value)}
                                            style={{ resize: 'vertical' }}
                                        />

                                        <button className="btn btn-danger" onClick={handleClose} disabled={closing} style={{ marginTop: 16, width: '100%', padding: '12px', opacity: closing ? 0.7 : 1, cursor: closing ? 'not-allowed' : 'pointer' }}>
                                            {closing ? '⏳ Closing Shift...' : `🔒 Close Shift #${register.shiftNumber || 1}`}
                                        </button>
                                    </div>
                                ) : (
                                    /* --- Shift Closed Card --- */
                                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24, flex: 1, minWidth: 320, maxWidth: 500 }}>
                                        <h3 style={{ marginTop: 0, color: '#2e7d32' }}>✅ Shift #{register.shiftNumber || 1} Closed</h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ color: '#666' }}>Closed By:</span>
                                                <span style={{ fontWeight: '600' }}>
                                                    {register.closer?.username || (register.closedBy ? `User ${register.closedBy}` : '-')}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ color: '#666' }}>Closed At:</span>
                                                <span>{register.closedAt ? new Date(register.closedAt).toLocaleTimeString() : '-'}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ color: '#666' }}>Closing Count:</span>
                                                <span style={{ fontWeight: '700' }}>{fmt(register.closingBalance)}</span>
                                            </div>
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                padding: '10px 0',
                                                borderTop: '1px solid #e0e0e0',
                                                borderBottom: '1px solid #e0e0e0',
                                                alignItems: 'center'
                                            }}>
                                                <span style={{ fontWeight: '600' }}>Difference:</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    <span style={{
                                                        fontWeight: '700',
                                                        fontSize: 17,
                                                        color: difference >= 0 ? '#2e7d32' : '#c62828'
                                                    }}>
                                                        {fmt(difference)} {difference >= 0 ? '✅' : '⚠️'}
                                                    </span>
                                                    <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: 13 }} onClick={() => handlePrintZReport(register)}>
                                                        🖨️ Z-Report
                                                    </button>
                                                </div>
                                            </div>
                                            {register.notes && (
                                                <div>
                                                    <span style={{ color: '#666', fontSize: 13 }}>Notes:</span>
                                                    <p style={{ margin: '4px 0 0', color: '#333' }}>{register.notes}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* --- Option to Open Next Shift when current is closed --- */}
                                {register.status === 'closed' && (
                                    <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 12, padding: 24, flex: 1, minWidth: 320, maxWidth: 500 }}>
                                        <h3 style={{ marginTop: 0, color: '#0369a1' }}>
                                            🔓 Start Shift #{data.nextShiftNumber || ((data.todayShifts?.length || 1) + 1)}
                                        </h3>
                                        <p style={{ color: '#555', fontSize: 13, marginBottom: 16 }}>
                                            Handover to next cashier? Enter opening cash float to begin Shift #{data.nextShiftNumber || ((data.todayShifts?.length || 1) + 1)}.
                                        </p>
                                        <label className="form-label">Opening Cash Float (Rs.)</label>
                                        <input
                                            className="input"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            placeholder={`Opening float (e.g. 5000)...`}
                                            value={openingBalance}
                                            onChange={e => setOpeningBalance(e.target.value)}
                                            style={{ marginBottom: 14 }}
                                        />
                                        <button className="btn btn-primary" onClick={handleOpen} style={{ width: '100%', padding: '12px', fontSize: 15 }}>
                                            🔓 Start Shift #{data.nextShiftNumber || ((data.todayShifts?.length || 1) + 1)}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* --- Today's Shifts List (දවසේ Shifts) --- */}
                            {data.todayShifts && data.todayShifts.length > 0 && (
                                <div style={{ marginTop: 36 }}>
                                    <h3 style={{ color: '#333', fontSize: 17, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                                        📋 Today's Shifts Log (දවසේ Shifts)
                                        <span style={{ fontSize: 12, fontWeight: 'normal', color: '#555', background: '#e2e8f0', padding: '2px 8px', borderRadius: 10 }}>
                                            {data.todayShifts.length} {data.todayShifts.length === 1 ? 'shift' : 'shifts'} today
                                        </span>
                                    </h3>
                                    <div style={{ overflowX: 'auto', background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                                        <table>
                                            <thead>
                                                <tr style={{ background: '#f8fafc' }}>
                                                    <th>Shift</th>
                                                    <th>Opened By</th>
                                                    <th>Closed By</th>
                                                    <th style={{ textAlign: 'right' }}>Opening Float</th>
                                                    <th style={{ textAlign: 'right' }}>Cash In</th>
                                                    <th style={{ textAlign: 'right' }}>Cash Out</th>
                                                    <th style={{ textAlign: 'right' }}>Expected</th>
                                                    <th style={{ textAlign: 'right' }}>Actual</th>
                                                    <th style={{ textAlign: 'right' }}>Diff</th>
                                                    <th>Status</th>
                                                    <th style={{ textAlign: 'center' }}>Report</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.todayShifts.map((sh, idx) => {
                                                    const shDiff = Number(sh.closingBalance || 0) - Number(sh.expectedBalance || 0);
                                                    return (
                                                        <tr key={sh.id || idx}>
                                                            <td style={{ fontWeight: '700' }}>Shift #{sh.shiftNumber || (idx + 1)}</td>
                                                            <td>
                                                                <div>{sh.opener?.username || (sh.openedBy ? `User ${sh.openedBy}` : '-')}</div>
                                                                <div style={{ fontSize: 11, color: '#888' }}>
                                                                    {sh.openedAt ? new Date(sh.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <div>{sh.status === 'closed' ? (sh.closer?.username || (sh.closedBy ? `User ${sh.closedBy}` : '-')) : '-'}</div>
                                                                <div style={{ fontSize: 11, color: '#888' }}>
                                                                    {sh.closedAt ? new Date(sh.closedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                                                                </div>
                                                            </td>
                                                            <td style={{ textAlign: 'right' }}>{fmt(sh.openingBalance)}</td>
                                                            <td style={{ textAlign: 'right' }}>{fmt(sh.cashIn)}</td>
                                                            <td style={{ textAlign: 'right' }}>{fmt(sh.cashOut)}</td>
                                                            <td style={{ textAlign: 'right', fontWeight: '600' }}>{fmt(sh.expectedBalance)}</td>
                                                            <td style={{ textAlign: 'right' }}>{sh.status === 'closed' ? fmt(sh.closingBalance) : '-'}</td>
                                                            <td style={{
                                                                textAlign: 'right',
                                                                fontWeight: '700',
                                                                color: sh.status === 'closed' ? (shDiff >= 0 ? '#2e7d32' : '#c62828') : '#999'
                                                            }}>
                                                                {sh.status === 'closed' ? fmt(shDiff) : '-'}
                                                            </td>
                                                            <td>
                                                                <span style={{
                                                                    padding: '3px 8px',
                                                                    borderRadius: 12,
                                                                    fontSize: 12,
                                                                    fontWeight: '600',
                                                                    background: sh.status === 'open' ? '#fff3e0' : '#e8f5e9',
                                                                    color: sh.status === 'open' ? '#ef6c00' : '#2e7d32'
                                                                }}>
                                                                    {sh.status === 'open' ? 'Open' : 'Closed'}
                                                                </span>
                                                            </td>
                                                            <td style={{ textAlign: 'center' }}>
                                                                <button
                                                                    className="btn"
                                                                    style={{ padding: '3px 8px', fontSize: 12, background: '#f1f5f9', border: '1px solid #cbd5e1', cursor: 'pointer' }}
                                                                    onClick={() => handlePrintZReport(sh)}
                                                                >
                                                                    🖨️ Print
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'history' && (
                <div>
                    <div style={{ marginBottom: 20 }}>
                        <label className="form-label">Select Month</label>
                        <input
                            type="month"
                            className="input"
                            value={historyMonth}
                            onChange={e => setHistoryMonth(e.target.value)}
                            style={{ maxWidth: 220 }}
                        />
                    </div>

                    {historyLoading ? (
                        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>Loading history...</div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Shift #</th>
                                        <th>Opened By</th>
                                        <th>Closed By</th>
                                        <th style={{ textAlign: 'right' }}>Opening</th>
                                        <th style={{ textAlign: 'right' }}>Cash In</th>
                                        <th style={{ textAlign: 'right' }}>Cash Out</th>
                                        <th style={{ textAlign: 'right' }}>Expected</th>
                                        <th style={{ textAlign: 'right' }}>Actual</th>
                                        <th style={{ textAlign: 'right' }}>Diff</th>
                                        <th>Status</th>
                                        <th style={{ textAlign: 'center' }}>Report</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.map((h, idx) => {
                                        const diff = Number(h.closingBalance || 0) - Number(h.expectedBalance || 0);
                                        return (
                                            <tr key={h._id || idx}>
                                                <td>{h.date ? new Date(h.date).toLocaleDateString() : '-'}</td>
                                                <td style={{ fontWeight: '600' }}>Shift #{h.shiftNumber || 1}</td>
                                                <td>{h.opener?.username || (h.openedBy ? `User ${h.openedBy}` : '-')}</td>
                                                <td>{h.closer?.username || (h.closedBy ? `User ${h.closedBy}` : '-')}</td>
                                                <td style={{ textAlign: 'right' }}>{fmt(h.openingBalance)}</td>
                                                <td style={{ textAlign: 'right' }}>{fmt(h.cashIn)}</td>
                                                <td style={{ textAlign: 'right' }}>{fmt(h.cashOut)}</td>
                                                <td style={{ textAlign: 'right' }}>{fmt(h.expectedBalance)}</td>
                                                <td style={{ textAlign: 'right' }}>{fmt(h.closingBalance)}</td>
                                                <td style={{
                                                    textAlign: 'right',
                                                    fontWeight: '700',
                                                    color: h.status === 'closed' ? (diff >= 0 ? '#2e7d32' : '#c62828') : '#999'
                                                }}>
                                                    {h.status === 'closed' ? fmt(diff) : '-'}
                                                </td>
                                                <td>
                                                    <span style={{
                                                        padding: '3px 10px',
                                                        borderRadius: 12,
                                                        fontSize: 12,
                                                        fontWeight: '600',
                                                        background: h.status === 'open' ? '#fff3e0' : '#e8f5e9',
                                                        color: h.status === 'open' ? '#ef6c00' : '#2e7d32'
                                                    }}>
                                                        {h.status === 'open' ? 'Open' : 'Closed'}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <button
                                                        className="btn"
                                                        style={{ padding: '3px 8px', fontSize: 12, background: '#f1f5f9', border: '1px solid #cbd5e1', cursor: 'pointer' }}
                                                        onClick={() => handlePrintZReport(h)}
                                                    >
                                                        🖨️ Z-Report
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {history.length === 0 && (
                                        <tr><td colSpan={12} style={{ textAlign: 'center', padding: 30, color: '#999' }}>No register records found for this month.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
            {showCalculator && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div className="card" style={{ background: '#fff', padding: 24, borderRadius: 12, width: 400, maxWidth: '90%', margin: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <h3 style={{ margin: 0 }}>🧮 Denomination Calculator</h3>
                            <button onClick={() => setShowCalculator(false)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', padding: 0 }}>&times;</button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px', maxHeight: '60vh', overflowY: 'auto', paddingRight: 5 }}>
                            {[5000, 1000, 500, 100, 50, 20, 10, 5].map(d => (
                                <div key={d} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span>{d} x</span>
                                    <input className="input" type="number" min="0" style={{ width: 80, padding: '4px 8px', margin: 0 }} value={denoms[`d${d}`]} onChange={e => handleDenomChange(`d${d}`, e.target.value)} />
                                </div>
                            ))}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gridColumn: 'span 2', marginTop: 10 }}>
                                <span>Coins (Total Value)</span>
                                <input className="input" type="number" min="0" style={{ width: 80, padding: '4px 8px', margin: 0 }} value={denoms.coins} onChange={e => handleDenomChange('coins', e.target.value)} />
                            </div>
                        </div>
                        <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #eee' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
                                <span>Total:</span>
                                <span>{fmt(calcDenomTotal())}</span>
                            </div>
                            <button className="btn btn-primary" onClick={handleUseTotal} style={{ width: '100%', padding: '10px' }}>Use Total</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CashRegister;
