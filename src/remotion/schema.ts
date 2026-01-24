import { z } from 'zod';

export const MainSchema = z.object({
    title: z.string(),
    subtitle: z.string(),
    imageUrl: z.string(),
    logoUrl: z.string().optional(),
    brandColor: z.string().default('#6D08BE'),
    accentColor: z.string().default('#FFB703'),
});

export type MainSchemaType = z.infer<typeof MainSchema>;
