import type { ISceneGraphEntity } from '../helpers/EntityHelper';
import type { IVrmConstraint } from './IVrmConstraint';
/**
 * VrmRotationConstraint is a constraint that rotates a destination node to match
 * the rotation of a source node with a specified weight factor.
 * This constraint is commonly used in VRM character rigs for implementing
 * rotation-based animations and constraints.
 */
export declare class VrmRotationConstraint implements IVrmConstraint {
    private __srcEntity;
    private __dstEntity;
    private __weight;
    /**
     * Creates a new VrmRotationConstraint instance.
     *
     * @param srcEntity - The source entity whose rotation will be used as reference
     * @param weight - The interpolation weight factor (0.0 = no effect, 1.0 = full effect)
     * @param dstEntity - The destination entity that will be rotated to match the source
     */
    constructor(srcEntity: ISceneGraphEntity, weight: number, dstEntity: ISceneGraphEntity);
    /**
     * Updates the constraint by applying the rotation from the source entity to the destination entity.
     *
     * This method calculates the delta rotation of the source entity from its rest pose,
     * then applies that rotation to the destination entity's rest pose with the specified weight.
     * The final rotation is interpolated between the destination's rest rotation and the target rotation.
     */
    update(): void;
}
