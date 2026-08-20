import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import Barcode from 'react-barcode';

const BarcodePrinter = ({ product, onClose }) => {
    const [count, setCount] = useState(1);

    const handlePrint = () => {
        window.print();
    };

    if (!product) return null;

    const printValue = product.selectedImei || product.barcode || product._id;
    const stickerWidth = localStorage.getItem('stickerWidth') || '38';
    const stickerHeight = localStorage.getItem('stickerHeight') || '25';

    const modalContent = (
        <div className="barcode-printer-modal" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
            
            {/* UI for selecting count */}
            <div className="modal-content non-printable" style={{ background: '#fff', padding: '30px', borderRadius: '12px', maxWidth: '400px', width: '100%', textAlign: 'center', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
                <h3 style={{ marginTop: 0, color: '#333', marginBottom: 20 }}>Print Barcode</h3>
                
                <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', marginBottom: 6, fontWeight: 'bold' }}>Number of Copies</label>
                    <input type="number" min="1" max="100" value={count} onChange={(e) => setCount(parseInt(e.target.value) || 1)} className="input" style={{ width: '100px', textAlign: 'center', fontSize: 16 }} />
                </div>

                <div style={{ padding: '20px', background: '#fff', border: '1px dashed #ccc', marginBottom: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>{product.brand} {product.model || product.name}</div>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>Rs. {Number(product.price).toFixed(2)}</div>
                    <Barcode value={printValue} width={2} height={60} fontSize={14} />
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
                        <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '1px', textAlign: 'center', lineHeight: '1' }}>
                            {product.brand} {product.model || product.name}
                        </div>
                        <div style={{ fontSize: '9px', color: '#000', marginBottom: '1px', textAlign: 'center', fontWeight: 'bold', lineHeight: '1' }}>
                            Rs. {Number(product.price).toFixed(2)}
                        </div>
                        <Barcode value={printValue} width={1.2} height={25} fontSize={10} margin={0} displayValue={true} />
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
