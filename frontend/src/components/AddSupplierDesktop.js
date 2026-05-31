import React, { useState } from "react";
import { addSupplier } from "../api/supplierApi";

const AddSupplierDesktop = ({ onSupplierAdded }) => {
  const [supplierName, setSupplierName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!supplierName) newErrors.supplierName = "Supplier Name required";
    if (!phone) newErrors.phone = "Phone Number required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const newSupplier = {
      name: supplierName,
      phone,
      email,
      address,
      accountNumber,
      notes
    };

    try {
      await addSupplier(newSupplier);
      console.log("New Supplier Data:", newSupplier); 
      onSupplierAdded();
      
      // Reset form on success
      setSupplierName(""); setPhone(""); setEmail(""); setAddress("");
      setAccountNumber(""); setNotes(""); setErrors({});
      alert("Supplier added successfully!");
    } catch (err) {
      alert("Failed to add supplier");
    }
  };

  const inputStyle = (error) => ({
    width: "100%", padding: 12, marginTop: 4, marginBottom: 8, borderRadius: 8,
    border: `1px solid ${error ? "#f44336" : "#ccc"}`, boxSizing: "border-box", fontSize: 16,
  });

  const labelStyle = { fontWeight: "bold", display: "block", marginBottom: 4, color: "#333" };
  const formRowStyle = { display: "flex", gap: "20px", marginBottom: "10px" };
  const formColumnStyle = { flex: 1 };

  return (
    <div style={{ maxWidth: 700, margin: "20px auto", padding: 30, borderRadius: 12, boxShadow: "0 6px 20px rgba(0,0,0,0.1)", backgroundColor: "#fff", fontFamily: "Roboto, sans-serif" }}>
      <h2 style={{ textAlign: "left", color: "#388e3c", marginBottom: 30, borderBottom: "2px solid #388e3c", paddingBottom: 10 }}>
        ➕ Add New Supplier
      </h2>

      <form onSubmit={handleSubmit}>
        
        {/* Row 1: Supplier Name & Phone Number */}
        <div style={formRowStyle}>
          <div style={formColumnStyle}>
            <label style={labelStyle}>🏢 Supplier Name *</label>
            <input type="text" value={supplierName} onChange={(e) => setSupplierName(e.target.value)} style={inputStyle(errors.supplierName)} />
            {errors.supplierName && <span style={{ color: "#f44336", fontSize: 12 }}>{errors.supplierName}</span>}
          </div>
          <div style={formColumnStyle}>
            <label style={labelStyle}>📞 Phone Number *</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle(errors.phone)} />
            {errors.phone && <span style={{ color: "#f44336", fontSize: 12 }}>{errors.phone}</span>}
          </div>
        </div>

        {/* Row 2: Email Address (Full Width) */}
        <label style={labelStyle}>✉️ Email Address</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle()} />
        
        {/* Row 3: Address Line */}
        <label style={labelStyle}>📍 Full Address</label>
        <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} style={inputStyle()} placeholder="Street Address, Area, Region" />

        {/* City and ZIP removed */}

        {/* Row 5: Account Number & Notes */}
        <div style={{ marginTop: 20, borderTop: "1px dashed #ddd", paddingTop: 15 }}>
            <label style={labelStyle}># Supplier Account Number (Optional)</label>
            <input type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} style={inputStyle()} />

            <label style={labelStyle}>📝 Internal Notes (Terms, discounts, etc.)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows="3" style={{ ...inputStyle(), resize: "vertical" }} />
        </div>

        {/* Submit Button */}
        <button 
          type="submit" 
          style={{ width: "100%", padding: 16, marginTop: 30, backgroundColor: "#4caf50", color: "#fff", border: "none", borderRadius: 8, fontSize: 18, fontWeight: "bold", cursor: "pointer", transition: "background-color 0.3s" }}
          onMouseOver={(e) => e.target.style.backgroundColor = "#388e3c"}
          onMouseOut={(e) => e.target.style.backgroundColor = "#4caf50"}
        >
          ✅ Save Supplier
        </button>
      </form>
    </div>
  );
};

export default AddSupplierDesktop;