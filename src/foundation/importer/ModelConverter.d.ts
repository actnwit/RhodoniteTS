import Entity from "../core/Entity";
import Buffer from "../memory/Buffer";
/**
 * A converter class from glTF2 model to Rhodonite Native data
 */
export default class ModelConverter {
    private static __instance;
    private constructor();
    /**
     * The static method to get singleton instance of this class.
     * @return The singleton instance of ModelConverter class
     */
    static getInstance(): ModelConverter;
    _getDefaultShader(options: ImporterOpition): null;
    private __generateGroupEntity;
    private __generateMeshEntity;
    convertToRhodoniteObject(gltfModel: glTF2): Entity;
    private createRnBuffer;
    _setupTransform(gltfModel: glTF2, groups: Entity[]): void;
    _setupHierarchy(gltfModel: glTF2, groups: Entity[], meshEntities: Entity[]): void;
    _setupMesh(gltfModel: glTF2, rnBuffer: Buffer): Entity[];
    private __getRnAccessor;
}
