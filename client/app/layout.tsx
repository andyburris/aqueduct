import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Inspector } from "tinybase/ui-react-inspector";

const geistSans = localFont({
  src: "./theme/fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./theme/fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});
const libreCaslonCondensed = localFont({
  src: './theme/fonts/LibreCaslonCondensed.ttf',
  display: 'swap',
  variable: "--libre-caslon-condensed",
  weight: "100 900",
})

export const metadata: Metadata = {
  title: "Aqueduct Demo",
  description: "A demonstration of Aqueduct",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="end" className="">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${libreCaslonCondensed.variable} antialiased text-lg/6 font-sans text-neutral-900`}
      >
        {children}
      </body>
    </html>
  );
}
