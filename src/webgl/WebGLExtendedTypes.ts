import type { ShaderSemanticsName } from '../foundation/definitions/ShaderSemantics';
import type { ShaderSemanticsInfo } from '../foundation/definitions/ShaderSemanticsInfo';
import type { Primitive } from '../foundation/geometry/Primitive';
import type { Material } from '../foundation/materials/core/Material';
import type { Engine } from '../foundation/system/Engine';

export interface RnWebGLProgram extends WebGLProgram {
  _engine: Engine;
  _gl: WebGLRenderingContext | WebGL2RenderingContext;
  _materialTypeName: string;
  _vertexShaderStr: string;
  _fragmentShaderStr: string;
  _shaderSemanticsInfoMap: Map<ShaderSemanticsName, ShaderSemanticsInfo>;
  __SPECTOR_rebuildProgram: unknown;
  _material: WeakRef<Material>;
  _primitive: WeakRef<Primitive>;
}

export interface RnWebGLTexture extends WebGLTexture {
  _resourceUid: number;
}
