/**
 * Material factories for optional features.
 *
 * These factories are exported from the `rhodonite/optional-materials` subpath instead of the package root:
 *
 * - Node-based materials pull in the shader graph resolver and every shader node class (all GLSL/WGSL strings).
 * - MToon pulls in the MToon material contents and shaders.
 *
 * Re-exporting them from the root would make a bundler keep this whole subtree for any application that imports
 * another material factory, even when the application never creates a node-based or VRM material.
 *
 * The default `Rn` namespace and `MaterialHelper` still include them for compatibility.
 *
 * @example
 * ```ts
 * import { createMToon1Material } from 'rhodonite/optional-materials';
 * ```
 */
export { createMToon0xMaterial } from './createMToon0xMaterial';
export { createMToon1Material } from './createMToon1Material';
export { createNodeBasedCustomMaterial } from './createNodeBasedCustomMaterial';
export {
  collectRrnJson,
  createNodeBasedRaymarchingComponentMaterial,
  createNodeBasedRaymarchingComponentShadowMaterial,
  createNodeBasedRaymarchingCustomMaterial,
  createNodeBasedRaymarchingShadowMaterial,
  createNodeBasedRaymarchingShadowMaterials,
  RAYMARCHING_COMPONENT_WORLD_MATRIX_SEMANTIC,
  type RaymarchingShadowMaterials,
} from './createNodeBasedRaymarchingMaterials';
