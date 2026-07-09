import type { Config } from '../../core/Config';
import type { ISceneGraphEntity } from '../../helpers';
import { type IVector3 } from '../../math';
import type { PhysicsPropertyInner } from '../PhysicsProperty';
import type { PhysicsStrategy } from '../PhysicsStrategy';
import type { PhysicsWorldProperty } from '../PhysicsWorldProperty';
/**
 * Physics strategy implementation using the Oimo.js physics engine.
 * This class provides physics simulation capabilities for 3D objects in the scene.
 * It implements the PhysicsStrategy interface to integrate with the Rhodonite framework.
 */
export declare class OimoPhysicsStrategy implements PhysicsStrategy {
    /**
     * Global physics world properties shared across all instances.
     * Contains gravity settings and randomization options.
     */
    static __worldProperty: PhysicsWorldProperty;
    /**
     * The shared Oimo physics world instance.
     * All physics bodies are added to this single world for simulation.
     */
    static __world: any;
    /**
     * The Oimo physics body associated with this strategy instance.
     */
    private __body;
    /**
     * The scene graph entity that this physics strategy is attached to.
     */
    private __entity?;
    /**
     * Cached physics properties used for body recreation when needed.
     */
    private __property;
    /**
     * The original local scale of the physics shape before any transformations.
     */
    private __localScale;
    /**
     * Creates a new OimoPhysicsStrategy instance.
     * Initializes the shared Oimo physics world if it doesn't exist yet.
     */
    constructor();
    /**
     * Sets up the physics shape for the given entity with specified properties.
     * Creates a physics body in the Oimo world with the provided configuration.
     *
     * @param prop - The physics properties defining the shape, size, position, and material properties
     * @param entity - The scene graph entity to associate with this physics body
     */
    setShape(prop: PhysicsPropertyInner, entity: ISceneGraphEntity): void;
    /**
     * Updates the associated entity's transform based on the physics body's current state.
     * This method should be called each frame to synchronize the visual representation
     * with the physics simulation results.
     */
    update(_config: Config): void;
    /**
     * Sets the world position of the physics body.
     * Recreates the physics body with the new position while preserving other properties.
     *
     * @param worldPosition - The new world position to set for the physics body
     */
    setPosition(worldPosition: IVector3): void;
    /**
     * Sets the rotation of the physics body using Euler angles.
     * Recreates the physics body with the new rotation while preserving other properties.
     *
     * @param eulerAngles - The new Euler angles (in radians) to set for the physics body
     */
    setEulerAngle(eulerAngles: IVector3): void;
    /**
     * Sets the scale of the physics body.
     * Recreates the physics body with the new scale applied to the original local scale
     * while preserving other properties.
     *
     * @param scale - The scale factors to apply to the physics body's dimensions
     */
    setScale(scale: IVector3): void;
    /**
     * Advances the physics simulation by one time step.
     * This static method should be called once per frame to update all physics bodies
     * in the shared world. It processes collisions, applies forces, and updates positions.
     */
    static update(): void;
}
