import { z } from 'zod';

export const ModulesConfigSchema = z.object({
  menu: z.object({
    enabled: z.boolean(),
    version: z.string().optional(),
  }).optional(),
  ecommerce: z.object({
    enabled: z.boolean(),
  }).optional(),
  calendar: z.object({
    enabled: z.boolean(),
  }).optional(),
  // Agregá más módulos según necesites
}).strict();

export type ModulesConfig = z.infer<typeof ModulesConfigSchema>;
