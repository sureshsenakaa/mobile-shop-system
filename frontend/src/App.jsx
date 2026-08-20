import React, { useState, useEffect, useContext } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { AuthContext } from './contexts/AuthContext';

// Import components
import Login from './components/Login';
import AddProductDesktop from './components/AddProductDesktop';
import AddCustomerDesktop from './components/AddCustomerDesktop';
import AddSupplierDesktop from './components/AddSupplierDesktop';
import AddRepairDesktop from './components/AddRepairDesktop';
import ProductListDesktop from './components/ProductListDesktop';
import CustomerListDesktop from './components/CustomerListDesktop';
import SupplierListDesktop from './components/SupplierListDesktop';
import RepairListDesktop from './components/RepairListDesktop';
import PartListDesktop from './components/PartListDesktop';
import AddPartDesktop from './components/AddPartDesktop';
import PartCategoryGrid from './components/PartCategoryGrid';
import AddSaleDesktop from './components/AddSaleDesktop';
import SalesListDesktop from './components/SalesListDesktop';
import Dashboard from './components/Dashboard';
import InvestorsDesktop from './components/InvestorsDesktop';
import SupplierStockReport from './components/SupplierStockReport';
import ShopManagement from './components/ShopManagement';
import StaffManagement from './components/StaffManagement';
import Settings from './components/Settings';
import WarrantyCheck from './components/WarrantyCheck';
import PublicRepairTracking from './components/PublicRepairTracking';
import PayrollReport from './components/PayrollReport';
import PurchaseOrders from './components/PurchaseOrders';
import Returns from './components/Returns';
import AdvancedAnalytics from './components/AdvancedAnalytics';
import SubscriptionBilling from './components/SubscriptionBilling';
import SubscriptionApprovals from './components/SubscriptionApprovals';
import CashRegister from './components/CashRegister';
import QuotationList from './components/QuotationList';
import AddQuotation from './components/AddQuotation';

import { API_BASE_URL } from './api/config';

