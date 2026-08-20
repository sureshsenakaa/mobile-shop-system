import React, { useState } from "react";
import { addCustomer } from "../api/customerApi";
import './Supplier.css'; // Reusing premium styles

const AddCustomerDesktop = ({ onCustomerAdded }) => {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [address1, setAddress1] = useState("");
  
  // New Phone Shop specific fields
  const [customerType, setCustomerType] = useState("Regular");
  const [deviceNotes, setDeviceNotes] = useState("");
  const [outstandingCredit, setOutstandingCredit] = useState("");

  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!name) newErrors.name = "Name is required";
    if (!mobile) newErrors.mobile = "Mobile Number required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const newCustomer = {
      name, mobile, address1,
      customerType,
      deviceNotes,
      outstandingCredit: outstandingCredit ? parseFloat(outstandingCredit) : 0,
      dateAdded: new Date().toISOString(),
    };

    try {
      await addCustomer(newCustomer);
      onCustomerAdded();
      
      setName(""); setMobile(""); setAddress1("");
      setCustomerType("Regular"); setDeviceNotes(""); setOutstandingCredit("");
      setErrors({});
      alert("Customer added successfully!");
    } catch (err) {
      alert("Failed to add customer");
    }
  };

  return (
    <div className="supplier-container">
      <div className="supplier-header">
        <div>
          <h1 className="supplier-title">Add New Customer</h1>
          <p className="supplier-subtitle">Register a new client for the CRM system.</p>
        </div>
      </div>

      <div className="supplier-card" style={{ maxWidth: 800, margin: '0 auto' }}>
        <form onSubmit={handleSubmit}>
          
          <div style={{ display: 'flex', gap: '20px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">👤 Full Name *</label>
              <input type="text" className="form-input" value={name} onChange={(e) => setName(e.target.value)} style={{ borderColor: errors.name ? 'red' : '' }} />
              {errors.name && <span style={{ color: "red", fontSize: 12 }}>{errors.name}</span>}
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">📞 Mobile Number *</label>
              <input type="tel" className="form-input" value={mobile} onChange={(e) => setMobile(e.target.value)} style={{ borderColor: errors.mobile ? 'red' : '' }} />
              {errors.mobile && <span style={{ color: "red", fontSize: 12 }}>{errors.mobile}</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">🏠 Address Line 1</label>
            <input type="text" className="form-input" value={address1} onChange={(e) => setAddress1(e.target.value)} />
          </div>

          {/* CRM Specific Features Section */}
          <div style={{ marginTop: 20, padding: 20, backgroundColor: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: 16, color: '#334155' }}>📱 Phone Shop Details</h3>
            
            <div style={{ display: 'flex', gap: '20px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">🏷️ Customer Type</label>
                <select className="form-input" value={customerType} onChange={(e) => setCustomerType(e.target.value)}>
                  <option value="Regular">Regular</option>
                  <option value="VIP">VIP</option>
                  <option value="Wholesale">Wholesale</option>
                </select>
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">📱 Device Model (Optional)</label>
                <input type="text" className="form-input" placeholder="e.g. iPhone 13 Pro" value={deviceNotes} onChange={(e) => setDeviceNotes(e.target.value)} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '20px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">💰 Outstanding Credit (Naya) (Rs.)</label>
                <input type="number" className="form-input" placeholder="0.00" value={outstandingCredit} onChange={(e) => setOutstandingCredit(e.target.value)} />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                 {/* Empty column for balance */}
              </div>
            </div>
          </div>



          <button type="submit" className="btn-premium btn-primary" style={{ width: '100%', marginTop: 10, padding: 14 }}>
            ✅ Save New Customer
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddCustomerDesktop;