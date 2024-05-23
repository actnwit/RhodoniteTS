import { CGAPIResourceHandle } from '../../../types/CommonTypes';
import { AttributeNames } from '../../../webgl/types/CommonTypes';
import { ShaderSources } from '../../../webgl/WebGLStrategy';
import { VertexAttributeEnum } from '../../definitions/VertexAttribute';
import { AbstractMaterialContent } from './AbstractMaterialContent';
import { Material } from './Material';
import { Primitive } from '../../geometry/Primitive';
export declare class ShaderHandler {
    private static __shaderHashMap;
    private static __shaderStringMap;
    /**
     * Create a shader program Or Get a shader program from cache
     * @param material
     * @param vertexShader
     * @param pixelShader
     * @param attributeNames
     * @param attributeSemantics
     * @param onError
     * @returns
     */
    static _createShaderProgramWithCache(material: Material, vertexShader: string, pixelShader: string, attributeNames: AttributeNames, attributeSemantics: VertexAttributeEnum[], onError?: (message: string) => void): CGAPIResourceHandle;
}
export declare function _createProgramAsSingleOperationByUpdatedSources(material: Material, materialNode: AbstractMaterialContent, updatedShaderSources: ShaderSources, onError?: (message: string) => void): number;
export declare function _getAttributeInfo(materialNode: AbstractMaterialContent): {
    attributeNames: string[];
    attributeSemantics: VertexAttributeEnum[];
};
export declare function _outputVertexAttributeBindingInfo(attributeNames: string[], attributeSemantics: VertexAttributeEnum[]): string;
/**
 * Create a shader program
 *
 * @remarks
 * This method creates the final shader source code
 * by embedding variables and adding definitions
 * to the prototype shader source code during processing.
 *
 * @param material - A material
 * @param vertexPropertiesStr - A string of vertex properties
 * @param pixelPropertiesStr - A string of pixel properties
 * @param vertexShaderMethodDefinitions_uniform - A string of vertex shader method definitions in Uniform Strategy
 * @param isWebGL2 - A flag whether the current WebGL context is WebGL2 or not
 * @returns
 */
export declare function _createProgramAsSingleOperationWebGL(material: Material, primitive: Primitive, vertexPropertiesStr: string, pixelPropertiesStr: string, vertexShaderMethodDefinitions_uniform: string, isWebGL2: boolean): CGAPIResourceHandle;
export declare function _setupGlobalShaderDefinitionWebGL(materialTypeName: string, primitive: Primitive): string;
export declare function _createProgramAsSingleOperationWebGpu(material: Material, primitive: Primitive, vertexShaderMethodDefinitions: string, vertexPropertiesStr: string, pixelPropertiesStr: string): number;
