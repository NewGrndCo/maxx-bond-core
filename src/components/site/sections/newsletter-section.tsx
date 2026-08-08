import { useState } from "react";

export function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  return (
    <section className="newsletter section-shell reveal">
      <div>
        <h2>Join the Foreign Life List</h2>
        <p>Be the first to know about new music, merch drops, tour dates, and exclusive content.</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSubscribed(true);
            setEmail("");
          }}
        >
          <label className="sr-only" htmlFor="email">
            Enter your email
          </label>
          <input
            id="email"
            type="email"
            placeholder="Enter your email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button type="submit">{subscribed ? "Welcome In" : "Join Now"}</button>
        </form>
      </div>
      <div className="sprite newsletter-art" aria-hidden="true" />
    </section>
  );
}
