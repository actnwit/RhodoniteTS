import type { ISceneGraphEntity } from '../helpers/EntityHelper';
import { Vector3 } from '../math/Vector3';
/**
 * VrmAimConstraint is a constraint that makes a destination entity aim toward a source entity.
 * This is commonly used in VRM avatar systems for eye tracking, head turning, or other
 * directional behaviors where one bone needs to point toward another object or entity.
 *
 * @example
 * ```typescript
 * const aimConstraint = new VrmAimConstraint(
 *   targetEntity,     // Entity to aim at
 *   'PositiveZ',      // Forward axis of the aiming entity
 *   1.0,              // Full strength
 *   eyeEntity         // Entity that will do the aiming
 * );
 *
 * // In your update loop
 * aimConstraint.update();
 * ```
 */
export declare class VrmAimConstraint {
    private __srcEntity;
    private __dstEntity;
    private __aimAxis;
    private __weight;
    /**
     * Creates a new VrmAimConstraint that makes the destination entity aim toward the source entity.
     *
     * @param srcEntity - The target entity that the destination entity should aim toward
     * @param aimAxis - The local axis of the destination entity that should point toward the target.
     *                  This defines which direction is considered "forward" for the aiming entity.
     * @param weight - The strength of the constraint (0.0 = no effect, 1.0 = full effect).
     *                 Values between 0 and 1 allow for partial aiming behavior.
     * @param dstEntity - The entity that will be rotated to aim toward the source entity
     */
    constructor(srcEntity: ISceneGraphEntity, aimAxis: 'PositiveX' | 'NegativeX' | 'PositiveY' | 'NegativeY' | 'PositiveZ' | 'NegativeZ', weight: number, dstEntity: ISceneGraphEntity);
    /**
     * Converts an aim axis string to its corresponding unit vector in local space.
     * This determines which direction is considered the "forward" direction for aiming.
     *
     * @param aimAxis - The axis direction as a string identifier
     * @returns A unit vector representing the specified axis direction
     * @throws {Error} Throws an error if an invalid axis string is provided
     *
     * @example
     * ```typescript
     * const forwardVector = constraint.getAxisVector('PositiveZ'); // Returns (0, 0, 1)
     * const rightVector = constraint.getAxisVector('PositiveX');   // Returns (1, 0, 0)
     * ```
     */
    getAxisVector(aimAxis: 'PositiveX' | 'NegativeX' | 'PositiveY' | 'NegativeY' | 'PositiveZ' | 'NegativeZ'): Vector3;
    /**
     * Updates the constraint by calculating and applying the rotation needed to make
     * the destination entity aim toward the source entity. This should be called
     * every frame or whenever the constraint needs to be evaluated.
     *
     * The method performs the following steps:
     * 1. Gets the current aim axis in world space
     * 2. Calculates the desired direction vector from destination to source
     * 3. Computes the rotation needed to align the aim axis with the target direction
     * 4. Applies the rotation with the specified weight for smooth blending
     *
     * @remarks
     * This method modifies the localRotation property of the destination entity.
     * The constraint respects the entity's rest pose and parent transformations.
     */
    update(): void;
}
