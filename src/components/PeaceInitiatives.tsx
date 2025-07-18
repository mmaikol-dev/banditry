import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";

export function PeaceInitiatives() {
  const [activeTab, setActiveTab] = useState<"agreements" | "sessions">("agreements");
  const [selectedCounty, setSelectedCounty] = useState<string>("");
  const [showCreateAgreement, setShowCreateAgreement] = useState(false);
  const [showCreateSession, setShowCreateSession] = useState(false);

  const agreements = useQuery(api.peace.getPeaceAgreements, {
    county: selectedCounty || undefined,
  });

  const sessions = useQuery(api.peace.getMediationSessions, {
    county: selectedCounty || undefined,
  });

  const peaceStats = useQuery(api.peace.getPeaceStats, {
    county: selectedCounty || undefined,
  });

  const counties = ["Baringo", "Turkana", "West Pokot", "Samburu", "Laikipia", "Isiolo"];

  if (!agreements || !sessions || !peaceStats) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Peace Initiatives</h2>
          <p className="text-gray-600">Manage peace agreements and mediation sessions</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowCreateAgreement(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            New Agreement
          </button>
          <button
            onClick={() => setShowCreateSession(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Schedule Session
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Agreements</p>
              <p className="text-2xl font-bold text-green-600">{peaceStats.activeAgreements}</p>
            </div>
            <div className="p-3 rounded-full bg-green-50 text-green-600">
              <span className="text-xl">🕊️</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed Sessions</p>
              <p className="text-2xl font-bold text-blue-600">{peaceStats.completedSessions}</p>
            </div>
            <div className="p-3 rounded-full bg-blue-50 text-blue-600">
              <span className="text-xl">🤝</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Violations</p>
              <p className="text-2xl font-bold text-red-600">{peaceStats.totalViolations}</p>
            </div>
            <div className="p-3 rounded-full bg-red-50 text-red-600">
              <span className="text-xl">⚠️</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Scheduled Sessions</p>
              <p className="text-2xl font-bold text-yellow-600">{peaceStats.scheduledSessions}</p>
            </div>
            <div className="p-3 rounded-full bg-yellow-50 text-yellow-600">
              <span className="text-xl">📅</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              County
            </label>
            <select
              value={selectedCounty}
              onChange={(e) => setSelectedCounty(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Counties</option>
              {counties.map((county) => (
                <option key={county} value={county}>
                  {county}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab("agreements")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "agreements"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Peace Agreements ({agreements.length})
            </button>
            <button
              onClick={() => setActiveTab("sessions")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "sessions"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Mediation Sessions ({sessions.length})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === "agreements" ? (
            <AgreementsTab agreements={agreements} />
          ) : (
            <SessionsTab sessions={sessions} />
          )}
        </div>
      </div>

      {/* Modals */}
      {showCreateAgreement && (
        <CreateAgreementModal onClose={() => setShowCreateAgreement(false)} />
      )}
      {showCreateSession && (
        <CreateSessionModal onClose={() => setShowCreateSession(false)} />
      )}
    </div>
  );
}

function AgreementsTab({ agreements }: { agreements: any[] }) {
  const reportViolation = useMutation(api.peace.reportViolation);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "violated":
        return "bg-red-100 text-red-800";
      case "expired":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const handleReportViolation = async (agreementId: string) => {
    const description = prompt("Describe the violation:");
    if (!description) return;

    const severity = prompt("Severity (low/medium/high):") || "medium";
    const reportedBy = prompt("Reported by:") || "Anonymous";

    try {
      await reportViolation({
        agreementId: agreementId as any,
        description,
        severity,
        reportedBy,
      });
      toast.success("Violation reported successfully");
    } catch (error) {
      toast.error("Failed to report violation");
    }
  };

  return (
    <div className="space-y-4">
      {agreements.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-4">🕊️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Peace Agreements</h3>
          <p className="text-gray-600">Create your first peace agreement to get started.</p>
        </div>
      ) : (
        agreements.map((agreement) => (
          <div key={agreement._id} className="border border-gray-200 rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {agreement.title}
                </h3>
                <p className="text-gray-600 mb-3">{agreement.description}</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(agreement.status)}`}>
                  {agreement.status.toUpperCase()}
                </span>
                {agreement.status === "active" && (
                  <button
                    onClick={() => handleReportViolation(agreement._id)}
                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    Report Violation
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Communities Involved</h4>
                <div className="flex flex-wrap gap-1">
                  {agreement.communities.map((community: string) => (
                    <span key={community} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      {community}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Counties</h4>
                <div className="flex flex-wrap gap-1">
                  {agreement.counties.map((county: string) => (
                    <span key={county} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                      {county}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-2">Key Terms</h4>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                {agreement.keyTerms.map((term: string, index: number) => (
                  <li key={index}>{term}</li>
                ))}
              </ul>
            </div>

            <div className="flex justify-between items-center text-sm text-gray-500">
              <span>
                Agreement Date: {new Date(agreement.agreementDate).toLocaleDateString()}
              </span>
              {agreement.violations.length > 0 && (
                <span className="text-red-600">
                  {agreement.violations.length} violation(s) reported
                </span>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function SessionsTab({ sessions }: { sessions: any[] }) {
  const updateSession = useMutation(api.peace.updateMediationSession);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "ongoing":
        return "bg-blue-100 text-blue-800";
      case "scheduled":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleUpdateStatus = async (sessionId: string, newStatus: string) => {
    try {
      await updateSession({
        sessionId: sessionId as any,
        status: newStatus as any,
      });
      toast.success("Session status updated");
    } catch (error) {
      toast.error("Failed to update session status");
    }
  };

  return (
    <div className="space-y-4">
      {sessions.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-4">🤝</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Mediation Sessions</h3>
          <p className="text-gray-600">Schedule your first mediation session to get started.</p>
        </div>
      ) : (
        sessions.map((session) => (
          <div key={session._id} className="border border-gray-200 rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {session.title}
                </h3>
                <p className="text-gray-600 mb-3">{session.description}</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(session.status)}`}>
                  {session.status.toUpperCase()}
                </span>
                {session.status === "proposed" && (
                  <button
                    onClick={() => handleUpdateStatus(session._id, "scheduled")}
                    className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                  >
                    Approve
                  </button>
                )}
                {session.status === "scheduled" && (
                  <button
                    onClick={() => handleUpdateStatus(session._id, "ongoing")}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    Start Session
                  </button>
                )}
                {session.status === "ongoing" && (
                  <button
                    onClick={() => handleUpdateStatus(session._id, "completed")}
                    className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                  >
                    Complete
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Date & Location</h4>
                <p className="text-sm text-gray-600">
                  {new Date(session.scheduledDate).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-600">{session.location}, {session.county}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Communities</h4>
                <div className="flex flex-wrap gap-1">
                  {session.communities.map((community: string) => (
                    <span key={community} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      {community}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Mediators</h4>
                <div className="text-sm text-gray-600">
                  {session.mediators.join(", ")}
                </div>
              </div>
            </div>

            {session.outcomes && (
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Outcomes</h4>
                <p className="text-sm text-gray-600">{session.outcomes}</p>
              </div>
            )}

            {session.agreements.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Agreements Reached</h4>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  {session.agreements.map((agreement: string, index: number) => (
                    <li key={index}>{agreement}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

function CreateAgreementModal({ onClose }: { onClose: () => void }) {
  const createAgreement = useMutation(api.peace.createPeaceAgreement);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    communities: [] as string[],
    counties: [] as string[],
    mediators: [] as string[],
    keyTerms: [] as string[],
    agreementDate: new Date().toISOString().split('T')[0],
    expiryDate: "",
  });

  const counties = ["Baringo", "Turkana", "West Pokot", "Samburu", "Laikipia", "Isiolo"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createAgreement({
        title: formData.title,
        description: formData.description,
        communities: formData.communities,
        counties: formData.counties,
        mediators: formData.mediators,
        keyTerms: formData.keyTerms,
        agreementDate: new Date(formData.agreementDate).getTime(),
        expiryDate: formData.expiryDate ? new Date(formData.expiryDate).getTime() : undefined,
      });
      toast.success("Peace agreement created successfully");
      onClose();
    } catch (error) {
      toast.error("Failed to create peace agreement");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Create Peace Agreement</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              required
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Agreement Date *</label>
              <input
                type="date"
                value={formData.agreementDate}
                onChange={(e) => setFormData(prev => ({ ...prev, agreementDate: e.target.value }))}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
              <input
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
                min={formData.agreementDate}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Counties *</label>
            <div className="grid grid-cols-2 gap-2">
              {counties.map(county => (
                <label key={county} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.counties.includes(county)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData(prev => ({ ...prev, counties: [...prev.counties, county] }));
                      } else {
                        setFormData(prev => ({ ...prev, counties: prev.counties.filter(c => c !== county) }));
                      }
                    }}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">{county}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Create Agreement
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CreateSessionModal({ onClose }: { onClose: () => void }) {
  const proposeSession = useMutation(api.peace.proposeMediationSession);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    scheduledDate: "",
    location: "",
    county: "",
    communities: [] as string[],
    mediators: [] as string[],
    participants: [] as string[],
  });

  const counties = ["Baringo", "Turkana", "West Pokot", "Samburu", "Laikipia", "Isiolo"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await proposeSession({
        title: formData.title,
        description: formData.description,
        scheduledDate: new Date(formData.scheduledDate).getTime(),
        location: formData.location,
        county: formData.county,
        communities: formData.communities,
        mediators: formData.mediators,
        participants: formData.participants,
      });
      toast.success("Mediation session proposed successfully");
      onClose();
    } catch (error) {
      toast.error("Failed to propose mediation session");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Schedule Mediation Session</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              required
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date *</label>
              <input
                type="datetime-local"
                value={formData.scheduledDate}
                onChange={(e) => setFormData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                required
                min={new Date().toISOString().slice(0, 16)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">County *</label>
              <select
                value={formData.county}
                onChange={(e) => setFormData(prev => ({ ...prev, county: e.target.value }))}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select County</option>
                {counties.map(county => (
                  <option key={county} value={county}>{county}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Venue or meeting location"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Propose Session
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
