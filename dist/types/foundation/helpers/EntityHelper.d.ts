import Entity from "../core/Entity";
declare function createGroupEntity(): Entity;
declare function createMeshEntity(): Entity;
declare function createCameraEntity(): Entity;
declare function createCameraWithControllerEntity(): Entity;
declare const _default: Readonly<{
    createGroupEntity: typeof createGroupEntity;
    createMeshEntity: typeof createMeshEntity;
    createCameraEntity: typeof createCameraEntity;
    createCameraWithControllerEntity: typeof createCameraWithControllerEntity;
}>;
export default _default;
