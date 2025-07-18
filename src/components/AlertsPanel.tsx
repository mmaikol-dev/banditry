import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";

export function AlertsPanel() {
  const [selectedCounty, setSelectedCounty] = useState<string>("");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("");
  const [showCreateAlert, setShowCreateAlert] = useState(false);

  const alerts = useQuery(api.alerts.getActiveAlerts, {
    county: selectedCounty || undefined,
    severity: selectedSeverity || undefined,
  });

  const acknowledgeAlert = useMutation(api.alerts.acknowledgeAlert);
  const deactivateAlert = useMutation(api.alerts.deactivateAlert);
  const createAlert = useMutation(api.alerts.createAlert);

  const counties = ["Baringo", "Turkana", "West Pokot", "Samburu", "Laikipia", "Isiolo"];

  const handleAcknowledge = async (alertId: string) => {
    try {
      await acknowledgeAlert({ alertId: alertId as any });
      toast.success("Alert acknowledged");
    } catch (error) {
      toast.error("Failed to acknowledge alert");
    }
  };

  const handleDeactivate = async (alertId: string, actionsTaken?: string) => {
    try {
      await deactivateAlert({ 
        alertId: alertId as any, 
        actionsTaken 
      });
      toast.success("Alert deactivated");
    } catch (error) {
      toast.error("Failed to deactivate alert");
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "emergency":
        return "bg-red-100 text-red-800 border-red-200";
      case "critical":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "warning":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "info":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "emergency":
        return "🚨";
      case "critical":
        return "⚠️";
      case "warning":
        return "⚡";
      case "info":
        return "ℹ️";
      default:
        return "📢";
    }
  };

  if (!alerts) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Security Alerts</h2>
          <p className="text-gray-600 text-sm sm:text-base">Monitor and respond to active security alerts</p>
        </div>
        <button
          onClick={() => setShowCreateAlert(true)}
          className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm font-medium"
        >
          Create Alert
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              County
            </label>
            <select
              value={selectedCounty}
              onChange={(e) => setSelectedCounty(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Counties</option>
              {counties.map((county) => (
                <option key={county} value={county}>
                  {county}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Severity
            </label>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Severities</option>
              <option value="emergency">Emergency</option>
              <option value="critical">Critical</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
            </select>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {alerts.length === 0 ? (
          <div className="bg-white p-6 sm:p-8 rounded-lg shadow-sm border text-center">
            <div className="text-gray-400 text-4xl mb-4">🔔</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Alerts</h3>
            <p className="text-gray-600 text-sm sm:text-base">There are currently no active security alerts.</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert._id}
              className={`bg-white rounded-lg shadow-sm border-l-4 p-4 sm:p-6 ${
                alert.severity === "emergency"
                  ? "border-l-red-500"
                  : alert.severity === "critical"
                  ? "border-l-orange-500"
                  : alert.severity === "warning"
                  ? "border-l-yellow-500"
                  : "border-l-blue-500"
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-2xl">{getSeverityIcon(alert.severity)}</span>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(
                          alert.severity
                        )}`}
                      >
                        {alert.severity.toUpperCase()}
                      </span>
                      <span className="text-sm text-gray-500 hidden sm:inline">
                        {new Date(alert._creationTime).toLocaleString()}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {alert.title}
                    </h3>
                    
                    <p className="text-gray-700 mb-3 text-sm sm:text-base">{alert.message}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      {alert.counties.map((county) => (
                        <span
                          key={county}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                        >
                          {county}
                        </span>
                      ))}
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>
                        <span className="font-medium">Target Audience:</span>{" "}
                        <span className="break-words">{alert.targetAudience.join(", ")}</span>
                      </div>
                      
                      {alert.acknowledgedBy.length > 0 && (
                        <div>
                          <span className="font-medium">Acknowledged by:</span>{" "}
                          {alert.acknowledgedBy.length} user(s)
                        </div>
                      )}
                      
                      <div className="sm:hidden text-xs text-gray-500">
                        {new Date(alert._creationTime).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t">
                  <button
                    onClick={() => handleAcknowledge(alert._id)}
                    className="flex-1 sm:flex-none px-4 py-2 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    Acknowledge
                  </button>
                  <button
                    onClick={() => {
                      const actionsTaken = prompt("Enter actions taken (optional):");
                      handleDeactivate(alert._id, actionsTaken || undefined);
                    }}
                    className="flex-1 sm:flex-none px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 font-medium"
                  >
                    Deactivate
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Alert Modal */}
      {showCreateAlert && (
        <CreateAlertModal
          onClose={() => setShowCreateAlert(false)}
          onCreate={createAlert}
        />
      )}
    </div>
  );
}

function CreateAlertModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: any;
}) {
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    severity: "warning" as const,
    alertType: "high_risk_area" as const,
    counties: [] as string[],
    targetAudience: [] as string[],
    expiresAt: "",
  });

  const counties = ["Baringo", "Turkana", "West Pokot", "Samburu", "Laikipia", "Isiolo"];
  const audiences = [
    "security_agencies",
    "administrators", 
    "communities",
    "peace_committees"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onCreate({
        title: formData.title,
        message: formData.message,
        severity: formData.severity,
        alertType: formData.alertType,
        counties: formData.counties,
        targetAudience: formData.targetAudience,
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt).getTime() : undefined,
      });
      toast.success("Alert created successfully");
      onClose();
    } catch (error) {
      toast.error("Failed to create alert");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 sm:p-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Create New Alert</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alert Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              placeholder="Enter alert title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message *
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              required
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              placeholder="Enter alert message"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Severity *
              </label>
              <select
                value={formData.severity}
                onChange={(e) => setFormData(prev => ({ ...prev, severity: e.target.value as any }))}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              >
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="critical">Critical</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alert Type *
              </label>
              <select
                value={formData.alertType}
                onChange={(e) => setFormData(prev => ({ ...prev, alertType: e.target.value as any }))}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              >
                <option value="high_risk_area">High Risk Area</option>
                <option value="pattern_detected">Pattern Detected</option>
                <option value="escalation_required">Escalation Required</option>
                <option value="peace_violation">Peace Violation</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Counties *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {counties.map(county => (
                <label key={county} className="flex items-center p-2 border rounded-md hover:bg-gray-50">
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
                    className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">{county}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Audience *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {audiences.map(audience => (
                <label key={audience} className="flex items-center p-2 border rounded-md hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={formData.targetAudience.includes(audience)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData(prev => ({ ...prev, targetAudience: [...prev.targetAudience, audience] }));
                      } else {
                        setFormData(prev => ({ ...prev, targetAudience: prev.targetAudience.filter(a => a !== audience) }));
                      }
                    }}
                    className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700 capitalize">
                    {audience.replace('_', ' ')}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expires At (Optional)
            </label>
            <input
              type="datetime-local"
              value={formData.expiresAt}
              onChange={(e) => setFormData(prev => ({ ...prev, expiresAt: e.target.value }))}
              min={new Date().toISOString().slice(0, 16)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Create Alert
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
