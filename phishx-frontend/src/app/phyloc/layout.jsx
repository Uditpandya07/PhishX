export const metadata = {
  title: "Phyloc Email Intelligence | PhishX",
  description: "Analyze any email address for threat intelligence, breach history, disposable detection, DNS/SMTP verification and trust scoring — powered by PhishX.",
  robots: { index: false, follow: false }, // Scanner tool — not meant for public indexing
};

export default function PhylocLayout({ children }) {
  return <>{children}</>;
}
