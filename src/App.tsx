import React, { useEffect, useState } from "react";
import { Header } from "./components/Header";
import { SearchBox } from "./components/SearchBox";
import { SkeletonLoader } from "./components/SkeletonLoader";
import { ProxyVerificationCard } from "./components/Cards/ProxyVerificationCard";
import { IpResultView } from "./components/IpResultView";
import { SearchHistory } from "./components/SearchHistory";
import { Footer } from "./components/Footer";
import { ToastContainer } from "./components/Toast";
import { PrivacyPolicy } from "./components/PrivacyPolicy";
import { TermsOfService } from "./components/TermsOfService";
import { CombinedLookupResult, SearchHistoryItem, ToastMessage } from "./types";
import {
  performFullLookup,
  getSearchHistory,
  saveToHistory,
  clearSearchHistory,
  fetchMyIp,
} from "./services/api";

export default function App() {
  const isPrivacyPolicyPage = window.location.pathname === "/privacy-policy";
  const isTermsOfServicePage = window.location.pathname === "/terms-of-service";
  const isLegalPage = isPrivacyPolicyPage || isTermsOfServicePage;
  const [result, setResult] = useState<CombinedLookupResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!isLegalPage);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Load history and auto-run initial check on page load
  useEffect(() => {
    if (isLegalPage) return;

    const initialHistory = getSearchHistory();
    setHistory(initialHistory);

    // Initial check on load
    fetchMyIp()
      .then((ip) => handleLookup(ip))
      .catch(() => handleLookup("1.1.1.1"));
  }, [isLegalPage]);

  // Toast Helper
  const addToast = (type: ToastMessage["type"], text: string) => {
    const newToast: ToastMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type,
      text,
    };
    setToasts((prev) => [...prev.slice(-3), newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
    }, 3500);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Master Lookup Handler
  const handleLookup = async (inputStr: string) => {
    if (!inputStr || !inputStr.trim()) return;

    setIsLoading(true);
    try {
      const data = await performFullLookup(inputStr);
      setResult(data);

      const updatedHistory = saveToHistory(data);
      setHistory(updatedHistory);

      addToast("success", `Successfully verified ${data.outputIp}`);
    } catch (err: any) {
      addToast("error", err.message || "An error occurred while looking up IP/Proxy.");
    } finally {
      setIsLoading(false);
    }
  };

  // Copy text to clipboard helper
  const handleCopyText = (text: string, label: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
      addToast("success", `Copied ${label} to clipboard!`);
    } else {
      addToast("warning", "Clipboard copy not available in browser sandbox.");
    }
  };

  // Clear search history
  const handleClearHistory = () => {
    clearSearchHistory();
    setHistory([]);
    addToast("info", "Search history cleared.");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-black flex flex-col justify-between relative overflow-x-hidden">
      {/* Background radial ambient lights */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-cyan-600/10 via-indigo-600/5 to-transparent blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-0 right-0 w-[600px] h-[600px] bg-purple-600/5 blur-[140px] pointer-events-none z-0" />

      <div className="relative z-10">
        {/* Navigation Header */}
        <Header onCheckMyIp={handleLookup} isLoading={isLoading} />

        {isPrivacyPolicyPage ? (
          <PrivacyPolicy />
        ) : isTermsOfServicePage ? (
          <TermsOfService />
        ) : (
          /* Main Centered Container with Generous Margins (max-w-[1240px] mx-auto) */
          <main className="max-w-[1240px] mx-auto px-4 sm:px-6 pt-6 pb-12">
            {/* Top slot intentionally empty: the Social Bar tag is loaded
                globally from index.html and floats over the page. */}

            {/* Main Search Box */}
            <SearchBox
              onSearch={handleLookup}
              isLoading={isLoading}
              initialValue={result?.input || ""}
            />

            {/* Proxy Connection Verification Card */}
            {(isLoading || result) && (
              <ProxyVerificationCard
                result={result}
                isLoading={isLoading}
                onCopyText={handleCopyText}
              />
            )}

            {/* Middle ad slot removed - the Social Bar tag in index.html
                already runs site-wide and covers this page. */}

            {/* Main Content Area */}
            {isLoading ? (
              <SkeletonLoader />
            ) : result ? (
              <IpResultView result={result} onCopyText={handleCopyText} />
            ) : null}

            {/* Search History Section */}
            <SearchHistory
              history={history}
              onSelectHistoryItem={handleLookup}
              onClearHistory={handleClearHistory}
              isLoading={isLoading}
            />
          </main>
        )}
      </div>

      {/* Footer & Toast Container */}
      <Footer />
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
    </div>
  );
}
