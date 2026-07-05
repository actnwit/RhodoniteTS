/**
 * Flags for excluding whole sets of colliders from a scene query.
 */
export declare enum QueryFilterFlags {
    /**
     * Exclude from the query any collider attached to a fixed rigid-body and colliders with no rigid-body attached.
     */
    EXCLUDE_FIXED = 1,
    /**
     * Exclude from the query any collider attached to a dynamic rigid-body.
     */
    EXCLUDE_KINEMATIC = 2,
    /**
     * Exclude from the query any collider attached to a kinematic rigid-body.
     */
    EXCLUDE_DYNAMIC = 4,
    /**
     * Exclude from the query any collider that is a sensor.
     */
    EXCLUDE_SENSORS = 8,
    /**
     * Exclude from the query any collider that is not a sensor.
     */
    EXCLUDE_SOLIDS = 16,
    /**
     * Excludes all colliders not attached to a dynamic rigid-body.
     */
    ONLY_DYNAMIC = 3,
    /**
     * Excludes all colliders not attached to a kinematic rigid-body.
     */
    ONLY_KINEMATIC = 5,
    /**
     * Exclude all colliders attached to a non-fixed rigid-body
     * (this will not exclude colliders not attached to any rigid-body).
     */
    ONLY_FIXED = 6
}
