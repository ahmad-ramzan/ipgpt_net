import React from "react";
import { Lock, Mail, ShieldCheck } from "lucide-react";

const collectedInformation = [
  "IP Address",
  "ISP (Internet Service Provider)",
  "ASN Information",
  "Country, Region, City and Geolocation Data",
  "Timezone Information",
  "Connection Type Detection",
  "Residential IP",
  "Mobile IP",
  "Datacenter IP",
  "VPN Detection",
  "Proxy Detection",
  "WebRTC Information and Leak Detection Results",
  "Browser and Device Related Information required for IP analysis",
];

const informationUses = [
  "Display IP address details",
  "Detect VPN, Proxy, Residential, Mobile, and Datacenter connections",
  "Perform WebRTC leak checks",
  "Display ISP and geolocation information",
  "Improve website performance and security",
  "Prevent abuse and malicious activity",
];

const personalInformationNotRequired = [
  "Name",
  "Address",
  "Phone Number",
  "Payment Information",
  "Government ID",
];

const thirdPartyProviders = ["Cloudflare", "Google Analytics", "Google Ads"];

export const PrivacyPolicy: React.FC = () => {
  return (
    <main className="max-w-[980px] mx-auto px-4 sm:px-6 pt-10 pb-16">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-cyan-400">
            Last Updated: August 2026
          </p>
          <h1 className="mt-3 text-3xl sm:text-5xl font-black tracking-tight text-white">
            Privacy Policy
          </h1>
        </div>
        <div className="hidden sm:flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-300">
          <ShieldCheck className="h-7 w-7" />
        </div>
      </div>

      <article className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 sm:p-8 shadow-2xl shadow-black/20">
        <section className="space-y-4 text-sm sm:text-base leading-7 text-slate-300">
          <p>
            Welcome to IPGPT.net. We respect your privacy and are committed to
            protecting user information.
          </p>
        </section>

        <PolicySection title="Information We Collect">
          <p>
            When you use IPGPT.net, our system may process and display the
            following information related to your network connection:
          </p>
          <BulletList items={collectedInformation} />
          <p>
            This information is collected automatically for the sole purpose of
            providing IP lookup and network analysis services.
          </p>
        </PolicySection>

        <PolicySection title="How We Use This Information">
          <p>The collected information is used to:</p>
          <BulletList items={informationUses} />
        </PolicySection>

        <PolicySection title="No Personal Data Sales">
          <p>
            IPGPT.net does not sell, rent, trade, or share user data with
            advertisers, marketers, or third parties.
          </p>
        </PolicySection>

        <PolicySection title="No User Accounts">
          <p>
            We do not require users to create accounts or provide personal
            information such as:
          </p>
          <BulletList items={personalInformationNotRequired} />
        </PolicySection>

        <PolicySection title="Cookies">
          <p>
            We may use essential cookies and analytics tools to improve website
            functionality and performance.
          </p>
        </PolicySection>

        <PolicySection title="Third-Party Services">
          <p>We may use trusted third-party infrastructure providers such as:</p>
          <BulletList items={thirdPartyProviders} />
          <p>
            These providers may process technical information according to their
            own privacy policies.
          </p>
        </PolicySection>

        <PolicySection title="Data Security">
          <p>
            We take reasonable measures to protect collected information from
            unauthorized access and misuse.
          </p>
        </PolicySection>

        <PolicySection title="Changes to This Policy">
          <p>
            We may update this Privacy Policy at any time. Updates will be
            posted on this page.
          </p>
        </PolicySection>

        <PolicySection title="Contact">
          <a
            href="mailto:digicorehub2025@gmail.com"
            className="inline-flex items-center gap-2 font-bold text-cyan-300 transition-colors hover:text-cyan-200"
          >
            <Mail className="h-4 w-4" />
            digicorehub2025@gmail.com
          </a>
        </PolicySection>

        <div className="mt-8 flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-xs font-semibold text-slate-400">
          <Lock className="h-4 w-4 text-cyan-400" />
          <span>IPGPT.net protects network analysis data with reasonable security measures.</span>
        </div>
      </article>
    </main>
  );
};

interface PolicySectionProps {
  title: string;
  children: React.ReactNode;
}

const PolicySection: React.FC<PolicySectionProps> = ({ title, children }) => (
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
