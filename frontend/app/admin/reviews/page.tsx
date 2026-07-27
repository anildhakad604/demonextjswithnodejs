"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StarRating from "@/components/StarRating";
import { deleteAdminReview, getAdminReviews, moderateReview, type Review } from "@/lib/api";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    getAdminReviews()
      .then(setReviews)
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function toggleApproved(review: Review) {
    await moderateReview(review.id, !review.isApproved);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this review?")) return;
    await deleteAdminReview(id);
    load();
  }

  return (
    <>
      <h1>Reviews</h1>
      {loading ? (
        <p className="muted">Loading...</p>
      ) : reviews.length === 0 ? (
        <p className="muted">No reviews yet.</p>
      ) : (
        <table className="table">
          <thead>
            <tr><th>Product</th><th>Customer</th><th>Rating</th><th>Comment</th><th>Visible</th><th></th></tr>
          </thead>
          <tbody>
            {reviews.map((review) => (
              <tr key={review.id}>
                <td>
                  {review.product ? (
                    <Link href={`/products/${review.product.slug}`}>{review.product.name}</Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td>{review.user.name}</td>
                <td><StarRating rating={review.rating} /></td>
                <td style={{ maxWidth: 320 }}>{review.comment}</td>
                <td>{review.isApproved ? "Yes" : "Hidden"}</td>
                <td style={{ display: "flex", gap: 8 }}>
                  <button className="button button-secondary button-sm" onClick={() => toggleApproved(review)}>
                    {review.isApproved ? "Hide" : "Show"}
                  </button>
                  <button className="button button-danger button-sm" onClick={() => handleDelete(review.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
