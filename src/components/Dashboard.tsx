import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";

export function Dashboard() {
  const [selectedCounty, setSelectedCounty] = useState<string>("");
  const [timeframe, setTimeframe] = useState<string>("month");

  const analytics = useQuery(api.analytics.getDashboardAnalytics, {
    county: selectedCounty || undefined,
    timeframe,
  });

  const hotspots = useQuery(api.analytics.getHotspotAnalysis, {
    timeframe,
  });

  const counties = ["Baringo", "Turkana", "West Pokot", "Samburu", "Laikipia", "Isiolo"];

  if (!analytics || !hotspots) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const StatCard = ({ title, value, trend, icon, color = "blue" }: {
    title: string;
    value: string | number;
    trend?: number;
    icon: string;
    color?: string;
  }) => (
    <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-600 truncate">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{value}</p>
          {trend !== undefined && (
            <p className={`text-sm mt-1 ${trend >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% from last period
            </p>
          )}
        </div>
        <div className={`text-3xl sm:text-4xl`}>
          {icon}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Security Dashboard</h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Real-time security monitoring and analytics
          </p>
        </div>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={selectedCounty}
            onChange={(e) => setSelectedCounty(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">All Counties</option>
            {counties.map((county) => (
              <option key={county} value={county}>
                {county}
              </option>
            ))}
          </select>
          
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
            <option value="year">Last Year</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Total Incidents"
          value={analytics.summary.totalIncidents}
          trend={analytics.summary.incidentTrend}
          icon="🚨"
        />
        <StatCard
          title="Critical Incidents"
          value={analytics.summary.criticalIncidents}
          icon="⚠️"
          color="red"
        />
        <StatCard
          title="Active Alerts"
          value={analytics.summary.activeAlerts}
          icon="🔔"
          color="orange"
        />
        <StatCard
          title="Peace Agreements"
          value={analytics.summary.activePeaceAgreements}
          icon="🕊️"
          color="green"
        />
      </div>

      {/* Casualties and Livestock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Human Impact</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Deaths</span>
              <span className="text-xl font-bold text-red-600">{analytics.casualties.deaths}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Injuries</span>
              <span className="text-xl font-bold text-orange-600">{analytics.casualties.injuries}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Missing</span>
              <span className="text-xl font-bold text-yellow-600">{analytics.casualties.missing}</span>
            </div>
            <div className="border-t pt-2">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-900">Total Casualties</span>
                <span className="text-2xl font-bold text-gray-900">{analytics.casualties.total}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Livestock Impact</h3>
          <div className="text-center">
            <div className="text-4xl sm:text-5xl font-bold text-blue-600 mb-2">
              {analytics.livestock.total}
            </div>
            <p className="text-gray-600">Total Livestock Stolen</p>
            <div className="mt-4 text-sm text-gray-500">
              Includes cattle, goats, sheep, camels, and other livestock
            </div>
          </div>
        </div>
      </div>

      {/* Incident Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Incidents by Type</h3>
          <div className="space-y-3">
            {Object.entries(analytics.distribution.byType).map(([type, count]) => (
              <div key={type} className="flex justify-between items-center">
                <span className="text-gray-600 capitalize text-sm sm:text-base">
                  {type.replace('_', ' ')}
                </span>
                <span className="font-semibold text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {!selectedCounty && (
          <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Incidents by County</h3>
            <div className="space-y-3">
              {Object.entries(analytics.distribution.byCounty).map(([county, count]) => (
                <div key={county} className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm sm:text-base">{county}</span>
                  <span className="font-semibold text-gray-900">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Security Hotspots */}
      <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Hotspots</h3>
        <div className="overflow-x-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {hotspots.slice(0, 6).map((hotspot, index) => (
              <div
                key={`${hotspot.county}-${hotspot.location}`}
                className={`p-4 rounded-lg border-l-4 ${
                  hotspot.riskLevel === "critical"
                    ? "border-l-red-500 bg-red-50"
                    : hotspot.riskLevel === "high"
                    ? "border-l-orange-500 bg-orange-50"
                    : hotspot.riskLevel === "medium"
                    ? "border-l-yellow-500 bg-yellow-50"
                    : "border-l-green-500 bg-green-50"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">
                      {hotspot.location}
                    </h4>
                    <p className="text-sm text-gray-600">{hotspot.county}</p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      hotspot.riskLevel === "critical"
                        ? "bg-red-100 text-red-800"
                        : hotspot.riskLevel === "high"
                        ? "bg-orange-100 text-orange-800"
                        : hotspot.riskLevel === "medium"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {hotspot.riskLevel.toUpperCase()}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Incidents:</span>
                    <span className="font-medium ml-1">{hotspot.incidentCount}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Risk Score:</span>
                    <span className="font-medium ml-1">{hotspot.riskScore}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Response Time */}
      {analytics.summary.averageResponseTime > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Response Performance</h3>
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold text-blue-600 mb-2">
              {analytics.summary.averageResponseTime}h
            </div>
            <p className="text-gray-600">Average Response Time</p>
          </div>
        </div>
      )}
    </div>
  );
}
