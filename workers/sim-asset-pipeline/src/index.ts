import { Document } from "@gltf-transform/core";
import { dedup, prune, weld } from "@gltf-transform/functions";
import { MeshoptEncoder } from "meshoptimizer";

export interface PipelineResult {
  document: Document;
  meshoptReady: boolean;
}

export async function optimizeGreyboxDocument(document: Document): Promise<PipelineResult> {
  await MeshoptEncoder.ready;
  await document.transform(dedup(), weld(), prune());
  return { document, meshoptReady: true };
}
