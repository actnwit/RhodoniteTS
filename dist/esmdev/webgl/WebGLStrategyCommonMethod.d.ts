import { Material } from '../foundation/materials/core/Material';
import { RenderPass } from '../foundation/renderer/RenderPass';
import { MeshComponent } from '../foundation/components/Mesh/MeshComponent';
import { Index } from '../types/CommonTypes';
import { Mesh } from '../foundation/geometry/Mesh';
import { Scalar } from '../foundation/math/Scalar';
import { Vector3 } from '../foundation/math/Vector3';
import { Primitive } from '../foundation/geometry/Primitive';
declare function setWebGLParameters(material: Material, gl: WebGLRenderingContext): void;
declare function startDepthMasking(primitive: Primitive, gl: WebGLRenderingContext): void;
declare function endDepthMasking(primitive: Primitive, gl: WebGLRenderingContext): void;
declare function updateVBOAndVAO(mesh: Mesh): void;
declare function isMaterialsSetup(meshComponent: MeshComponent): boolean;
declare function isSkipDrawing(material: Material): boolean;
declare function setVRViewport(renderPass: RenderPass, displayIdx: Index): void;
declare function getDisplayNumber(isVRMainPass: boolean): 1 | 2;
declare function isVrMainPass(renderPass: RenderPass): boolean;
declare function getPointSpriteShaderSemanticsInfoArray(): ({
    semantic: import("../foundation/definitions/ShaderSemantics").ShaderSemanticsEnum;
    compositionType: import("../foundation/definitions/CompositionType").CompositionTypeEnum;
    componentType: import("../foundation/definitions/ComponentType").ComponentTypeEnum;
    stage: import("..").EnumIO;
    initialValue: Scalar;
    min: number;
    max: number;
    isCustomSetting: boolean;
    updateInterval: import("..").EnumIO;
} | {
    semantic: import("../foundation/definitions/ShaderSemantics").ShaderSemanticsEnum;
    compositionType: import("../foundation/definitions/CompositionType").CompositionTypeEnum;
    componentType: import("../foundation/definitions/ComponentType").ComponentTypeEnum;
    stage: import("..").EnumIO;
    initialValue: Vector3;
    min: number;
    max: number;
    isCustomSetting: boolean;
    updateInterval: import("..").EnumIO;
})[];
declare const _default: Readonly<{
    setWebGLParameters: typeof setWebGLParameters;
    startDepthMasking: typeof startDepthMasking;
    endDepthMasking: typeof endDepthMasking;
    updateVBOAndVAO: typeof updateVBOAndVAO;
    isMaterialsSetup: typeof isMaterialsSetup;
    isSkipDrawing: typeof isSkipDrawing;
    setVRViewport: typeof setVRViewport;
    getDisplayNumber: typeof getDisplayNumber;
    isVrMainPass: typeof isVrMainPass;
    getPointSpriteShaderSemanticsInfoArray: typeof getPointSpriteShaderSemanticsInfoArray;
}>;
export default _default;