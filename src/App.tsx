import { useState } from "react";
import { Authenticated, Unauthenticated } from "convex/react";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Dashboard } from "./components/Dashboard";
import { IncidentReporting } from "./components/IncidentReporting";
import { AlertsPanel } from "./components/AlertsPanel";
import { PeaceInitiatives } from "./components/PeaceInitiatives";
import { Toaster } from "sonner";

type TabType = "dashboard" | "incidents" | "alerts" | "peace";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const tabs = [
    { id: "dashboard" as const, label: "Dashboard", icon: "📊" },
    { id: "incidents" as const, label: "Report", icon: "🚨" },
    { id: "alerts" as const, label: "Alerts", icon: "🔔" },
    { id: "peace" as const, label: "Peace", icon: "🕊️" },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "incidents":
        return <IncidentReporting />;
      case "alerts":
        return <AlertsPanel />;
      case "peace":
        return <PeaceInitiatives />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      
      <Unauthenticated>
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Security Management System
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">
                Secure incident reporting and peace building platform
              </p>
            </div>
            <SignInForm />
          </div>
        </div>
      </Unauthenticated>

      <Authenticated>
        <div className="flex flex-col h-screen">
          {/* Mobile Header */}
          <header className="bg-white shadow-sm border-b px-4 py-3 flex items-center justify-between lg:hidden">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Toggle menu"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
              <h1 className="text-lg font-semibold text-gray-900 truncate">
                {tabs.find(tab => tab.id === activeTab)?.label}
              </h1>
            </div>
            <SignOutButton />
          </header>

          {/* Mobile Menu Overlay */}
          {isMobileMenuOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsMobileMenuOpen(false)} />
              <div className="fixed top-0 left-0 w-64 h-full bg-white shadow-lg">
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
                    <button
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                <nav className="p-4 space-y-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                        activeTab === tab.id
                          ? "bg-blue-100 text-blue-700 font-medium"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <span className="text-xl">{tab.icon}</span>
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          )}

          <div className="flex flex-1 overflow-hidden">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:bg-white lg:border-r lg:border-gray-200">
              <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
                <div className="flex items-center flex-shrink-0 px-4 mb-8">
                  <h1 className="text-xl font-bold text-gray-900">
                    Security System
                  </h1>
                </div>
                <nav className="mt-5 flex-1 px-2 space-y-1">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full text-left transition-colors ${
                        activeTab === tab.id
                          ? "bg-blue-100 text-blue-700"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      <span className="mr-3 text-lg">{tab.icon}</span>
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>
              <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
                <SignOutButton />
              </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
              <div className="p-4 sm:p-6 lg:p-8">
                {renderContent()}
              </div>
            </main>
          </div>

          {/* Bottom Navigation for Mobile */}
          <nav className="lg:hidden bg-white border-t border-gray-200 px-2 py-1">
            <div className="flex justify-around">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors min-w-0 flex-1 ${
                    activeTab === tab.id
                      ? "text-blue-600 bg-blue-50"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <span className="text-xl mb-1">{tab.icon}</span>
                  <span className="text-xs font-medium truncate">{tab.label}</span>
                </button>
              ))}
            </div>
          </nav>
        </div>
      </Authenticated>
    </div>
  );
}
