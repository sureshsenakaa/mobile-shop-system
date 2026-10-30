import React, { useState, useContext } from 'react';
import ReactDOM from 'react-dom';
import Barcode from 'react-barcode';
import { AuthContext } from '../contexts/AuthContext';

const BarcodePrinter = ({ product, onClose }) => {
    const { authUser } = useContext(AuthContext) || {};
    const [count, setCount] = useState(1);

    // Initial shop name resolution:
    // 1. Saved custom barcode shop name in localStorage
    // 2. authUser.shopName
    // 3. Fallback to 'user' object in localStorage
    const savedShopName = localStorage.getItem('barcodeShopName');
    const userShopName = authUser?.shopName || (() => {
        try {
            return JSON.parse(localStorage.getItem('user') || '{}')?.shopName || '';
        } catch {
            return '';
        }
    })();
    const initialShopName = savedShopName !== null ? savedShopName : userShopName;

    const [shopName, setShopName] = useState(initialShopName);
    const [includeShopName, setIncludeShopName] = useState(
        localStorage.getItem('barcodeIncludeShopName') !== 'false'
    );

    const handlePrint = () => {
        window.print();
    };

    if (!product) return null;

    const printValue = product.selectedImei || product.barcode || product._id;
    const stickerWidth = localStorage.getItem('stickerWidth') || '38';
    const stickerHeight = localStorage.getItem('stickerHeight') || '25';

    const displayName = [product.brand, product.model || product.name].filter(Boolean).join(' ');

    const modalContent = (
        <div className="barcode-printer-modal" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
            
            {/* UI for selecting count and options */}
            <div className="modal-content non-printable" style={{ background: '#fff', padding: '25px', borderRadius: '12px', maxWidth: '420px', width: '90%', textAlign: 'center', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
                <h3 style={{ marginTop: 0, color: '#333', marginBottom: 15 }}>Print Barcode</h3>

                {/* Live Preview Box */}
                <div style={{ padding: '15px', background: '#f9fafb', border: '1px dashed #cbd5e1', borderRadius: '8px', marginBottom: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {includeShopName && shopName && (
                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#1976d2', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                            {shopName}
                        </div>
                    )}
                    <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '3px', color: '#1f2937' }}>
                        {displayName}
                    </div>
                    <div style={{ fontSize: '12px', color: '#4b5563', marginBottom: '8px', fontWeight: '600' }}>
                        Rs. {Number(product.price || 0).toFixed(2)}
                    </div>
                    <Barcode value={printValue} width={1.8} height={50} fontSize={13} margin={0} />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: '12px', marginBottom: 12, textAlign: 'left' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold', fontSize: 13 }}>Copies</label>
                        <input
                            type="number"
                            min="1"
                            max="100"
                            value={count}
                            onChange={(e) => setCount(parseInt(e.target.value) || 1)}
                            className="input"
                            style={{ width: '100%', textAlign: 'center', fontSize: 14 }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold', fontSize: 13 }}>Shop Name</label>
                        <input
                            type="text"
                            value={shopName}
                            disabled={!includeShopName}
                            onChange={(e) => {
                                setShopName(e.target.value);
                                localStorage.setItem('barcodeShopName', e.target.value);
                            }}
                            placeholder="Shop Name"
                            className="input"
                            style={{ width: '100%', fontSize: 13, background: !includeShopName ? '#f3f4f6' : '#fff' }}
                        />
                    </div>
                </div>

                <div style={{ marginBottom: 20, textAlign: 'left' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, userSelect: 'none' }}>
                        <input
                            type="checkbox"
                            checked={includeShopName}
                            onChange={(e) => {
                                setIncludeShopName(e.target.checked);
                                localStorage.setItem('barcodeIncludeShopName', e.target.checked ? 'true' : 'false');
                            }}
                            style={{ cursor: 'pointer' }}
                        />
                        <span>Print Shop Name on Label</span>
                    </label>
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    <button onClick={onClose} className="btn btn-ghost" style={{ padding: '10px 20px' }}>Cancel</button>
                    <button onClick={handlePrint} className="btn btn-primary" style={{ padding: '10px 20px', backgroundColor: '#1976d2', color: 'white' }}>🖨️ Print {count > 1 ? `${count} Copies` : ''}</button>
                </div>
            </div>

            {/* Hidden printable container that shows multiple copies during print */}
            <div className="print-container">
                {Array.from({ length: count }).map((_, idx) => (
                    <div key={idx} className="printable-barcode">
                        {includeShopName && shopName && (
                            <div style={{
                                fontSize: '9px',
                                fontWeight: '900',
                                textTransform: 'uppercase',
                                letterSpacing: '0.3px',
                                marginBottom: '1px',
                                textAlign: 'center',
                                lineHeight: '1',
                                maxWidth: '100%',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                            }}>
                                {shopName}
                            </div>
                        )}
                        <div style={{
                            fontSize: '9px',
                            fontWeight: 'bold',
                            marginBottom: '1px',
                            textAlign: 'center',
                            lineHeight: '1',
                            maxWidth: '100%',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}>
                            {displayName}
                        </div>
                        <div style={{
                            fontSize: '9px',
                            color: '#000',
                            marginBottom: '2px',
                            textAlign: 'center',
                            fontWeight: 'bold',
                            lineHeight: '1'
                        }}>
                            Rs. {Number(product.price || 0).toFixed(2)}
                        </div>
                        <Barcode
                            value={printValue}
                            width={1.2}
                            height={22}
                            fontSize={9}
                            margin={0}
                            displayValue={true}
                        />
                    </div>
                ))}
            </div>

            <style>{`
                @page {
                    size: ${stickerWidth}mm ${stickerHeight}mm;
                    margin: 0;
                }
                .print-container {
                    display: none;
                }
                @media print {
                    /* Hide EVERYTHING in the body except our modal */
                    body > *:not(.barcode-printer-modal) {
                        display: none !important;
                    }
                    
                    /* Reset body margin/padding */
                    body {
                        margin: 0 !important;
                        padding: 0 !important;
                        background: #fff !important;
                    }
                    
                    /* The modal background shouldn't block anything during print */
                    .barcode-printer-modal {
                        background: none !important;
                        position: static !important;
                        display: block !important;
                    }
                    
                    /* Hide the on-screen Print Settings box */
                    .modal-content.non-printable {
                        display: none !important;
                    }
                    
                    /* Reveal our print layout */
                    .print-container {
                        display: block !important;
                    }

                    .printable-barcode {
                        page-break-after: always !important;
                        display: flex !important;
                        flex-direction: column !important;
                        align-items: center !important;
                        justify-content: center !important;
                        width: ${stickerWidth}mm !important;
                        height: ${stickerHeight}mm !important;
                        box-sizing: border-box !important;
                        padding: 1mm !important;
                        overflow: hidden !important;
                    }
                }
            `}</style>
        </div>
    );

    // Render into document.body so it is completely isolated from #root
    return ReactDOM.createPortal(modalContent, document.body);
};

export default BarcodePrinter;
