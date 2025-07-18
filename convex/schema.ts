import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  // Incident reporting and tracking
  incidents: defineTable({
    reporterId: v.optional(v.id("users")), // Optional for anonymous reports
    reporterName: v.optional(v.string()),
    reporterPhone: v.optional(v.string()),
    
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
    reportedDate: v.number(),
    
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
    
    // Status and response
    status: v.union(
      v.literal("reported"),
      v.literal("verified"),
      v.literal("investigating"),
      v.literal("resolved"),
      v.literal("closed")
    ),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical")
    ),
    
    // Response tracking
    responseTime: v.optional(v.number()),
    respondingAgencies: v.array(v.string()),
    actionsTaken: v.optional(v.string()),
    
    // Verification and validation
    isVerified: v.boolean(),
    verifiedBy: v.optional(v.id("users")),
    verificationNotes: v.optional(v.string()),
    
    // Language and accessibility
    language: v.string(),
    isAnonymous: v.boolean(),
  })
    .index("by_county", ["county"])
    .index("by_status", ["status"])
    .index("by_date", ["incidentDate"])
    .index("by_priority", ["priority"])
    .index("by_location", ["county", "subcounty"])
    .searchIndex("search_incidents", {
      searchField: "description",
      filterFields: ["county", "incidentType", "status"]
    }),

  // Real-time alerts and notifications
  alerts: defineTable({
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
    
    // Targeting
    targetAudience: v.array(v.string()), // ["security_agencies", "administrators", "communities", "peace_committees"]
    counties: v.array(v.string()),
    
    // Status
    isActive: v.boolean(),
    expiresAt: v.optional(v.number()),
    
    // Response tracking
    acknowledgedBy: v.array(v.id("users")),
    actionsTaken: v.optional(v.string()),
    
    createdBy: v.id("users"),
  })
    .index("by_severity", ["severity"])
    .index("by_active", ["isActive"])
    .index("by_type", ["alertType"])
    .index("by_county", ["counties"]),

  // Peace agreements and conflict resolution
  peaceAgreements: defineTable({
    title: v.string(),
    description: v.string(),
    
    // Parties involved
    communities: v.array(v.string()),
    counties: v.array(v.string()),
    
    // Agreement details
    agreementDate: v.number(),
    mediators: v.array(v.string()),
    keyTerms: v.array(v.string()),
    
    // Status tracking
    status: v.union(
      v.literal("draft"),
      v.literal("active"),
      v.literal("violated"),
      v.literal("expired"),
      v.literal("renewed")
    ),
    
    // Monitoring
    violations: v.array(v.object({
      date: v.number(),
      description: v.string(),
      reportedBy: v.string(),
      severity: v.string(),
    })),
    
    // Renewal and updates
    expiryDate: v.optional(v.number()),
    renewalHistory: v.array(v.object({
      date: v.number(),
      changes: v.string(),
      renewedBy: v.string(),
    })),
    
    createdBy: v.id("users"),
  })
    .index("by_status", ["status"])
    .index("by_communities", ["communities"])
    .index("by_counties", ["counties"]),

  // Mediation sessions and peace initiatives
  mediationSessions: defineTable({
    title: v.string(),
    description: v.string(),
    
    // Session details
    scheduledDate: v.number(),
    location: v.string(),
    county: v.string(),
    
    // Participants
    communities: v.array(v.string()),
    mediators: v.array(v.string()),
    participants: v.array(v.string()),
    
    // Status
    status: v.union(
      v.literal("proposed"),
      v.literal("scheduled"),
      v.literal("ongoing"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    
    // Outcomes
    outcomes: v.optional(v.string()),
    agreements: v.array(v.string()),
    followUpActions: v.array(v.string()),
    
    // Proposal and approval
    proposedBy: v.id("users"),
    approvedBy: v.optional(v.id("users")),
    approvalDate: v.optional(v.number()),
  })
    .index("by_status", ["status"])
    .index("by_county", ["county"])
    .index("by_date", ["scheduledDate"]),

  // Risk assessment and predictions
  riskAssessments: defineTable({
    county: v.string(),
    subcounty: v.optional(v.string()),
    
    // Risk metrics
    riskScore: v.number(), // 0-100
    riskLevel: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical")
    ),
    
    // Contributing factors
    factors: v.array(v.object({
      factor: v.string(),
      weight: v.number(),
      description: v.string(),
    })),
    
    // Predictions
    predictedIncidents: v.number(),
    confidenceLevel: v.number(),
    timeframe: v.string(), // "next_week", "next_month", etc.
    
    // Recommendations
    recommendations: v.array(v.string()),
    preventiveMeasures: v.array(v.string()),
    
    // Metadata
    assessmentDate: v.number(),
    validUntil: v.number(),
    generatedBy: v.string(), // "ai_model", "manual", "hybrid"
  })
    .index("by_county", ["county"])
    .index("by_risk_level", ["riskLevel"])
    .index("by_date", ["assessmentDate"]),

  // User roles and permissions
  userProfiles: defineTable({
    userId: v.id("users"),
    
    // Profile information
    fullName: v.string(),
    phoneNumber: v.optional(v.string()),
    organization: v.optional(v.string()),
    position: v.optional(v.string()),
    
    // Role and permissions
    role: v.union(
      v.literal("admin"),
      v.literal("security_officer"),
      v.literal("peace_committee"),
      v.literal("community_leader"),
      v.literal("analyst"),
      v.literal("reporter")
    ),
    
    // Access permissions
    counties: v.array(v.string()), // Counties they can access
    permissions: v.array(v.string()),
    
    // Status
    isActive: v.boolean(),
    lastLogin: v.optional(v.number()),
    
    // Verification
    isVerified: v.boolean(),
    verifiedBy: v.optional(v.id("users")),
    verificationDate: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_role", ["role"])
    .index("by_counties", ["counties"]),

  // System notifications and communications
  notifications: defineTable({
    recipientId: v.id("users"),
    
    // Notification content
    title: v.string(),
    message: v.string(),
    type: v.union(
      v.literal("incident_alert"),
      v.literal("system_update"),
      v.literal("peace_initiative"),
      v.literal("risk_warning"),
      v.literal("response_required")
    ),
    
    // Status
    isRead: v.boolean(),
    readAt: v.optional(v.number()),
    
    // Related data
    relatedIncidentId: v.optional(v.id("incidents")),
    relatedAlertId: v.optional(v.id("alerts")),
    
    // Delivery
    deliveryMethod: v.array(v.string()), // ["app", "sms", "email"]
    deliveryStatus: v.object({
      app: v.optional(v.string()),
      sms: v.optional(v.string()),
      email: v.optional(v.string()),
    }),
  })
    .index("by_recipient", ["recipientId"])
    .index("by_read_status", ["isRead"])
    .index("by_type", ["type"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
