import { Index, IndexOf16Bytes, MaterialSID } from '../../../types/CommonTypes';
import { ShaderSemanticsInfo } from '../../definitions/ShaderSemanticsInfo';
import type { AbstractMaterialContent } from './AbstractMaterialContent';
import { Material } from './Material';
export declare class MaterialRepository {
    private static __materialMap;
    private static __instances;
    private static __materialTids;
    private static __materialInstanceCountOfType;
    private static __materialNodes;
    private static __maxInstances;
    private static __bufferViews;
    private static __accessors;
    private static __materialTidCount;
    private static __materialUidCount;
    /**
     * Registers the material type.
     * @param materialTypeName The type name of the material.
     * @param materialNodes The material nodes to register.
     * @param maxInstancesNumber The maximum number to create the material instances.
     */
    static registerMaterial(materialTypeName: string, materialNode?: AbstractMaterialContent, maxInstanceNumber?: number): boolean;
    static forceRegisterMaterial(materialTypeName: string, materialNode: AbstractMaterialContent, maxInstanceNumber?: number): boolean;
    static isRegisteredMaterialType(materialTypeName: string): boolean;
    static getMaterialByMaterialUid(materialUid: MaterialSID): Material | undefined;
    static getAllMaterials(): Material[];
    /**
     * Creates an instance of this Material class.
     * @param materialTypeName The material type to create.
     * @param materialNodes_ The material nodes to add to the created material.
     */
    static createMaterial(materialTypeName: string, materialNode_?: AbstractMaterialContent): Material;
    static isFullOrOverOfThisMaterialType(materialTypeName: string): boolean;
    /**
     * Initialize Method
     */
    private static __initialize;
    static getLocationOffsetOfMemberOfMaterial(materialTypeName: string, propertyIndex: Index): IndexOf16Bytes;
    /**
     * @internal
     */
    static _getPropertyIndex(semanticInfo: ShaderSemanticsInfo): number;
    private static __registerInner;
    private static __allocateBufferView;
    static _makeShaderInvalidateToAllMaterials(): void;
}
