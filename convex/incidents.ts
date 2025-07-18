import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Create a new incident report
export const reportIncident = mutation({
  args: {
    // Reporter information (optional for anonymous reports)
    reporterName: v.optional(v.string()),
    reporterPhone: v.optional(v.string()),
    isAnonymous: v.boolean(),
    
    // Location data
    county: v.string(),
    subcounty: v.optional(v.string()),
    location: v.string(),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    
    // Incident details
    incidentType: v.union(
      v.literal("cattle_rustling"),
      v.literal("armed_robbery"),
      v.literal("kidnapping"),
      v.literal("murder"),
      v.literal("assault"),
      v.literal("property_destruction"),
      v.literal("other")
    ),
    description: v.string(),
    incidentDate: v.number(),
    
    // Attackers information
    numberOfAttackers: v.optional(v.number()),
    suspectedGang: v.optional(v.string()),
    weaponsUsed: v.array(v.string()),
    
    // Impact assessment
    casualties: v.object({
      deaths: v.number(),
      injuries: v.number(),
      missing: v.number(),
    }),
    livestockStolen: v.object({
      cattle: v.number(),
      goats: v.number(),
      sheep: v.number(),
      camels: v.number(),
      other: v.number(),
    }),
    propertyDamage: v.optional(v.string()),
    
    // Language
    language: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    
    // Calculate priority based on incident severity
    let priority: "low" | "medium" | "high" | "critical" = "medium";
    
    const totalCasualties = args.casualties.deaths + args.casualties.injuries + args.casualties.missing;
    const totalLivestock = args.livestockStolen.cattle + args.livestockStolen.goats + 
                          args.livestockStolen.sheep + args.livestockStolen.camels + 
                          args.livestockStolen.other;
    
    if (args.casualties.deaths > 0 || args.incidentType === "murder" || args.incidentType === "kidnapping") {
      priority = "critical";
    } else if (totalCasualties > 5 || totalLivestock > 50 || args.incidentType === "armed_robbery") {
      priority = "high";
    } else if (totalCasualties > 0 || totalLivestock > 10) {
      priority = "medium";
    } else {
      priority = "low";
    }
    
    const incidentId = await ctx.db.insert("incidents", {
      reporterId: args.isAnonymous ? undefined : (userId || undefined),
      reporterName: args.isAnonymous ? undefined : args.reporterName,
      reporterPhone: args.isAnonymous ? undefined : args.reporterPhone,
      
      county: args.county,
      subcounty: args.subcounty,
      location: args.location,
      latitude: args.latitude,
      longitude: args.longitude,
      
      incidentType: args.incidentType,
      description: args.description,
      incidentDate: args.incidentDate,
      reportedDate: Date.now(),
      
      numberOfAttackers: args.numberOfAttackers,
      suspectedGang: args.suspectedGang,
      weaponsUsed: args.weaponsUsed,
      
      casualties: args.casualties,
      livestockStolen: args.livestockStolen,
      propertyDamage: args.propertyDamage,
      
      status: "reported",
      priority,
      
      respondingAgencies: [],
      
      isVerified: false,
      language: args.language,
      isAnonymous: args.isAnonymous,
    });
    
    // Create an alert for high priority incidents
    if (priority === "critical" || priority === "high") {
      await ctx.db.insert("alerts", {
        incidentId,
        alertType: "incident_reported",
        title: `${priority.toUpperCase()} Priority Incident Reported`,
        message: `${args.incidentType.replace('_', ' ')} reported in ${args.location}, ${args.county}`,
        severity: priority === "critical" ? "emergency" : "critical",
        targetAudience: ["security_agencies", "administrators"],
        counties: [args.county],
        isActive: true,
        acknowledgedBy: [],
        createdBy: userId || "system" as any,
      });
    }
    
    return incidentId;
  },
});

