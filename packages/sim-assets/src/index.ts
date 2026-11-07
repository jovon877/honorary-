import { z } from "zod";

export const assetBudget = {
  initialDownloadMb: 15,
  desktop: { drawCalls: 150, triangles: 500_000, textureMemoryMb: 256 },
  mobile: { drawCalls: 150, triangles: 150_000, textureMemoryMb: 128 },
} as const;

export const assetManifestSchema = z.object({
  id: z.string().min(1),
  initialDownloadMb: z.number().nonnegative(),
  desktop: z.object({
    drawCalls: z.number().int().nonnegative(),
    triangles: z.number().int().nonnegative(),
    textureMemoryMb: z.number().nonnegative(),
  }),
  mobile: z.object({
    drawCalls: z.number().int().nonnegative(),
    triangles: z.number().int().nonnegative(),
    textureMemoryMb: z.number().nonnegative(),
  }),
});

export type AssetManifest = z.infer<typeof assetManifestSchema>;

export function checkAssetBudget(manifest: AssetManifest): string[] {
  const errors: string[] = [];
  if (manifest.initialDownloadMb > assetBudget.initialDownloadMb)
    errors.push("initial download exceeds 15 MB");
  for (const target of ["desktop", "mobile"] as const) {
    for (const metric of ["drawCalls", "triangles", "textureMemoryMb"] as const) {
      if (manifest[target][metric] > assetBudget[target][metric])
        errors.push(`${target} ${metric} exceeds budget`);
    }
  }
  return errors;
}
