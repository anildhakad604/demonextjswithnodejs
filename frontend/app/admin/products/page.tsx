"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiRequestError, deleteProduct, getProducts, type Product } from "@/lib/api";
import { formatINR } from "@/lib/format";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    getProducts({ includeInactive: true, limit: 100 })
      .then((res) => setProducts(res.items))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleDelete(id: string) {
    if (!confirm("Delete this product?")) return;
    try {
      await deleteProduct(id);
      load();
    } catch (err) {
      alert(err instanceof ApiRequestError ? err.message : "Unable to delete product");
    }
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Products</h1>
        <Link className="button" href="/admin/products/new">+ New Product</Link>
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="table">
          <thead>
            <tr><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>{product.name}</td>
                <td>{product.category?.name}</td>
                <td>{formatINR(product.price)}</td>
                <td>{product.stock}</td>
                <td>{product.isActive ? "Active" : "Inactive"}</td>
                <td style={{ display: "flex", gap: 8 }}>
                  <Link className="button button-secondary button-sm" href={`/admin/products/${product.id}`}>Edit</Link>
                  <button className="button button-danger button-sm" onClick={() => handleDelete(product.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
