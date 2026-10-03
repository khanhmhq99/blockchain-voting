import { z } from "zod";

export const electionSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(4000),
  startTime: z.string().min(1).transform((value, ctx) => { const date = new Date(value); if (Number.isNaN(date.valueOf())) { ctx.addIssue({ code: "custom", message: "Invalid start time" }); return z.NEVER; } return date; }),
  endTime: z.string().min(1).transform((value, ctx) => { const date = new Date(value); if (Number.isNaN(date.valueOf())) { ctx.addIssue({ code: "custom", message: "Invalid end time" }); return z.NEVER; } return date; }),
}).refine((data) => data.startTime < data.endTime, { message: "Start must be before end", path: ["endTime"] });

export const candidateSchema = z.object({ electionId: z.uuid(), name: z.string().trim().min(1).max(120), description: z.string().trim().max(2000) });
