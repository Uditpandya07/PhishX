import "../index.css";
import Script from "next/script";
import CustomCursor from "../components/CustomCursor";

export const metadata = {
  title: "PhishX | Advanced Enterprise Cybersecurity & Threat Intelligence",
  description: "PhishX is a next-generation AI-powered phishing analysis engine. Protect your enterprise with real-time threat detection, advanced email scanning, and live cyber intelligence.",
  keywords: ["cybersecurity", "phishing analysis", "threat detection", "enterprise security", "malware scanner", "AI security", "infosec", "CyberPulse"],
  authors: [{ name: "PhishX Security Team" }],
  openGraph: {
    title: "PhishX | Deep Enterprise Security",
    description: "Next-Generation AI-powered Phishing Analysis Engine and live threat intelligence platform.",
    url: "https://phishx.com",
    siteName: "PhishX",
    type: "website",
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'PhishX Threat Intelligence',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PhishX | Advanced Enterprise Cybersecurity',
    description: 'Next-Generation AI-powered Phishing Analysis Engine.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: 'https://phishx.com',
  },
  icons: {
    icon: '/logo-icon.png',
    apple: '/logo-icon.png',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <script async src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`} />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
                page_path: window.location.pathname,
              });
            `,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "PhishX",
              "operatingSystem": "Web",
              "applicationCategory": "SecurityApplication",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "description": "Next-Generation AI-powered Phishing Analysis Engine and live threat intelligence platform."
            })
          }}
        />
      </head>
      <body className="bg-slate-950 text-white min-h-screen">
        <CustomCursor />
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
        {children}
      </body>
    </html>
  );
}
