"use client";

function Star({ filled, onClick, interactive }: { filled: boolean; onClick?: () => void; interactive?: boolean }) {
  return (
    <svg
      onClick={onClick}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill={filled ? "#f5a623" : "none"}
      stroke={filled ? "#f5a623" : "#ccc"}
      strokeWidth="1.5"
      style={{ cursor: interactive ? "pointer" : "default" }}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3.5 14.6 9l6 .87-4.3 4.2 1 6-5.3-2.8-5.3 2.8 1-6L3.4 9.87l6-.87L12 3.5Z"
      />
    </svg>
  );
}

export default function StarRating({
  rating,
  onChange,
  size,
}: {
  rating: number;
  onChange?: (value: number) => void;
  size?: number;
}) {
  const interactive = Boolean(onChange);
  return (
    <span style={{ display: "inline-flex", gap: 2, transform: size ? `scale(${size})` : undefined, transformOrigin: "left center" }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} filled={n <= Math.round(rating)} interactive={interactive} onClick={onChange ? () => onChange(n) : undefined} />
      ))}
    </span>
  );
}
