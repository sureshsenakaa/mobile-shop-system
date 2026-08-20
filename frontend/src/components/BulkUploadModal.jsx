import React, { useState, useRef } from 'react';
import { downloadProductTemplate, uploadBulkProducts } from '../api/productApi';

const BulkUploadModal = ({ isOpen, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [uploadErrors, setUploadErrors] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const fileInputRef = useRef(null);

    if (!isOpen) return null;

    const handleDownloadTemplate = async () => {
        try {
            setError(null);
            await downloadProductTemplate();
        } catch (err) {
            setError('Failed to download template. ' + err.message);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFile(e.target.files[0]);
            setError(null);
            setSuccessMessage(null);
            setUploadErrors([]);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            setError('Please select an Excel file first.');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccessMessage(null);
        setUploadErrors([]);

        try {
            const res = await uploadBulkProducts(selectedFile);
            setSuccessMessage(res.message || 'Upload successful');
            if (res.errors && res.errors.length > 0) {
                setUploadErrors(res.errors);
            }
            if (onSuccess) onSuccess();
        } catch (err) {
            setError('Failed to upload file. ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setSelectedFile(null);
        setError(null);
        setSuccessMessage(null);
        setUploadErrors([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
        onClose();
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: '500px', maxWidth: '90%', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0, color: '#333' }}>Excel Bulk Upload</h3>
                    <button onClick={handleClose} style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#999' }}>&times;</button>
                </div>

                <div style={{ marginBottom: '24px', padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#444' }}>Step 1: Download Template</h4>
                    <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#666' }}>Download the standard Excel template, fill it with your product data, and save it.</p>
                    <button 
                        onClick={handleDownloadTemplate} 
                        style={{ padding: '8px 16px', backgroundColor: '#fff', border: '1px solid #1976d2', color: '#1976d2', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        📥 Download Template
                    </button>
                </div>

                <div style={{ marginBottom: '24px', padding: '16px', background: '#e3f2fd', borderRadius: '8px' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#0d47a1' }}>Step 2: Upload Excel File</h4>
                    <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#0d47a1' }}>Select the filled `.xlsx` file and upload it to bulk add products.</p>
                    <input 
                        type="file" 
                        accept=".xlsx, .xls" 
                        onChange={handleFileChange}
                        ref={fileInputRef}
                        style={{ display: 'block', marginBottom: '10px', width: '100%' }}
                    />
                    
                    {error && <div style={{ color: '#d32f2f', fontSize: '13px', marginBottom: '10px', fontWeight: 'bold' }}>{error}</div>}
                    {successMessage && <div style={{ color: '#2e7d32', fontSize: '13px', marginBottom: '10px', fontWeight: 'bold' }}>{successMessage}</div>}
                    
                    {uploadErrors.length > 0 && (
                        <div style={{ maxHeight: '100px', overflowY: 'auto', background: '#fff', padding: '8px', border: '1px solid #ef9a9a', borderRadius: '4px', marginBottom: '10px', fontSize: '12px', color: '#c62828' }}>
                            <strong style={{ display: 'block', marginBottom: '4px' }}>Errors during upload:</strong>
                            <ul style={{ margin: 0, paddingLeft: '16px' }}>
                                {uploadErrors.map((err, i) => <li key={i}>{err}</li>)}
                            </ul>
                        </div>
                    )}

                    <button 
                        onClick={handleUpload} 
                        disabled={loading || !selectedFile}
                        style={{ width: '100%', padding: '10px', backgroundColor: loading || !selectedFile ? '#90caf9' : '#1976d2', color: '#fff', border: 'none', borderRadius: '6px', cursor: loading || !selectedFile ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
                    >
                        {loading ? 'Uploading...' : '🚀 Upload and Save'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BulkUploadModal;
