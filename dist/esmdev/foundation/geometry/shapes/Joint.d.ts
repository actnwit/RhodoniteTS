import type { IVector3 } from '../../math/IVector';
import type { IAnyPrimitiveDescriptor } from '../Primitive';
import { IShape } from './IShape';
export type JointDescriptor = IAnyPrimitiveDescriptor;
/**
 * The Joint class represents a 3D joint visualization that creates an arrow-like shape
 * connecting two world positions, typically used for displaying skeletal connections
 * or hierarchical relationships in 3D space.
 */
export declare class Joint extends IShape {
    /** The world position of this joint (the starting point of the arrow) */
    private __worldPositionOfThisJoint;
    /** The world position of the parent joint (the ending point of the arrow) */
    private __worldPositionOfParentJoint;
    /** The width of the arrow shape */
    private __width;
    private static readonly __lineSegmentCount;
    private static readonly __componentsPerVertex;
    private __positionsBuffer;
    private __positionAccessor?;
    /**
     * Generates a 3D joint visualization as an arrow-like shape connecting two points.
     * The joint is rendered as a combination of pyramidal shapes and connecting lines,
     * creating a visual representation of the connection between this joint and its parent.
     *
     * @param desc - The primitive descriptor containing material and other rendering properties
     *
     * @remarks
     * The generated shape consists of:
     * - A long pyramid extending from this joint towards the parent
     * - A connecting plane section
     * - A short pyramid at the parent joint position
     * All rendered as line segments for wireframe visualization
     */
    generate(desc: JointDescriptor): void;
    /**
     * Updates the joint geometry to connect the specified world positions.
     * @param worldPositionOfThisJoint - world-space position of this joint
     * @param worldPositionOfParentJoint - world-space position of the parent joint
     * @param width - optional width override for the joint visualization
     */
    setWorldPositions(worldPositionOfThisJoint: IVector3, worldPositionOfParentJoint: IVector3, width?: number): void;
    private __applyPositionsToAccessor;
    private __updatePositionsBuffer;
}
