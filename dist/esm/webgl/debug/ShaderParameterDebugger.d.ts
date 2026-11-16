import { Component } from '../../foundation/core/Component';
import type { IEntity } from '../../foundation/core/Entity';
import type { Primitive } from '../../foundation/geometry/Primitive';
import type { Material } from '../../foundation/materials/core/Material';
import type { Engine } from '../../foundation/system/Engine';
import type { CGAPIResourceHandle } from '../../types/CommonTypes';
import type { AllParameterReport, ComponentParameterReport, EntityParameterReport, GlobalParameterReport, MaterialParameterReport, RawVec4, RealUniformInfo, ShaderParameterEntry } from './types';
/**
 * Converts math classes, typed arrays and texture tuples to plain JSON values.
 */
export declare function serializeValue(value: unknown): unknown;
/**
 * Inspector for the values Rhodonite uploads to WebGL2 or WebGPU shaders.
 *
 * It reports both the CPU-side value of a shader semantic and the location/value the
 * shader reads from the WebGL2 data texture or the WebGPU storage buffer, plus the
 * real uniform value when the WebGL2 shader uses one (for
 * `needUniformInDataTextureMode` and sampler uniforms).
 *
 * The decoder reads the CPU-side GPUInstanceData buffers, which are the same bytes
 * that are uploaded to the GPU. It does not read back GPU memory.
 */
export declare class ShaderParameterDebugger {
    static reportMaterial(engine: Engine, material: Material, primitive?: Primitive): MaterialParameterReport;
    static reportGlobals(engine: Engine, shaderProgramUid?: CGAPIResourceHandle): GlobalParameterReport;
    static reportComponent(engine: Engine, component: Component): ComponentParameterReport;
    static reportEntity(engine: Engine, entity: IEntity): EntityParameterReport;
    static reportAll(engine: Engine): AllParameterReport;
    static readRealUniforms(engine: Engine, shaderProgramUid: CGAPIResourceHandle): Map<string, RealUniformInfo> | null;
    static decode(engine: Engine, vec4Index: number): {
        vec4Index: number;
        byteOffset: number;
        row: number;
        col: number;
        vec4: RawVec4 | null;
    } | null;
    static formatEntries(entries: ShaderParameterEntry[]): Array<Record<string, unknown>>;
    static format(report: MaterialParameterReport | GlobalParameterReport | ComponentParameterReport): unknown;
    static dumpMaterial(engine: Engine, material: Material, primitive?: Primitive): MaterialParameterReport;
    static dumpPrimitive(engine: Engine, primitive: Primitive): MaterialParameterReport;
    static dumpGlobals(engine: Engine, shaderProgramUid?: CGAPIResourceHandle): GlobalParameterReport;
    static dumpEntity(engine: Engine, entity: IEntity): EntityParameterReport;
    static dumpAll(engine: Engine): AllParameterReport;
    static installConsoleHelpers(engine: Engine, target?: any): void;
    private static __getShaderProgramUid;
    private static __isProgramMaterialMismatch;
}