const App = () => {
    const { authUser, login, logout, loading } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    
    const [refreshKey, setRefreshKey] = useState(0);
    const [latestSaleId, setLatestSaleId] = useState(null);
    const [selectedPartCategory, setSelectedPartCategory] = useState(null);

    // Update document title dynamically
    useEffect(() => {
        if (authUser) {
            document.title = authUser.role === 'super_admin' ? 'Mobile Zone Manager' : (authUser.shopName || 'Mobile Zone Manager');
            // Navigate to default route on initial login if at root
            if (location.pathname === '/' || location.pathname === '/login') {
                navigate(authUser.role === 'super_admin' ? '/shops' : '/sales');
            }
        } else {
            document.title = 'Mobile Zone Manager';
        }
    }, [authUser, location.pathname, navigate]);

    const handleFormSuccess = (newId, redirectPath) => {
        setRefreshKey(prev => prev + 1);
        if (newId) setLatestSaleId(newId);
        navigate(redirectPath);
    };

    if (loading) return null; // or a spinner

    if (!authUser && location.pathname !== '/warranty' && location.pathname !== '/tracking') {
        return <Login onLogin={login} />;
    }

    if (!authUser && (location.pathname === '/warranty' || location.pathname === '/tracking')) {
        return (
            <main className="app-container" style={{ margin: 0, padding: 0, minHeight: '100vh', background: '#f5f7fa' }}>
                <Routes>
                    <Route path="/warranty" element={<WarrantyCheck />} />
                    <Route path="/tracking" element={<PublicRepairTracking />} />
                </Routes>
            </main>
        );
    }

    const isSuperAdmin = authUser.role === 'super_admin';
    const isShopAdmin = authUser.role === 'shop_admin';

    return (
        <div>
            <header className="app-header">
                <div className="header-brand" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {authUser.logoUrl && !isSuperAdmin && (
                        <img src={`${API_BASE_URL.replace('/api', '')}${authUser.logoUrl}`} alt="Logo" className="header-logo" />
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <h1 className="app-title">
                            {isSuperAdmin ? 'MOBILE ZONE MANAGER' : (authUser.shopName || 'MY SHOP')}
                        </h1>
                        <span className="app-title-subtitle">Logged in as: {authUser.username}</span>
                    </div>
                </div>

                <div className="nav">
                    {isSuperAdmin && (
                        <>
                            <button className={`nav-button purple ${location.pathname.includes('/shops') ? 'active' : ''}`} onClick={() => navigate('/shops')}>🏬 Shops</button>
                            <button className={`nav-button green ${location.pathname.includes('/subscription-approvals') ? 'active' : ''}`} onClick={() => navigate('/subscription-approvals')}>💳 Subscriptions</button>
                        </>
                    )}
                    
                    {!isSuperAdmin && (
                        <>
                            <button className={`nav-button green ${location.pathname.includes('/sales') ? 'active' : ''}`} onClick={() => navigate('/sales')}>💰 Sales</button>
                            <button className={`nav-button blue ${location.pathname.includes('/dashboard') || location.pathname.includes('/analytics') ? 'active' : ''}`} onClick={() => navigate('/dashboard')}>📊 Dashboard</button>
                            <button className={`nav-button blue ${location.pathname.includes('/products') || location.pathname.includes('/purchase-orders') || location.pathname.includes('/returns') ? 'active' : ''}`} onClick={() => navigate('/products')}>📦 Stock</button>
                            <button className={`nav-button orange ${(location.pathname.includes('/repairs') || location.pathname.includes('/parts') || location.pathname.includes('/part-categories')) ? 'active' : ''}`} onClick={() => navigate('/repairs')}>🔧 Repairs</button>
                            <button className={`nav-button green ${location.pathname.includes('/customers') ? 'active' : ''}`} onClick={() => navigate('/customers')}>👥 CRM</button>
                            <button className={`nav-button green ${location.pathname.includes('/cash-register') ? 'active' : ''}`} onClick={() => navigate('/cash-register')}>🏧 Register</button>
                            <button className={`nav-button blue ${location.pathname.includes('/quotation') ? 'active' : ''}`} onClick={() => navigate('/quotations')}>📝 Quotes</button>
                        </>
                    )}

                    {isShopAdmin && (
                        <>
                            <button className={`nav-button purple ${location.pathname.includes('/suppliers') && !location.pathname.includes('stock') ? 'active' : ''}`} onClick={() => navigate('/suppliers')}>🚚 Supply</button>
                            <button className={`nav-button purple ${location.pathname === '/purchase-orders' ? 'active' : ''}`} onClick={() => navigate('/purchase-orders')}>🛒 POs</button>
                            <button className={`nav-button purple ${location.pathname === '/returns' ? 'active' : ''}`} onClick={() => navigate('/returns')}>🔙 Returns</button>
                            <button className={`nav-button purple ${location.pathname === '/payroll' ? 'active' : ''}`} onClick={() => navigate('/payroll')}>💸 Payroll</button>
                            <button className={`nav-button purple ${location.pathname === '/analytics' ? 'active' : ''}`} onClick={() => navigate('/analytics')}>📈 Analytics</button>
                            <button className={`nav-button purple ${location.pathname.includes('/investors') ? 'active' : ''}`} onClick={() => navigate('/investors')}>💼 Investors</button>
                            <button className={`nav-button orange ${location.pathname === '/staff' ? 'active' : ''}`} onClick={() => navigate('/staff')}>👥 Staff</button>
                            <button className={`nav-button green ${location.pathname === '/billing' ? 'active' : ''}`} onClick={() => navigate('/billing')}>💳 Billing</button>
                        </>
                    )}
                </div>

                <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button className="btn btn-ghost" onClick={() => navigate('/settings')}>⚙️ Settings</button>
                    <button className="btn btn-danger" onClick={logout}>Logout</button>
                </div>
            </header>

            <main className="app-container">
                <Routes>
                    <Route path="/add-product" element={<AddProductDesktop onProductAdded={(id) => handleFormSuccess(id, '/products')} onCancel={() => navigate('/products')} />} />
                    <Route path="/add-customer" element={<AddCustomerDesktop onCustomerAdded={(id) => handleFormSuccess(id, '/customers')} onCancel={() => navigate('/customers')} />} />
                    <Route path="/add-supplier" element={<AddSupplierDesktop onSupplierAdded={(id) => handleFormSuccess(id, '/suppliers')} onCancel={() => navigate('/suppliers')} />} />
                    <Route path="/add-repair" element={<AddRepairDesktop onRepairAdded={(id) => handleFormSuccess(id, '/repairs')} onCancel={() => navigate('/repairs')} />} />
                    <Route path="/add-part" element={<AddPartDesktop defaultCategory={selectedPartCategory} onPartAdded={() => { setRefreshKey(prev => prev + 1); navigate(selectedPartCategory ? `/parts/${selectedPartCategory}` : '/part-categories'); }} onCancel={() => navigate(selectedPartCategory ? `/parts/${selectedPartCategory}` : '/part-categories')} />} />
                    <Route path="/add-sale" element={<AddSaleDesktop onSaleAdded={(id) => handleFormSuccess(id, '/sales')} onCancel={() => navigate('/sales')} />} />
                    
                    <Route path="/products" element={<ProductListDesktop onAddClick={() => navigate('/add-product')} />} />
                    <Route path="/customers" element={<CustomerListDesktop onAddClick={() => navigate('/add-customer')} />} />
                    <Route path="/suppliers" element={<SupplierListDesktop key={refreshKey} onAddClick={() => navigate('/add-supplier')} />} />
                    <Route path="/supplier-stock" element={<SupplierStockReport />} />
                    <Route path="/repairs" element={<RepairListDesktop onAddClick={() => navigate('/add-repair')} onManageParts={() => navigate('/part-categories')} />} />
                    <Route path="/part-categories" element={<PartCategoryGrid key={refreshKey} onCategorySelect={(cat) => { setSelectedPartCategory(cat); navigate(`/parts/${cat}`); }} onBack={() => navigate('/repairs')} />} />
                    <Route path="/parts/:category" element={<PartListDesktop onAddClick={() => navigate('/add-part')} onBack={() => navigate('/part-categories')} filterCategory={selectedPartCategory} />} />
                    <Route path="/parts" element={<PartListDesktop onAddClick={() => navigate('/add-part')} onBack={() => navigate('/part-categories')} />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/investors" element={<InvestorsDesktop />} />
                    <Route path="/sales" element={<SalesListDesktop key={refreshKey} refreshKey={refreshKey} latestSaleId={latestSaleId} onAddClick={() => navigate('/add-sale')} authUser={authUser} />} />
                    
                    {isSuperAdmin && (
                        <>
                            <Route path="/shops" element={<ShopManagement />} />
                            <Route path="/subscription-approvals" element={<SubscriptionApprovals />} />
                        </>
                    )}
                    
                    <Route path="/staff" element={<StaffManagement />} />
                    <Route path="/settings" element={<Settings user={authUser} />} />
                    
                    <Route path="/payroll" element={<PayrollReport />} />
                    <Route path="/purchase-orders" element={<PurchaseOrders />} />
                    <Route path="/returns" element={<Returns />} />
                    <Route path="/analytics" element={<AdvancedAnalytics />} />
                    
                    <Route path="/billing" element={<SubscriptionBilling />} />

                    <Route path="/cash-register" element={<CashRegister />} />
                    <Route path="/quotations" element={<QuotationList onAddClick={() => navigate('/add-quotation')} />} />
                    <Route path="/add-quotation" element={<AddQuotation onQuotationAdded={(id) => handleFormSuccess(id, '/quotations')} onCancel={() => navigate('/quotations')} />} />

                    <Route path="*" element={<Navigate to={isSuperAdmin ? '/shops' : '/sales'} replace />} />
                </Routes>
            </main>
        </div>
    );
};

export default App;