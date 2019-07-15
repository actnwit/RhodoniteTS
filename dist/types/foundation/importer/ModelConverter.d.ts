import Entity from "../core/Entity";
import Buffer from "../memory/Buffer";
import Material from "../materials/Material";
import { Byte, Size } from "../../types/CommonTypes";
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
    _getDefaultShader(options: GltfLoadOption): null;
    private __generateEntity;
    private __generateGroupEntity;
    private __generateMeshEntity;
    private __generateCameraEntity;
    private __generateLightEntity;
    convertToRhodoniteObject(gltfModel: glTF2): Entity;
    _setupCamera(gltfModel: glTF2): void;
    private createRnBuffer;
    _setupTransform(gltfModel: glTF2, groups: Entity[]): void;
    _setupHierarchy(gltfModel: glTF2, rnEntities: Entity[]): void;
    __setupAnimation(gltfModel: glTF2, rnEntities: Entity[]): void;
    _setupSkeleton(gltfModel: glTF2, rnEntities: Entity[]): void;
    __setupObjects(gltfModel: glTF2, rnBuffer: Buffer): Entity[];
    private __setupLight;
    private __setupCamera;
    private __setupMesh;
    private __generateAppropreateMaterial;
    private __setupMaterial;
    private _checkRnGltfLoaderOptionsExist;
    _adjustByteAlign(typedArrayClass: any, arrayBuffer: ArrayBuffer, alignSize: Size, byteOffset: Byte, length: Size): any;
    _checkBytesPerComponent(accessor: any): number;
    _checkComponentNumber(accessor: any): number;
    _checkDataViewMethod(accessor: any): string;
    static _isSystemLittleEndian(): boolean;
    _accessBinaryWithAccessor(accessor: any): any;
    private __addOffsetToIndices;
    private __getRnAccessor;
    private __createRnAccessor;
    private __getRnBufferView;
    private __getGeometryFromDracoBuffer;
    __getIndicesFromDraco(draco: any, decoder: any, dracoGeometry: any, triangleStripDrawMode: boolean): Uint32Array | undefined;
    private __decodeDraco;
    static _setupTextureTransform(textureJson: any, rnMaterial: Material, textureTransformName: string, textureRotationName: string): void;
}
