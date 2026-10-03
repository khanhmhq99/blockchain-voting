import { z } from "zod";
export const registerVoterSchema = z.object({ electionId: z.uuid(), walletAddress: z.string().regex(/^0x[0-9a-fA-F]{40}$/, "Enter a valid EVM wallet address") });
export const reviewSchema = z.object({ electionId: z.uuid(), registrationId: z.uuid() });
