"use client";

import { useEffect, useState } from "react";
import { createAddress, deleteAddress, getAddresses, type Address } from "@/lib/api";

const EMPTY_ADDRESS = {
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "India",
};

export default function AddressBookTab() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_ADDRESS);
  const [submitting, setSubmitting] = useState(false);

  function load() {
    getAddresses()
      .then((list) => {
        setAddresses(list);
        if (list.length === 0) setShowForm(true);
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createAddress({ ...form, isDefault: addresses.length === 0 });
      setForm(EMPTY_ADDRESS);
      setShowForm(false);
      load();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this address?")) return;
    await deleteAddress(id).catch(() => undefined);
    load();
  }

  if (loading) return <p className="muted">Loading addresses...</p>;

  return (
    <div>
      <div className="address-book-grid">
        {addresses.map((addr) => (
          <div className={`address-card ${addr.isDefault ? "default-address" : ""}`} key={addr.id}>
            {addr.isDefault && <span className="default-badge">Default</span>}
            <strong>{addr.fullName}</strong>
            <p className="address-line">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}, {addr.city}, {addr.state} - {addr.postalCode}</p>
            <p className="address-line">Phone: {addr.phone}</p>
            <button className="order-action-link danger" onClick={() => handleDelete(addr.id)}>Remove</button>
          </div>
        ))}
      </div>

      {!showForm && (
        <button className="address-add-lite" onClick={() => setShowForm(true)}>+ Add New Address</button>
      )}

      {showForm && (
        <form className="address-card new-address-form" onSubmit={handleSubmit}>
          <div className="modal-field-stack">
            <div className="modal-row-two">
              <input placeholder="Full Name" required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
              <input placeholder="Phone" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <input placeholder="Address Line 1" required value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} />
            <input placeholder="Address Line 2 (optional)" value={form.line2} onChange={(e) => setForm({ ...form, line2: e.target.value })} />
            <div className="modal-row-two">
              <input placeholder="City" required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              <input placeholder="State" required value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
            </div>
            <input placeholder="Postal Code" required value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button type="submit" className="purchase-btn" disabled={submitting} style={{ width: "auto", padding: "10px 24px" }}>
              {submitting ? "Saving..." : "Save Address"}
            </button>
            {addresses.length > 0 && (
              <button type="button" className="address-add-lite" onClick={() => setShowForm(false)}>Cancel</button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
