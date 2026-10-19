import type { Metadata } from "next";
import { Source_Sans_3, Source_Serif_4 } from "next/font/google";
import Script from "next/script";
import { Header } from "@/components/header";
import "./globals.css";

const sans = Source_Sans_3({
  subsets: ["latin", "latin-ext"],
  variable: "--font-source-sans",
});

const serif = Source_Serif_4({
  subsets: ["latin", "latin-ext"],
  variable: "--font-source-serif",
});

export const metadata: Metadata = {
  title: "Pozwolenie kolekcjonerskie — egzamin WPA",
  description:
    "Przygotowanie do egzaminu na pozwolenie kolekcjonerskie. Pula 200 pytań Małopolskiej WPA. Egzamin próbny: 20 pytań, maksymalnie 2 błędy.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl" suppressHydrationWarning>
      <body className={`${sans.variable} ${serif.variable} antialiased`}>
        <Script id="theme-init" strategy="beforeInteractive">
          {`try{if(localStorage.getItem("wpa-theme")==="dark")document.documentElement.dataset.theme="dark"}catch(e){}`}
        </Script>
        <Header />
        <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10">{children}</main>
        <footer className="mx-auto max-w-3xl space-y-3 px-4 pb-10 text-sm leading-relaxed text-muted sm:px-6">
          <p>
            Pytania i zaznaczone odpowiedzi pochodzą z oficjalnej puli Małopolskiej WPA na egzamin
            przeprowadzany na podstawie art. 16 ust. 1 ustawy o broni i amunicji.
          </p>
          <p>
            Jeśli strona się przydaje, możesz{" "}
            <a
              href="https://buycoffee.to/patios"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-forest underline-offset-2 hover:underline"
            >
              postawić autorowi kawę
            </a>
            .
          </p>
        </footer>
      </body>
    </html>
  );
}
