"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import StarRating from "@/components/StarRating";
import {
  ApiRequestError,
  deleteMyReview,
  getMyReview,
  getProductReviews,
  submitReview,
  type Review,
} from "@/lib/api";

export default function ProductReviews({ productId }: { productId: string }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [count, setCount] = useState(0);
  const [myReview, setMyReview] = useState<Review | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function load() {
    getProductReviews(productId).then((res) => {
      setReviews(res.items);
      setAverageRating(res.averageRating);
      setCount(res.count);
    });
  }

  useEffect(load, [productId]);

  useEffect(() => {
    if (!user) {
      setMyReview(null);
      return;
    }
    getMyReview(productId).then((review) => {
      setMyReview(review);
      if (review) {
        setRating(review.rating);
        setComment(review.comment);
      }
    });
  }, [user, productId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (rating < 1) return setError("Please select a star rating.");
    setSubmitting(true);
    try {
      const saved = await submitReview(productId, { rating, comment });
      setMyReview(saved);
      load();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Unable to submit review");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Remove your review?")) return;
    await deleteMyReview(productId);
    setMyReview(null);
    setRating(0);
    setComment("");
    load();
  }

  return (
    <section className="section" style={{ paddingTop: 0 }}>
      <h2>Reviews</h2>
      <div className="rating-summary">
        <span className="avg">{averageRating.toFixed(1)}</span>
        <StarRating rating={averageRating} />
        <span className="muted">({count} review{count === 1 ? "" : "s"})</span>
      </div>

      {user ? (
        <form className="form" onSubmit={handleSubmit} style={{ marginBottom: 28 }}>
          {error && <p className="error-text">{error}</p>}
          <div className="field">
            <label>{myReview ? "Update your rating" : "Your rating"}</label>
            <StarRating rating={rating} onChange={setRating} />
          </div>
          <div className="field">
            <label>Comment</label>
            <textarea required value={comment} onChange={(e) => setComment(e.target.value)} />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="button button-sm" type="submit" disabled={submitting}>
              {submitting ? "Saving..." : myReview ? "Update review" : "Submit review"}
            </button>
            {myReview && (
              <button type="button" className="button button-secondary button-sm" onClick={handleDelete}>
                Delete
              </button>
            )}
          </div>
        </form>
      ) : (
        <p className="muted" style={{ marginBottom: 24 }}>
          <Link href="/login">Log in</Link> to write a review.
        </p>
      )}

      {reviews.length === 0 ? (
        <p className="muted">No reviews yet — be the first!</p>
      ) : (
        reviews.map((review) => (
          <div className="review-row" key={review.id}>
            <div className="review-meta">
              <span className="review-author">{review.user.name}</span>
              <StarRating rating={review.rating} />
              <span className="review-date">{new Date(review.createdAt).toLocaleDateString("en-IN")}</span>
            </div>
            <p>{review.comment}</p>
          </div>
        ))
      )}
    </section>
  );
}
