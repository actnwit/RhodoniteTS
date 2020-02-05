declare function createGroupEntity(): import("../core/Entity").default;
declare function createMeshEntity(): import("../core/Entity").default;
declare function createCameraEntity(): import("../core/Entity").default;
declare function createCameraWithControllerEntity(): import("../core/Entity").default;
declare const _default: Readonly<{
    createGroupEntity: typeof createGroupEntity;
    createMeshEntity: typeof createMeshEntity;
    createCameraEntity: typeof createCameraEntity;
    createCameraWithControllerEntity: typeof createCameraWithControllerEntity;
}>;
export default _default;
