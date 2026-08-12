import { useState } from "react";
import { ManagedImage } from "@/components/site/managed-image";

type NewsletterContent = {
  headline?: string;
  body?: string;
  image_url?: string;
  cta_label?: string;
};

export function NewsletterSection({ content = {} }: { content?: NewsletterContent }) {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  return (
    <section className="newsletter section-shell reveal">
      <div>
        <h2>{content.headline || "Join the Foreign Life List"}</h2>
        <p>
          {content.body ||
            "Be the first to know about new music, merch drops, tour dates, and exclusive content."}
        </p>
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
          <button type="submit">
            {subscribed ? "Welcome In" : content.cta_label || "Join Now"}
          </button>
        </form>
      </div>
      <ManagedImage className="newsletter-art" url={content.image_url} alt="Newsletter artwork" />
    </section>
  );
}