// Get incidents with filtering and pagination
export const getIncidents = query({
  args: {
    county: v.optional(v.string()),
    status: v.optional(v.string()),
    incidentType: v.optional(v.string()),
    priority: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let incidents = await ctx.db.query("incidents").collect();
    
    // Apply filters
    if (args.county) {
      incidents = incidents.filter(i => i.county === args.county);
    }
    
    // Apply additional filters
    if (args.status) {
      incidents = incidents.filter(i => i.status === args.status);
    }
    
    if (args.incidentType) {
      incidents = incidents.filter(i => i.incidentType === args.incidentType);
    }
    
    if (args.priority) {
      incidents = incidents.filter(i => i.priority === args.priority);
    }
    
    if (args.startDate) {
      incidents = incidents.filter(i => i.incidentDate >= args.startDate!);
    }
    
    if (args.endDate) {
      incidents = incidents.filter(i => i.incidentDate <= args.endDate!);
    }
    
    // Sort by date (most recent first)
    incidents.sort((a, b) => b.incidentDate - a.incidentDate);
    
    // Apply limit
    if (args.limit) {
      incidents = incidents.slice(0, args.limit);
    }
    
    return incidents;
  },
});

// Get incident statistics for dashboard
export const getIncidentStats = query({
  args: {
    county: v.optional(v.string()),
    timeframe: v.optional(v.string()), // "week", "month", "year"
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
      case "year":
        startDate = now - (365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = now - (30 * 24 * 60 * 60 * 1000); // Default to month
    }
    
    let incidents = await ctx.db.query("incidents").collect();
    
    if (args.county) {
      incidents = incidents.filter(i => i.county === args.county);
    }
    
    const filteredIncidents = incidents.filter(i => i.incidentDate >= startDate);
    
    // Calculate statistics
    const totalIncidents = filteredIncidents.length;
    const byType = filteredIncidents.reduce((acc, incident) => {
      acc[incident.incidentType] = (acc[incident.incidentType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const byStatus = filteredIncidents.reduce((acc, incident) => {
      acc[incident.status] = (acc[incident.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const byPriority = filteredIncidents.reduce((acc, incident) => {
      acc[incident.priority] = (acc[incident.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const totalCasualties = filteredIncidents.reduce((acc, incident) => {
      return acc + incident.casualties.deaths + incident.casualties.injuries + incident.casualties.missing;
    }, 0);
    
    const totalLivestock = filteredIncidents.reduce((acc, incident) => {
      return acc + incident.livestockStolen.cattle + incident.livestockStolen.goats + 
             incident.livestockStolen.sheep + incident.livestockStolen.camels + 
             incident.livestockStolen.other;
    }, 0);
    
    return {
      totalIncidents,
      byType,
      byStatus,
      byPriority,
      totalCasualties,
      totalLivestock,
      timeframe: args.timeframe || "month",
    };
  },
});

// Update incident status
export const updateIncidentStatus = mutation({
  args: {
    incidentId: v.id("incidents"),
    status: v.union(
      v.literal("reported"),
      v.literal("verified"),
      v.literal("investigating"),
      v.literal("resolved"),
      v.literal("closed")
    ),
    actionsTaken: v.optional(v.string()),
    respondingAgencies: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }
    
    const incident = await ctx.db.get(args.incidentId);
    if (!incident) {
      throw new Error("Incident not found");
    }
    
    const updateData: any = {
      status: args.status,
    };
    
    if (args.actionsTaken) {
      updateData.actionsTaken = args.actionsTaken;
    }
    
    if (args.respondingAgencies) {
      updateData.respondingAgencies = args.respondingAgencies;
    }
    
    // Calculate response time if moving to investigating status
    if (args.status === "investigating" && !incident.responseTime) {
      updateData.responseTime = Date.now() - incident.reportedDate;
    }
    
    await ctx.db.patch(args.incidentId, updateData);
    
    return { success: true };
  },
});

// Verify incident
export const verifyIncident = mutation({
  args: {
    incidentId: v.id("incidents"),
    isVerified: v.boolean(),
    verificationNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }
    
    await ctx.db.patch(args.incidentId, {
      isVerified: args.isVerified,
      verifiedBy: userId,
      verificationNotes: args.verificationNotes,
    });
    
    return { success: true };
  },
});

// Search incidents
export const searchIncidents = query({
  args: {
    searchTerm: v.string(),
    county: v.optional(v.string()),
    incidentType: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("incidents")
      .withSearchIndex("search_incidents", (q) => {
        let query = q.search("description", args.searchTerm);
        
        if (args.county) {
          query = query.eq("county", args.county);
        }
        
        if (args.incidentType) {
          query = query.eq("incidentType", args.incidentType as any);
        }
        
        if (args.status) {
          query = query.eq("status", args.status as any);
        }
        
        return query;
      })
      .take(50);
    
    return results;
  },
});
