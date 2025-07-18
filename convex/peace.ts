import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Create a new peace agreement
export const createPeaceAgreement = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    communities: v.array(v.string()),
    counties: v.array(v.string()),
    agreementDate: v.number(),
    mediators: v.array(v.string()),
    keyTerms: v.array(v.string()),
    expiryDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }
    
    const agreementId = await ctx.db.insert("peaceAgreements", {
      title: args.title,
      description: args.description,
      communities: args.communities,
      counties: args.counties,
      agreementDate: args.agreementDate,
      mediators: args.mediators,
      keyTerms: args.keyTerms,
      status: "active",
      violations: [],
      expiryDate: args.expiryDate,
      renewalHistory: [],
      createdBy: userId,
    });
    
    return agreementId;
  },
});

// Get peace agreements
export const getPeaceAgreements = query({
  args: {
    county: v.optional(v.string()),
    status: v.optional(v.string()),
    community: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("peaceAgreements");
    
    let agreements = await query.collect();
    
    // Apply filters
    if (args.county) {
      agreements = agreements.filter(agreement => agreement.counties.includes(args.county!));
    }
    
    if (args.status) {
      agreements = agreements.filter(agreement => agreement.status === args.status);
    }
    
    if (args.community) {
      agreements = agreements.filter(agreement => agreement.communities.includes(args.community!));
    }
    
    // Sort by agreement date (most recent first)
    agreements.sort((a, b) => b.agreementDate - a.agreementDate);
    
    return agreements;
  },
});

// Report a peace agreement violation
export const reportViolation = mutation({
  args: {
    agreementId: v.id("peaceAgreements"),
    description: v.string(),
    severity: v.string(),
    reportedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }
    
    const agreement = await ctx.db.get(args.agreementId);
    if (!agreement) {
      throw new Error("Peace agreement not found");
    }
    
    const violation = {
      date: Date.now(),
      description: args.description,
      reportedBy: args.reportedBy,
      severity: args.severity,
    };
    
    await ctx.db.patch(args.agreementId, {
      violations: [...agreement.violations, violation],
      status: "violated",
    });
    
    // Create an alert for the violation
    await ctx.db.insert("alerts", {
      alertType: "peace_violation",
      title: "Peace Agreement Violation Reported",
      message: `Violation reported for agreement: ${agreement.title}`,
      severity: args.severity === "high" ? "critical" : "warning",
      targetAudience: ["peace_committees", "administrators"],
      counties: agreement.counties,
      isActive: true,
      acknowledgedBy: [],
      createdBy: userId,
    });
    
    return { success: true };
  },
});

// Propose a mediation session
export const proposeMediationSession = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    scheduledDate: v.number(),
    location: v.string(),
    county: v.string(),
    communities: v.array(v.string()),
    mediators: v.array(v.string()),
    participants: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }
    
    const sessionId = await ctx.db.insert("mediationSessions", {
      title: args.title,
      description: args.description,
      scheduledDate: args.scheduledDate,
      location: args.location,
      county: args.county,
      communities: args.communities,
      mediators: args.mediators,
      participants: args.participants,
      status: "proposed",
      agreements: [],
      followUpActions: [],
      proposedBy: userId,
    });
    
    return sessionId;
  },
});

// Get mediation sessions
export const getMediationSessions = query({
  args: {
    county: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let sessions = await ctx.db.query("mediationSessions").collect();
    
    if (args.county) {
      sessions = sessions.filter(s => s.county === args.county);
    }
    
    if (args.status) {
      sessions = sessions.filter(session => session.status === args.status);
    }
    
    // Sort by scheduled date
    sessions.sort((a, b) => b.scheduledDate - a.scheduledDate);
    
    return sessions;
  },
});

// Update mediation session status
export const updateMediationSession = mutation({
  args: {
    sessionId: v.id("mediationSessions"),
    status: v.union(
      v.literal("proposed"),
      v.literal("scheduled"),
      v.literal("ongoing"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    outcomes: v.optional(v.string()),
    agreements: v.optional(v.array(v.string())),
    followUpActions: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }
    
    const updateData: any = {
      status: args.status,
    };
    
    if (args.outcomes) {
      updateData.outcomes = args.outcomes;
    }
    
    if (args.agreements) {
      updateData.agreements = args.agreements;
    }
    
    if (args.followUpActions) {
      updateData.followUpActions = args.followUpActions;
    }
    
    // If approving, set approval details
    if (args.status === "scheduled") {
      updateData.approvedBy = userId;
      updateData.approvalDate = Date.now();
    }
    
    await ctx.db.patch(args.sessionId, updateData);
    
    return { success: true };
  },
});

// Get peace statistics
export const getPeaceStats = query({
  args: {
    county: v.optional(v.string()),
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
      case "year":
        startDate = now - (365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = now - (365 * 24 * 60 * 60 * 1000); // Default to year for peace agreements
    }
    
    let agreements = await ctx.db.query("peaceAgreements").collect();
    let sessions = await ctx.db.query("mediationSessions").collect();
    
    // Filter by county if specified
    if (args.county) {
      agreements = agreements.filter(agreement => agreement.counties.includes(args.county!));
      sessions = sessions.filter(session => session.county === args.county);
    }
    
    // Filter by timeframe
    agreements = agreements.filter(agreement => agreement.agreementDate >= startDate);
    sessions = sessions.filter(session => session.scheduledDate >= startDate);
    
    const totalAgreements = agreements.length;
    const activeAgreements = agreements.filter(agreement => agreement.status === "active").length;
    const violatedAgreements = agreements.filter(agreement => agreement.status === "violated").length;
    
    const totalSessions = sessions.length;
    const completedSessions = sessions.filter(session => session.status === "completed").length;
    const scheduledSessions = sessions.filter(session => session.status === "scheduled").length;
    
    const totalViolations = agreements.reduce((acc, agreement) => acc + agreement.violations.length, 0);
    
    return {
      totalAgreements,
      activeAgreements,
      violatedAgreements,
      totalSessions,
      completedSessions,
      scheduledSessions,
      totalViolations,
      timeframe: args.timeframe || "year",
    };
  },
});
