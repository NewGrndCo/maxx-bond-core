import { useEffect, useState } from "react";
import { signStorageUrl } from "@/lib/storage-url";

export function useSignedUrl(url: string | null | undefined): string {
  const [signed, setSigned] = useState<string>("");
  useEffect(() => {
    let cancelled = false;
    if (!url) {
      setSigned("");
      return;
    }
    void signStorageUrl(url).then((next) => {
      if (!cancelled) setSigned(next);
    });
    return () => {
      cancelled = true;
    };
  }, [url]);
  return signed;
}
