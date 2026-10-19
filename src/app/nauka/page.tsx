import { Suspense } from "react";
import { NaukaClient } from "./ui";

export default function NaukaPage() {
  return (
    <Suspense fallback={<p className="text-muted">Wczytywanie zestawu…</p>}>
      <NaukaClient />
    </Suspense>
  );
}
