type ManagedImageProps = {
  url?: string | null;
  className: string;
  alt: string;
  priority?: boolean;
};

/** Native images provide predictable decoding, lazy loading and fetch priority. */
export function ManagedImage({ url, className, alt, priority = false }: ManagedImageProps) {
  if (!url) return <div className={`sprite ${className}`} role="img" aria-label={alt} />;

  return (
    <img
      className={`${className} managed-image`}
      src={url}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding={priority ? "sync" : "async"}
    />
  );
}
