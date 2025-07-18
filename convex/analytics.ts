import { query } from "./_generated/server";
import { v } from "convex/values";

// Get comprehensive dashboard analytics
export const getDashboardAnalytics = query({
  args: {
    county: v.optional(v.string()),
    timeframe: v.optional(v.string()), // "week", "month", "quarter", "year"
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    let startDate = 0;
    
    switch (args.timeframe) {
      case "week":
        startDate = now - (7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = now - (30 * 24 * 60 * 60 * 1000);
        break;
      case "quarter":
        startDate = now - (90 * 24 * 60 * 60 * 1000);
        break;
      case "year":
        startDate = now - (365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = now - (30 * 24 * 60 * 60 * 1000);
    }
    
    // Get incidents
    let incidents = await ctx.db.query("incidents").collect();
    if (args.county) {
      incidents = incidents.filter(incident => incident.county === args.county);
    }
    incidents = incidents.filter(incident => incident.incidentDate >= startDate);
    
    // Get alerts
    let alerts = await ctx.db.query("alerts").collect();
    if (args.county) {
      alerts = alerts.filter(alert => alert.counties.includes(args.county!));
    }
    alerts = alerts.filter(alert => alert._creationTime >= startDate);
    
    // Get peace agreements
    let peaceAgreements = await ctx.db.query("peaceAgreements").collect();
    if (args.county) {
      peaceAgreements = peaceAgreements.filter(agreement => agreement.counties.includes(args.county!));
    }
    
    // Calculate key metrics
    const totalIncidents = incidents.length;
    const criticalIncidents = incidents.filter(i => i.priority === "critical").length;
    const resolvedIncidents = incidents.filter(i => i.status === "resolved" || i.status === "closed").length;
    const activeAlerts = alerts.filter(alert => alert.isActive).length;
    const activePeaceAgreements = peaceAgreements.filter(agreement => agreement.status === "active").length;
    
    // Calculate trends (compare with previous period)
    const previousPeriodStart = startDate - (now - startDate);
    const previousIncidents = await ctx.db.query("incidents").collect();
    const previousPeriodIncidents = previousIncidents.filter(incident => 
      incident.incidentDate >= previousPeriodStart && incident.incidentDate < startDate
    );
    
    const incidentTrend = totalIncidents - previousPeriodIncidents.length;
    const trendPercentage = previousPeriodIncidents.length > 0 
      ? ((incidentTrend / previousPeriodIncidents.length) * 100).toFixed(1)
      : "0";
    
    // Incident distribution by type
    const incidentsByType = incidents.reduce((acc, incident) => {
      acc[incident.incidentType] = (acc[incident.incidentType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Incident distribution by county (if not filtered by county)
    const incidentsByCounty = args.county ? {} : incidents.reduce((acc, incident) => {
      acc[incident.county] = (acc[incident.county] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Response time analysis
    const incidentsWithResponseTime = incidents.filter(i => i.responseTime);
    const averageResponseTime = incidentsWithResponseTime.length > 0
      ? incidentsWithResponseTime.reduce((acc, i) => acc + (i.responseTime || 0), 0) / incidentsWithResponseTime.length
      : 0;
    
    // Casualty statistics
    const totalDeaths = incidents.reduce((acc, i) => acc + i.casualties.deaths, 0);
    const totalInjuries = incidents.reduce((acc, i) => acc + i.casualties.injuries, 0);
    const totalMissing = incidents.reduce((acc, i) => acc + i.casualties.missing, 0);
    
    // Livestock statistics
    const totalLivestockStolen = incidents.reduce((acc, i) => {
      return acc + i.livestockStolen.cattle + i.livestockStolen.goats + 
             i.livestockStolen.sheep + i.livestockStolen.camels + i.livestockStolen.other;
    }, 0);
    
    // Time series data for charts (last 30 days)
    const timeSeriesData = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now - (i * 24 * 60 * 60 * 1000));
      const dayStart = date.setHours(0, 0, 0, 0);
      const dayEnd = date.setHours(23, 59, 59, 999);
      
      const dayIncidents = incidents.filter(incident => 
        incident.incidentDate >= dayStart && incident.incidentDate <= dayEnd
      );
      
      timeSeriesData.push({
        date: date.toISOString().split('T')[0],
        incidents: dayIncidents.length,
        critical: dayIncidents.filter(i => i.priority === "critical").length,
        resolved: dayIncidents.filter(i => i.status === "resolved" || i.status === "closed").length,
      });
    }
    
    return {
      summary: {
        totalIncidents,
        criticalIncidents,
        resolvedIncidents,
        activeAlerts,
        activePeaceAgreements,
        incidentTrend: parseInt(trendPercentage),
        averageResponseTime: Math.round(averageResponseTime / (1000 * 60 * 60)), // Convert to hours
      },
      casualties: {
        deaths: totalDeaths,
        injuries: totalInjuries,
        missing: totalMissing,
        total: totalDeaths + totalInjuries + totalMissing,
      },
      livestock: {
        total: totalLivestockStolen,
      },
      distribution: {
        byType: incidentsByType,
        byCounty: incidentsByCounty,
      },
      timeSeriesData,
      timeframe: args.timeframe || "month",
    };
  },
});

// Get risk assessment data
export const getRiskAssessments = query({
  args: {
    county: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let assessments = await ctx.db.query("riskAssessments").collect();
    
    if (args.county) {
      assessments = assessments.filter(a => a.county === args.county);
    }
    
    // Filter for current/valid assessments
    const now = Date.now();
    const validAssessments = assessments.filter(assessment => assessment.validUntil > now);
    
    // Sort by risk score (highest first)
    validAssessments.sort((a, b) => b.riskScore - a.riskScore);
    
    return validAssessments;
  },
});

// Get hotspot analysis
export const getHotspotAnalysis = query({
  args: {
    timeframe: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    let startDate = 0;
    
    switch (args.timeframe) {
      case "week":
        startDate = now - (7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = now - (30 * 24 * 60 * 60 * 1000);
        break;
      case "quarter":
        startDate = now - (90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = now - (30 * 24 * 60 * 60 * 1000);
    }
    
    const incidents = await ctx.db.query("incidents").collect();
    const filteredIncidents = incidents.filter(incident => incident.incidentDate >= startDate);
    
    // Group by location
    const locationStats = filteredIncidents.reduce((acc, incident) => {
      const key = `${incident.county}-${incident.subcounty || 'Unknown'}-${incident.location}`;
      
      if (!acc[key]) {
        acc[key] = {
          county: incident.county,
          subcounty: incident.subcounty || 'Unknown',
          location: incident.location,
          latitude: incident.latitude,
          longitude: incident.longitude,
          incidentCount: 0,
          criticalCount: 0,
          totalCasualties: 0,
          totalLivestock: 0,
          lastIncident: 0,
        };
      }
      
      acc[key].incidentCount++;
      if (incident.priority === "critical") acc[key].criticalCount++;
      acc[key].totalCasualties += incident.casualties.deaths + incident.casualties.injuries + incident.casualties.missing;
      acc[key].totalLivestock += incident.livestockStolen.cattle + incident.livestockStolen.goats + 
                                 incident.livestockStolen.sheep + incident.livestockStolen.camels + 
                                 incident.livestockStolen.other;
      acc[key].lastIncident = Math.max(acc[key].lastIncident, incident.incidentDate);
      
      return acc;
    }, {} as Record<string, any>);
    
    // Convert to array and calculate risk scores
    const hotspots = Object.values(locationStats).map((location: any) => {
      // Simple risk scoring algorithm
      let riskScore = 0;
      riskScore += location.incidentCount * 10; // Base score for incidents
      riskScore += location.criticalCount * 25; // Higher weight for critical incidents
      riskScore += location.totalCasualties * 15; // Weight for casualties
      riskScore += Math.min(location.totalLivestock / 10, 50); // Weight for livestock (capped)
      
      // Recency factor (more recent incidents increase risk)
      const daysSinceLastIncident = (now - location.lastIncident) / (1000 * 60 * 60 * 24);
      if (daysSinceLastIncident < 7) riskScore *= 1.5;
      else if (daysSinceLastIncident < 30) riskScore *= 1.2;
      
      return {
        ...location,
        riskScore: Math.round(riskScore),
        riskLevel: riskScore > 100 ? "critical" : riskScore > 50 ? "high" : riskScore > 25 ? "medium" : "low",
      };
    });
    
    // Sort by risk score
    hotspots.sort((a, b) => b.riskScore - a.riskScore);
    
    return hotspots.slice(0, 20); // Return top 20 hotspots
  },
});
