import type { SceneGraphComponent } from '../../components';
import { RnObject } from '../../core/RnObject';
import type { ISceneGraphEntity } from '../../helpers/EntityHelper';
import { type IMatrix44, MutableVector3 } from '../../math';
import { Vector3 } from '../../math/Vector3';
/**
 * VRM Spring Bone implementation for physics-based bone animation.
 * This class handles the physics simulation of spring bones commonly used in VRM models
 * for secondary animation like hair, clothes, and accessories.
 */
export declare class VRMSpringBone extends RnObject {
    /** The stiffness force that controls how quickly the bone returns to its rest position */
    stiffnessForce: number;
    /** The power of gravity affecting the bone movement */
    gravityPower: number;
    /** The direction vector of gravity force */
    gravityDir: Vector3;
    /** The drag force that dampens the bone movement */
    dragForce: number;
    /** The radius used for collision detection */
    hitRadius: number;
    /** The scene graph entity node that this spring bone is attached to */
    node: ISceneGraphEntity;
    /** Current tail position in world space coordinates */
    currentTail: MutableVector3;
    /** Previous tail position in world space coordinates */
    prevTail: MutableVector3;
    /** The bone axis direction in local space coordinates */
    boneAxis: Vector3;
    /** The length of the bone in world space units */
    boneLength: number;
    /** The initial local position of the child bone */
    initialLocalChildPosition: Vector3;
    /** Flag indicating whether the spring bone has been initialized */
    initialized: boolean;
    /** Temporary vector for internal calculations */
    private static __tmp_vec3_0;
    /** Temporary vector for internal calculations */
    private static __tmp_vec3_1;
    /** Temporary zero vector for internal calculations */
    private static __tmp_vec3_2_zero;
    /** Temporary vector for internal calculations */
    private static __tmp_vec3_3;
    /** Temporary vector for internal calculations */
    private static __tmp_vec3_4;
    /**
     * Creates a new VRM Spring Bone instance.
     * @param node - The scene graph entity node to attach this spring bone to
     */
    constructor(node: ISceneGraphEntity);
    /**
     * Initializes the spring bone with default values and calculates initial positions.
     * This method should be called once before starting the physics simulation.
     * @param center - Optional center component for coordinate transformation
     */
    setup(center?: SceneGraphComponent): void;
    /**
     * Gets the transformation matrix from center space to world space.
     * @param center - Optional center component for coordinate transformation
     * @returns The transformation matrix from center to world space
     */
    _getMatrixCenterToWorld(center?: SceneGraphComponent): IMatrix44;
    /**
     * Gets the transformation matrix from world space to center space.
     * @param center - Optional center component for coordinate transformation
     * @returns The transformation matrix from world to center space
     */
    _getMatrixWorldToCenter(center?: SceneGraphComponent): IMatrix44;
    /**
     * Calculates the bone length in world space coordinates.
     * This method updates the boneLength property based on the current world positions
     * of the bone and its child (or estimated child position).
     */
    _calcWorldSpaceBoneLength(): void;
}
