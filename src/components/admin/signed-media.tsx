import { useSignedUrl } from "@/hooks/use-signed-url";

/** Storage buckets are private, so previews render through a signed URL. */
export function SignedAudio({
  url,
  className,
  preload,
}: {
  url: string;
  className?: string;
  preload?: "auto" | "metadata" | "none";
}) {
  const signed = useSignedUrl(url);
  if (!signed) return null;
  return <audio controls src={signed} className={className} preload={preload} />;
}

export function SignedImage({
  url,
  alt,
  className,
}: {
  url: string;
  alt: string;
  className?: string;
}) {
  const signed = useSignedUrl(url);
  if (!signed) return <div className={className} />;
  return <img src={signed} alt={alt} className={className} />;
}
