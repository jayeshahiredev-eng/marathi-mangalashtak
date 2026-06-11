import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "मराठी मंगलाष्टक 💍",
  description:
    "मराठी वधू-वरांसाठी सुरक्षित व सोपी विवाह परिचय सेवा. 100% विनामूल्य नोंदणी.",

  icons: {
    icon: "/icon.png",
  },

  openGraph: {
    title: "मराठी मंगलाष्टक 💍",
    description:
      "मराठी वधू-वरांसाठी सुरक्षित व सोपी विवाह परिचय सेवा. 100% विनामूल्य नोंदणी.",
    url: "https://marathimangalashtak.com",
    siteName: "मराठी मंगलाष्टक",
    locale: "mr_IN",
    type: "website",
    images: [
      {
        url: "https://marathimangalashtak.com/icon.png",
        width: 512,
        height: 512,
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "मराठी मंगलाष्टक 💍",
    description:
      "मराठी वधू-वरांसाठी सुरक्षित व सोपी विवाह परिचय सेवा.",
    images: ["https://marathimangalashtak.com/icon.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
