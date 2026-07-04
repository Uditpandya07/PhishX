import "../index.css";

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
      </head>
      <body className="bg-slate-950 text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}
