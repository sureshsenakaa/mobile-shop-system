import React, { useState } from "react";
import { addCustomer } from "../api/customerApi";

const AddCustomerDesktop = ({ onCustomerAdded }) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [address1, setAddress1] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState({});

  

  const validate = () => {
    const newErrors = {};
    if (!firstName) newErrors.firstName = "First Name required";
    if (!lastName) newErrors.lastName = "Last Name required";
    if (!mobile) newErrors.mobile = "Mobile Number required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const newCustomer = {
      firstName, lastName, mobile, email, address1, notes,
      dateAdded: new Date().toISOString(),
    };

    try {
      await addCustomer(newCustomer); // Call backend API
      onCustomerAdded();
      // Reset form
      setFirstName(""); setLastName(""); setMobile(""); setEmail(""); setAddress1(""); setNotes(""); setErrors({});
      alert("Customer added successfully!");
    } catch (err) {
      alert("Failed to add customer");
    }
  };

  const inputStyle = (error) => ({
    width: "100%", padding: 12, marginTop: 4, marginBottom: 8, borderRadius: 8,
    border: `1px solid ${error ? "red" : "#ccc"}`, boxSizing: "border-box", fontSize: 16,
  });
  const labelStyle = { fontWeight: "bold", display: "block", marginBottom: 4, color: "#444" };
  const formRowStyle = { display: "flex", gap: "20px", marginBottom: "10px" };
  const formColumnStyle = { flex: 1 };

  return (
    <div style={{ maxWidth: 800, margin: "20px auto", padding: 30, borderRadius: 12, boxShadow: "0 6px 20px rgba(0,0,0,0.15)", backgroundColor: "#f9f9f9", fontFamily: "Roboto, sans-serif" }}>
      <h2 style={{ textAlign: "left", color: "#0d47a1", marginBottom: 30, borderBottom: "2px solid #0d47a1", paddingBottom: 10 }}>
        New Customer Registration
      </h2>

      <form onSubmit={handleSubmit}>
        
        {/* Row 1: First Name & Last Name */}
        <div style={formRowStyle}>
          <div style={formColumnStyle}>
            <label style={labelStyle}>👤 First Name *</label>
            <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} style={inputStyle(errors.firstName)} />
            {errors.firstName && <span style={{ color: "red", fontSize: 12 }}>{errors.firstName}</span>}
          </div>
          <div style={formColumnStyle}>
            <label style={labelStyle}>👤 Last Name *</label>
            <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} style={inputStyle(errors.lastName)} />
            {errors.lastName && <span style={{ color: "red", fontSize: 12 }}>{errors.lastName}</span>}
          </div>
        </div>

        {/* Row 2: Mobile & Email */}
        <div style={formRowStyle}>
          <div style={formColumnStyle}>
            <label style={labelStyle}>📞 Mobile Number *</label>
            <input type="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} style={inputStyle(errors.mobile)} />
            {errors.mobile && <span style={{ color: "red", fontSize: 12 }}>{errors.mobile}</span>}
          </div>
          <div style={formColumnStyle}>
            <label style={labelStyle}>✉️ Email Address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle()} />
          </div>
        </div>

        {/* Row 3: Address 1 */}
        <div style={formRowStyle}>
          <div style={formColumnStyle}>
            <label style={labelStyle}>🏠 Address Line 1</label>
            <input type="text" value={address1} onChange={(e) => setAddress1(e.target.value)} style={inputStyle()} />
          </div>
        </div>

        {/* Row 6: Marketing & Notes */}
        <div style={{ marginTop: 20, borderTop: "1px dashed #ddd", paddingTop: 15 }}>
            <label style={labelStyle}>📝 Internal Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows="4" style={{ ...inputStyle(), resize: "vertical" }} />
        </div>

        {/* Submit Button */}
        <button 
          type="submit" 
          style={{ width: "100%", padding: 16, marginTop: 30, backgroundColor: "#0d47a1", color: "#fff", border: "none", borderRadius: 8, fontSize: 18, fontWeight: "bold", cursor: "pointer", transition: "background-color 0.3s" }}
          onMouseOver={(e) => e.target.style.backgroundColor = "#1565c0"}
          onMouseOut={(e) => e.target.style.backgroundColor = "#0d47a1"}
        >
          ✅ Save New Customer
        </button>
      </form>
    </div>
  );
};

export default AddCustomerDesktop;