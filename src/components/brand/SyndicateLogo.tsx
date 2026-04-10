type SyndicateLogoProps = {
  size?: "sm" | "md";
  showWordmark?: boolean;
  muted?: boolean;
};

export default function SyndicateLogo({
  size = "md",
  showWordmark = true,
  muted = false,
}: SyndicateLogoProps) {
  const iconSize = size === "sm" ? 20 : 24;
  const textSize = size === "sm" ? "0.96rem" : "1.08rem";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.62rem",
      }}
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill="none"
        aria-label="Syndicate logo"
      >
        <defs>
          <linearGradient id="syndicate-g" x1="3" y1="4" x2="21" y2="20">
            <stop offset="0%" stopColor="#A78BFA" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
        </defs>
        <path
          d="M17.8 5.8H9a3.1 3.1 0 1 0 0 6.2h6a3.1 3.1 0 1 1 0 6.2H6.2"
          stroke="url(#syndicate-g)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M16.9 5.8h1.2"
          stroke="url(#syndicate-g)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M5.9 18.2h1.2"
          stroke="url(#syndicate-g)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
      {showWordmark ? (
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: textSize,
            color: muted ? "rgba(240,236,230,0.58)" : "var(--text)",
            letterSpacing: "-0.015em",
            lineHeight: 1,
          }}
        >
          Syndicate
        </span>
      ) : null}
    </span>
  );
}
