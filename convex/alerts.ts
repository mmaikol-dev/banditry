import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Create a new alert
export const createAlert = mutation({
  args: {
    incidentId: v.optional(v.id("incidents")),
    alertType: v.union(
      v.literal("incident_reported"),
      v.literal("high_risk_area"),
      v.literal("pattern_detected"),
      v.literal("escalation_required"),
      v.literal("peace_violation")
    ),
    title: v.string(),
    message: v.string(),
    severity: v.union(
      v.literal("info"),
      v.literal("warning"),
      v.literal("critical"),
      v.literal("emergency")
    ),
    targetAudience: v.array(v.string()),
    counties: v.array(v.string()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }
    
    const alertId = await ctx.db.insert("alerts", {
      incidentId: args.incidentId,
      alertType: args.alertType,
      title: args.title,
      message: args.message,
      severity: args.severity,
      targetAudience: args.targetAudience,
      counties: args.counties,
      isActive: true,
      expiresAt: args.expiresAt,
      acknowledgedBy: [],
      createdBy: userId,
    });
    
    return alertId;
  },
});

// Get active alerts
export const getActiveAlerts = query({
  args: {
    county: v.optional(v.string()),
    severity: v.optional(v.string()),
    alertType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("alerts").withIndex("by_active", (q) => q.eq("isActive", true));
    
    let alerts = await query.collect();
    
    // Filter by county if specified
    if (args.county) {
      alerts = alerts.filter(alert => alert.counties.includes(args.county!));
    }
    
    // Filter by severity if specified
    if (args.severity) {
      alerts = alerts.filter(alert => alert.severity === args.severity);
    }
    
    // Filter by alert type if specified
    if (args.alertType) {
      alerts = alerts.filter(alert => alert.alertType === args.alertType);
    }
    
    // Filter out expired alerts
    const now = Date.now();
    alerts = alerts.filter(alert => !alert.expiresAt || alert.expiresAt > now);
    
    // Sort by severity and creation time
    const severityOrder = { emergency: 4, critical: 3, warning: 2, info: 1 };
    alerts.sort((a, b) => {
      const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
      if (severityDiff !== 0) return severityDiff;
      return b._creationTime - a._creationTime;
    });
    
    return alerts;
  },
});

// Acknowledge an alert
export const acknowledgeAlert = mutation({
  args: {
    alertId: v.id("alerts"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }
    
    const alert = await ctx.db.get(args.alertId);
    if (!alert) {
      throw new Error("Alert not found");
    }
    
    // Add user to acknowledged list if not already there
    if (!alert.acknowledgedBy.includes(userId)) {
      await ctx.db.patch(args.alertId, {
        acknowledgedBy: [...alert.acknowledgedBy, userId],
      });
    }
    
    return { success: true };
  },
});

// Deactivate an alert
export const deactivateAlert = mutation({
  args: {
    alertId: v.id("alerts"),
    actionsTaken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }
    
    await ctx.db.patch(args.alertId, {
      isActive: false,
      actionsTaken: args.actionsTaken,
    });
    
    return { success: true };
  },
});

// Get alert statistics
export const getAlertStats = query({
  args: {
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
        startDate = now - (30 * 24 * 60 * 60 * 1000);
    }
    
    const alerts = await ctx.db.query("alerts").collect();
    const filteredAlerts = alerts.filter(alert => alert._creationTime >= startDate);
    
    const totalAlerts = filteredAlerts.length;
    const activeAlerts = filteredAlerts.filter(alert => alert.isActive).length;
    
    const bySeverity = filteredAlerts.reduce((acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const byType = filteredAlerts.reduce((acc, alert) => {
      acc[alert.alertType] = (acc[alert.alertType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      totalAlerts,
      activeAlerts,
      bySeverity,
      byType,
      timeframe: args.timeframe || "month",
    };
  },
});
