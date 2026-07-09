import type { ISceneGraphEntity } from '../helpers';
import { Vector3 } from '../math/Vector3';
/**
 * VrmRollConstraint is a constraint that applies roll rotation from a source entity
 * to a destination entity around a specified axis. This constraint is commonly used
 * in VRM character rigs to transfer rotational motion while maintaining specific
 * axis constraints.
 */
export declare class VrmRollConstraint {
    private __srcEntity;
    private __dstEntity;
    private __rollAxis;
    private __weight;
    /**
     * Creates a new VrmRollConstraint instance.
     *
     * @param srcEntity - The source entity whose rotation will be used as input
     * @param rollAxis - The axis around which the roll constraint operates ('X', 'Y', or 'Z')
     * @param weight - The blend weight of the constraint (0.0 = no effect, 1.0 = full effect)
     * @param dstEntity - The destination entity that will receive the constrained rotation
     */
    constructor(srcEntity: ISceneGraphEntity, rollAxis: 'X' | 'Y' | 'Z', weight: number, dstEntity: ISceneGraphEntity);
    /**
     * Gets the unit vector for the specified roll axis.
     *
     * @param rollAxis - The axis identifier ('X', 'Y', or 'Z')
     * @returns A Vector3 representing the unit vector for the specified axis
     * @throws Error if an invalid axis is provided
     */
    getAxisVector(rollAxis: 'X' | 'Y' | 'Z'): Vector3;
    /**
     * Updates the constraint by calculating and applying the roll rotation
     * from the source entity to the destination entity. This method should
     * be called each frame to maintain the constraint relationship.
     *
     * The algorithm:
     * 1. Calculates the delta rotation of the source entity from its rest pose
     * 2. Transforms this rotation into the destination entity's coordinate space
     * 3. Projects the rotation onto the specified roll axis
     * 4. Applies the weighted result to the destination entity
     */
    update(): void;
}
