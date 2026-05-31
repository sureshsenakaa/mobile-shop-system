import React, { useState, useEffect, useRef } from 'react';

// 1. Import existing components
import AddProductDesktop from './components/AddProductDesktop';
import AddCustomerDesktop from './components/AddCustomerDesktop';
import AddSupplierDesktop from './components/AddSupplierDesktop';
import AddRepairDesktop from './components/AddRepairDesktop';
import ProductListDesktop from './components/ProductListDesktop';
import CustomerListDesktop from './components/CustomerListDesktop';
import SupplierListDesktop from './components/SupplierListDesktop';
import RepairListDesktop from './components/RepairListDesktop';

// 2. Import NEW Sales components
import AddSaleDesktop from './components/AddSaleDesktop';
import SalesListDesktop from './components/SalesListDesktop';
import Dashboard from './components/Dashboard';
import InvestorsDesktop from './components/InvestorsDesktop';
import SupplierStockReport from './components/SupplierStockReport';

// navigation uses CSS classes from index.css

const App = () => {
    const [view, setView] = useState('SalesList'); // Default to Sales view for quick access
    const [refreshKey, setRefreshKey] = useState(0);
    const [latestSaleId, setLatestSaleId] = useState(null);
    // Authentication removed — always run app without signing in
    const [authUser, setAuthUser] = useState(() => ({ username: 'local' }));

    // Logo support (stored as data URL in localStorage)
    const [logo, setLogo] = useState(() => {
        try { return localStorage.getItem('appLogo'); } catch (e) { return null; }
    });
    const fileInputRef = useRef(null);

    useEffect(() => {
        try {
            const stored = localStorage.getItem('appLogo');
            if (stored) setLogo(stored);
        } catch (err) { /* ignore */ }
    }, []);

    const handleLogoClick = () => fileInputRef.current && fileInputRef.current.click();

    const handleLogoChange = (e) => {
        const f = e.target.files && e.target.files[0];
        if (!f) return;
        const reader = new FileReader();
        reader.onload = () => {
            const data = reader.result;
            try { localStorage.setItem('appLogo', data); } catch (err) { console.warn('Could not save logo', err); }
            setLogo(data);
        };
        reader.readAsDataURL(f);
    };

    const removeLogo = () => {
        try { localStorage.removeItem('appLogo'); } catch (err) { /* ignore */ }
        setLogo(null);
    };

    const handleFormSuccess = (newId) => {
        if (view.startsWith('Add')) {
            setRefreshKey(prev => prev + 1); // Trigger refresh
            if (newId) setLatestSaleId(newId);
            // Special-case AddSale -> SalesList (note plural)
            if (view === 'AddSale') {
                setView('SalesList');
            } else {
                setView(view.replace('Add', '') + 'List');
            }
        }
    };

    const handleLogout = () => {
        // No-op since auth removed; but keep API for UI buttons
        setAuthUser({ username: 'local' });
    };

    const renderView = () => {
        switch (view) {
            // --- Add Forms ---
            case 'AddProduct': return <AddProductDesktop onProductAdded={handleFormSuccess} onCancel={() => setView('ProductList')} />;
            case 'AddCustomer': return <AddCustomerDesktop onCustomerAdded={handleFormSuccess} onCancel={() => setView('CustomerList')} />;
            case 'AddSupplier': return <AddSupplierDesktop onSupplierAdded={handleFormSuccess} onCancel={() => setView('SupplierList')} />;
            case 'AddRepair': return <AddRepairDesktop onRepairAdded={handleFormSuccess} onCancel={() => setView('RepairList')} />;
            case 'AddSale': return <AddSaleDesktop onSaleAdded={handleFormSuccess} onCancel={() => setView('SalesList')} />;
            
            // --- List Views ---
            case 'ProductList': return <ProductListDesktop onAddClick={() => setView('AddProduct')} />;
            case 'CustomerList': return <CustomerListDesktop onAddClick={() => setView('AddCustomer')} />;
            case 'SupplierList': return <SupplierListDesktop key={refreshKey} onAddClick={() => setView('AddSupplier')} />;
            case 'SupplierStock': return <SupplierStockReport />;
            case 'RepairList': return <RepairListDesktop onAddClick={() => setView('AddRepair')} />;
            case 'Dashboard': return <Dashboard />;
            case 'Investors': return <InvestorsDesktop />;
            case 'SalesList': return <SalesListDesktop key={refreshKey} refreshKey={refreshKey} latestSaleId={latestSaleId} onAddClick={() => setView('AddSale')} />;
            
            default: return <SalesListDesktop key={refreshKey} refreshKey={refreshKey} latestSaleId={latestSaleId} onAddClick={() => setView('AddSale')} />;
        }
    };

    return (
        <div style={{ fontFamily: 'Segoe UI, sans-serif', backgroundColor: 'var(--bg)', minHeight: '100vh' }}>
            <header className="app-header">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                    {logo ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <img src={logo} alt="Logo" className="header-logo" />
                            <h1 className="app-title"><span className="xtreme">XTREME</span> <span className="mobile">MOBILE</span></h1>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button className="btn btn-ghost" onClick={handleLogoClick}>Change</button>
                                <button className="btn" onClick={removeLogo}>Remove</button>
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <h1 className="app-title"><span className="xtreme">XTREME</span> <span className="mobile">MOBILE</span></h1>
                        </div>
                    )}
                    <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoChange} />
                </div>

                <div className="nav">
                    <button className={`nav-button green ${view.includes('Sales') ? 'active' : ''}`} onClick={() => setView('SalesList')}>💰 Sales</button>
                    <button className={`nav-button blue ${view.includes('Dashboard') ? 'active' : ''}`} onClick={() => setView('Dashboard')}>📊 Dashboard</button>
                    <button className={`nav-button blue ${view.includes('Product') ? 'active' : ''}`} onClick={() => setView('ProductList')}>📦 Stock</button>
                    <button className={`nav-button orange ${view.includes('Repair') ? 'active' : ''}`} onClick={() => setView('RepairList')}>🔧 Repairs</button>
                    <button className={`nav-button green ${view.includes('Customer') ? 'active' : ''}`} onClick={() => setView('CustomerList')}>👥 CRM</button>
                    <button className={`nav-button purple ${view.includes('Supplier') ? 'active' : ''}`} onClick={() => setView('SupplierList')}>🚚 Supply</button>
                    <button className={`nav-button purple ${view.includes('SupplierStock') ? 'active' : ''}`} onClick={() => setView('SupplierStock')}>📦 By Supplier</button>
                    <button className={`nav-button purple ${view.includes('Investors') ? 'active' : ''}`} onClick={() => setView('Investors')}>💼 Investors</button>
                </div>
                <div style={{ marginLeft: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ fontSize: 14, opacity: 0.9 }}>Local mode</div>
                </div>
            </header>

            <main className="app-container">
                {renderView()}
            </main>
        </div>
    );
};

export default App;