import { CGAPIResourceHandle } from '../../../types/CommonTypes';
import { AttributeNames } from '../../../webgl/types/CommonTypes';
import { ShaderSources } from '../../../webgl/WebGLStrategy';
import { VertexAttributeEnum } from '../../definitions/VertexAttribute';
import { AbstractMaterialContent } from './AbstractMaterialContent';
import { Material } from './Material';
export declare class ShaderHandler {
    private static __shaderHashMap;
    private static __shaderStringMap;
    static _createShaderProgramWithCache(material: Material, vertexShader: string, pixelShader: string, attributeNames: AttributeNames, attributeSemantics: VertexAttributeEnum[], onError?: (message: string) => void): CGAPIResourceHandle;
}
export declare function _createProgramAsSingleOperationByUpdatedSources(material: Material, materialNode: AbstractMaterialContent, updatedShaderSources: ShaderSources, onError?: (message: string) => void): number;
export declare function _getAttributeInfo(materialNode: AbstractMaterialContent): {
    attributeNames: string[];
    attributeSemantics: VertexAttributeEnum[];
};
export declare function _outputVertexAttributeBindingInfo(attributeNames: string[], attributeSemantics: VertexAttributeEnum[]): string;
export declare function _createProgramAsSingleOperation(material: Material, vertexPropertiesStr: string, pixelPropertiesStr: string, vertexShaderMethodDefinitions_uniform: string, isWebGL2: boolean): CGAPIResourceHandle;
export declare function _setupGlobalShaderDefinition(materialTypeName: string): string;
