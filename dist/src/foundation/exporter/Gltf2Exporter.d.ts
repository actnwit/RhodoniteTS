import Entity from "../core/Entity";
/**
 * The glTF2 format Exporter class.
 */
export default class Gltf2Exporter {
    private static __instance;
    private static __entityRepository;
    private constructor();
    static getInstance(): Gltf2Exporter;
    /**
     * Exports All scene data in the rhodonite system as glTF2 format.
     * @param filename
     */
    export(filename: string): void;
    createWriteBinary(json: any, entities: Entity[]): ArrayBuffer;
    countMeshes(json: any, entities: Entity[]): void;
    createMeshes(json: any, entities: Entity[]): void;
    createMaterials(json: any, entities: Entity[]): void;
    createNodes(json: any, entities: Entity[]): void;
    createMeshBinaryMetaData(json: any, entities: Entity[]): void;
    download(json: any, filename: string, arraybuffer: ArrayBuffer): void;
}
