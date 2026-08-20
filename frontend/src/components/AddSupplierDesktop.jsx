import React, { useState } from "react";
import { addSupplier } from "../api/supplierApi";

const AddSupplierDesktop = ({ onSupplierAdded }) => {
  const [supplierName, setSupplierName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [notes, setNotes] = useState("");
  
  // New Phone Shop Specific Fields
  const [brands, setBrands] = useState("");
  const [categories, setCategories] = useState({ phones: false, accessories: false, parts: false });
  const [warrantyTerms, setWarrantyTerms] = useState("");
  const [creditLimit, setCreditLimit] = useState("");
  const [outstandingBalance, setOutstandingBalance] = useState("");

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

    // Convert categories object to array
    const selectedCategories = [];
    if (categories.phones) selectedCategories.push("Phones");
    if (categories.accessories) selectedCategories.push("Accessories");
    if (categories.parts) selectedCategories.push("Repair Parts");

    // Convert brands string to array
    const brandsArray = brands.split(',').map(b => b.trim()).filter(b => b.length > 0);

    const newSupplier = {
      name: supplierName,
      phone,
      email,
      address,
      accountNumber,
      notes,
      brands: brandsArray,
      categories: selectedCategories,
      warrantyTerms,
      creditLimit: creditLimit ? parseFloat(creditLimit) : 0,
      outstandingBalance: outstandingBalance ? parseFloat(outstandingBalance) : 0
    };

    try {
      await addSupplier(newSupplier);
      console.log("New Supplier Data:", newSupplier); 
      onSupplierAdded();
      
      // Reset form on success
      setSupplierName(""); setPhone(""); setEmail(""); setAddress("");
      setAccountNumber(""); setNotes(""); setBrands(""); setWarrantyTerms("");
      setCreditLimit(""); setOutstandingBalance("");
      setCategories({ phones: false, accessories: false, parts: false });
      setErrors({});
      alert("Supplier added successfully!");
    } catch (err) {
      alert("Failed to add supplier");
    }
  };

  const inputStyle = (error) => ({
    width: "100%", padding: 10, marginTop: 4, marginBottom: 8, borderRadius: 6,
    border: `1px solid ${error ? "#f44336" : "#ddd"}`, boxSizing: "border-box", fontSize: 14,
  });

  const labelStyle = { fontWeight: "bold", display: "block", marginBottom: 2, color: "#444", fontSize: 13 };
  const formRowStyle = { display: "flex", gap: "15px", marginBottom: "8px" };
  const formColumnStyle = { flex: 1 };

  return (
    <div style={{ maxWidth: 800, margin: "20px auto", padding: 25, borderRadius: 12, boxShadow: "0 4px 15px rgba(0,0,0,0.05)", backgroundColor: "#fff", fontFamily: "Inter, sans-serif" }}>
      <h2 style={{ textAlign: "left", color: "#2e7d32", margin: "0 0 20px 0", borderBottom: "2px solid #e8f5e9", paddingBottom: 10, fontSize: 22 }}>
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

        {/* Row 2: Email & Address */}
        <div style={formRowStyle}>
          <div style={formColumnStyle}>
            <label style={labelStyle}>✉️ Email Address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle()} />
          </div>
          <div style={formColumnStyle}>
            <label style={labelStyle}>📍 Address</label>
            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} style={inputStyle()} placeholder="City, Region" />
          </div>
        </div>

        <div style={{ marginTop: 15, padding: 15, backgroundColor: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: 15, color: '#334155' }}>📱 Phone Shop Specifics</h3>
            
            {/* Categories */}
            <div style={{ marginBottom: 15 }}>
                <label style={labelStyle}>📦 Supplied Categories</label>
                <div style={{ display: 'flex', gap: 15, marginTop: 5 }}>
                    <label style={{ fontSize: 14, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <input type="checkbox" checked={categories.phones} onChange={(e) => setCategories({...categories, phones: e.target.checked})} /> Phones
                    </label>
                    <label style={{ fontSize: 14, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <input type="checkbox" checked={categories.accessories} onChange={(e) => setCategories({...categories, accessories: e.target.checked})} /> Accessories
                    </label>
                    <label style={{ fontSize: 14, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <input type="checkbox" checked={categories.parts} onChange={(e) => setCategories({...categories, parts: e.target.checked})} /> Repair Parts
                    </label>
                </div>
            </div>

            <div style={formRowStyle}>
                <div style={formColumnStyle}>
                    <label style={labelStyle}>🏷️ Brands (Comma separated)</label>
                    <input type="text" value={brands} onChange={(e) => setBrands(e.target.value)} style={inputStyle()} placeholder="e.g. Apple, Samsung, JBL" />
                </div>
                <div style={formColumnStyle}>
                    <label style={labelStyle}>🛡️ Warranty Terms</label>
                    <input type="text" value={warrantyTerms} onChange={(e) => setWarrantyTerms(e.target.value)} style={inputStyle()} placeholder="e.g. 6 Months, No Warranty on LCD" />
                </div>
            </div>

            <div style={formRowStyle}>
                <div style={formColumnStyle}>
                    <label style={labelStyle}>💳 Credit Limit (Rs.)</label>
                    <input type="number" value={creditLimit} onChange={(e) => setCreditLimit(e.target.value)} style={inputStyle()} placeholder="e.g. 500000" />
                </div>
                <div style={formColumnStyle}>
                    <label style={labelStyle}>💰 Outstanding Balance Owed (Rs.)</label>
                    <input type="number" value={outstandingBalance} onChange={(e) => setOutstandingBalance(e.target.value)} style={inputStyle()} placeholder="e.g. 15000" />
                </div>
            </div>
        </div>

        <div style={{ marginTop: 20 }}>
            <label style={labelStyle}># Supplier Account Number (Optional)</label>
            <input type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} style={inputStyle()} />

            <label style={labelStyle}>📝 Internal Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows="2" style={{ ...inputStyle(), resize: "vertical" }} />
        </div>

        <button 
          type="submit" 
          style={{ width: "100%", padding: 14, marginTop: 20, backgroundColor: "#2e7d32", color: "#fff", border: "none", borderRadius: 8, fontSize: 16, fontWeight: "bold", cursor: "pointer", transition: "background-color 0.2s" }}
          onMouseOver={(e) => e.target.style.backgroundColor = "#1b5e20"}
          onMouseOut={(e) => e.target.style.backgroundColor = "#2e7d32"}
        >
          ✅ Save Supplier
        </button>
      </form>
    </div>
  );
};

export default AddSupplierDesktop;