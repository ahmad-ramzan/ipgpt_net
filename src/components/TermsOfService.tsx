import React from "react";
import { FileText, Mail, ShieldAlert } from "lucide-react";

const serviceFeatures = [
  "IP Address Lookup",
  "ISP Information",
  "Geolocation Information",
  "Residential IP Detection",
  "Mobile IP Detection",
  "Datacenter IP Detection",
  "VPN Detection",
  "Proxy Detection",
  "WebRTC Leak Detection",
  "Timezone Information",
];

const prohibitedUses = [
  "Abuse the service",
  "Attempt to disrupt website operations",
  "Use the website for unlawful activities",
  "Circumvent security mechanisms",
];

export const TermsOfService: React.FC = () => {
  return (
    <main className="max-w-[980px] mx-auto px-4 sm:px-6 pt-10 pb-16">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-cyan-400">
            Last Updated: August 2026
          </p>
          <h1 className="mt-3 text-3xl sm:text-5xl font-black tracking-tight text-white">
            Terms of Service
          </h1>
        </div>
        <div className="hidden sm:flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-300">
          <FileText className="h-7 w-7" />
        </div>
      </div>

      <article className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 sm:p-8 shadow-2xl shadow-black/20">
        <section className="space-y-4 text-sm sm:text-base leading-7 text-slate-300">
          <p>
            IPGPT.net provides IP address lookup and network analysis services.
          </p>
          <p>By using this website, you agree to these terms.</p>
        </section>

        <TermsSection title="Service Features">
          <p>IPGPT.net may provide:</p>
          <BulletList items={serviceFeatures} />
        </TermsSection>

        <TermsSection title="Disclaimer">
          <p>
            All information provided is for informational purposes only.
            Accuracy may vary depending on data providers and network
            conditions.
          </p>
        </TermsSection>

        <TermsSection title="Prohibited Use">
          <p>Users may not:</p>
          <BulletList items={prohibitedUses} />
        </TermsSection>

        <TermsSection title="Limitation of Liability">
          <p>
            IPGPT.net shall not be responsible for any losses, damages, or
            decisions made based on information provided by the website.
          </p>
        </TermsSection>

        <TermsSection title="Changes">
          <p>
            We reserve the right to modify or discontinue services at any time
            without prior notice.
          </p>
        </TermsSection>

        <TermsSection title="Contact">
          <a
            href="mailto:digicorehub2025@gmail.com"
            className="inline-flex items-center gap-2 font-bold text-cyan-300 transition-colors hover:text-cyan-200"
          >
            <Mail className="h-4 w-4" />
            digicorehub2025@gmail.com
          </a>
        </TermsSection>

        <div className="mt-8 flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-xs font-semibold text-slate-400">
          <ShieldAlert className="h-4 w-4 text-cyan-400" />
          <span>Use IPGPT.net responsibly and only for lawful network analysis.</span>
        </div>
      </article>
    </main>
  );
};

interface TermsSectionProps {
  title: string;
  children: React.ReactNode;
}

const TermsSection: React.FC<TermsSectionProps> = ({ title, children }) => (
  <section className="mt-8 space-y-4 border-t border-slate-800 pt-8 text-sm sm:text-base leading-7 text-slate-300">
    <h2 className="text-xl font-black tracking-tight text-white">{title}</h2>
    {children}
  </section>
);

const BulletList: React.FC<{ items: string[] }> = ({ items }) => (
  <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
    {items.map((item) => (
      <li key={item} className="flex items-start gap-2 text-slate-300">
        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" />
        <span>{item}</span>
      </li>
    ))}
  </ul>
);
