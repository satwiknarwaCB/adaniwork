import type { Metadata } from "next";
import Script from "next/script";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/app/components/ThemeProvider";
import { ReactQueryProvider } from "@/app/components/ReactQueryProvider";
import { GlobalLoader } from "@/app/components/GlobalLoader";

// Add the Adani font
const adani = localFont({
  src: "../public/adani.ttf",
  variable: "--font-adani",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AGEL FY 25-26 Commissioning Status Portal",
  description: "Track commissioning status for AGEL FY 25-26",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        {process.env.NODE_ENV === "development" && (
          <Script
            src="//unpkg.com/react-grab/dist/index.global.js"
            crossOrigin="anonymous"
            strategy="beforeInteractive"
          />
        )}
        {process.env.NODE_ENV === "development" && (
          <Script
            src="//unpkg.com/@react-grab/gemini/dist/client.global.js"
            strategy="lazyOnload"
          />
        )}
      </head>
      <body
        className={`${adani.variable} antialiased h-full font-sans`}
        style={{ fontFamily: 'var(--font-adani)' }}
      >
        <ReactQueryProvider>
          <ThemeProvider>
            <GlobalLoader />
            {children}
          </ThemeProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}