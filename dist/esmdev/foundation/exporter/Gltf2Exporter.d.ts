import { Gltf2 } from '../../types/glTF2';
import { Gltf2Ex } from '../../types/glTF2ForOutput';
import { ISceneGraphEntity, IMeshEntity } from '../helpers/EntityHelper';
import { Tag } from '../core/RnObject';
export declare const GLTF2_EXPORT_GLTF = "glTF";
export declare const GLTF2_EXPORT_GLB = "glTF-Binary";
export declare const GLTF2_EXPORT_DRACO = "glTF-Draco";
export declare const GLTF2_EXPORT_EMBEDDED = "glTF-Embedded";
export declare const GLTF2_EXPORT_NO_DOWNLOAD = "No-Download";
export type Gltf2ExportType = typeof GLTF2_EXPORT_GLTF | typeof GLTF2_EXPORT_GLB | typeof GLTF2_EXPORT_DRACO | typeof GLTF2_EXPORT_EMBEDDED | typeof GLTF2_EXPORT_NO_DOWNLOAD;
export interface Gltf2ExporterArguments {
    entities?: ISceneGraphEntity[];
    type: Gltf2ExportType;
    excludeTags?: Tag[];
}
/**
 * The glTF2 format Exporter class.
 */
export declare class Gltf2Exporter {
    private constructor();
    /**
     * Exports scene data in the rhodonite system in glTF2 format.
     * @param filename the target output path
     * @param option a option config
     */
    static export(filename: string, option?: Gltf2ExporterArguments): Promise<ArrayBuffer>;
    private static __deleteEmptyArrays;
    /**
     * collect target entities. This exporter includes their descendants for the output.
     * @param option an option config
     * @returns target entities
     */
    private static __collectEntities;
    /**
     * create the base of glTF2 JSON
     * @param filename target output path
     * @returns the json and fileName in a object
     */
    private static __createJsonBase;
    /**
     * create Gltf2BufferViews and Gltf2Accessors for the output glTF2 JSON
     * @param json
     * @param entities
     */
    static __createBufferViewsAndAccessors(json: Gltf2Ex, entities: ISceneGraphEntity[]): void;
    /**
     * create Gltf2Nodes for the output glTF2 JSON
     * @param json a glTF2 JSON
     * @param entities target entities
     * @param indicesOfGltfMeshes the indices of Gltf2Meshes
     */
    static __createNodes(json: Gltf2Ex, entities: ISceneGraphEntity[], topLevelEntities: ISceneGraphEntity[]): void;
    /**
     * create Gltf2Materials and set them to Gltf2Primitives for the output glTF2 JSON
     * @param json a glTF2 JSON
     * @param entities all target entities
     */
    static __createMaterials(json: Gltf2Ex, entities: IMeshEntity[], option: Gltf2ExporterArguments): Promise<any[]>;
    /**
     * create the arraybuffer of the glTF2 .bin file and write all accessors data to the arraybuffer
     * @param json a glTF2 JSON
     * @returns A arraybuffer
     */
    private static __createBinary;
    /**
     * download the glTF2 files
     * @param json a glTF2 JSON
     * @param filename target output path
     * @param arraybuffer an ArrayBuffer of the .bin file
     */
    static __downloadGlb(json: Gltf2, filename: string, arraybuffer: ArrayBuffer): void;
    exportGlbAsArrayBuffer(): void;
    /**
     * download the glTF2 files
     * @param json a glTF2 JSON
     * @param filename target output path
     * @param arraybuffer an ArrayBuffer of the .bin file
     */
    static __downloadGltf(json: Gltf2, filename: string, arraybuffer: ArrayBuffer): void;
}
