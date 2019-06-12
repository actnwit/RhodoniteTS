import Entity from "../core/Entity";
export default class Gltf2Exporter {
    private static __instance;
    private static __entityRepository;
    private constructor();
    static getInstance(): Gltf2Exporter;
    export(filename: string): void;
    createWriteBinary(json: any, entities: Entity[]): ArrayBuffer;
    countMeshes(json: any, entities: Entity[]): void;
    createMeshes(json: any, entities: Entity[]): void;
    createMaterials(json: any, entities: Entity[]): void;
    createNodes(json: any, entities: Entity[]): void;
    createMeshBinaryMetaData(json: any, entities: Entity[]): void;
    download(json: any, filename: string, arraybuffer: ArrayBuffer): void;
}
