/**
 * @fileoverview Common utility methods for rendering operations.
 * This module provides shared functionality used across different rendering components.
 */

import { ProcessApproach } from '../definitions/ProcessApproach';
import { Primitive } from '../geometry';
import { Mesh } from '../geometry/Mesh';
import { Material } from '../materials/core/Material';
import { Is } from '../misc/Is';
import { SystemState } from '../system/SystemState';

/**
 * Determines whether drawing should be skipped for a given material and primitive combination.
 *
 * This function checks if the material has a valid shader program for the specified primitive.
 * If no valid shader program is available (indicated by a UID of -1), drawing should be skipped
 * to avoid rendering errors.
 *
 * @param material - The material to check for shader program availability
 * @param primitive - The primitive that will be rendered with the material
 * @returns `true` if drawing should be skipped (no valid shader program), `false` otherwise
 *
 * @example
 * ```typescript
 * const shouldSkip = isSkipDrawing(myMaterial, myPrimitive);
 * if (!shouldSkip) {
 *   // Proceed with rendering
 *   renderPrimitive(myPrimitive, myMaterial);
 * }
 * ```
 */
export function isSkipDrawing(material: Material, primitive: Primitive) {
  if (material.getShaderProgramUid(primitive) === -1) {
    return true;
  } else {
    return false;
  }
}
