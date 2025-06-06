import type { LightComponent } from '../../foundation/components/Light/LightComponent';
import type { Primitive } from '../../foundation/geometry/Primitive';
import type { IMeshEntity } from '../../foundation/helpers/EntityHelper';
import type { IMatrix33 } from '../../foundation/math/IMatrix';
import type { RenderPass } from '../../foundation/renderer/RenderPass';
import type { CubeTexture } from '../../foundation/textures/CubeTexture';
import type { Matrix44, RenderTargetTextureCube } from '../../import';
import type { Index } from '../../types/CommonTypes';
import type { WebGLContextWrapper } from '../WebGLContextWrapper';

export type RenderingArgWebGL = {
  glw: WebGLContextWrapper;
  entity: IMeshEntity;
  primitive: Primitive;
  worldMatrix: Matrix44;
  normalMatrix: IMatrix33;
  isBillboard: boolean;
  lightComponents: LightComponent[];
  renderPass: RenderPass;
  diffuseCube?: CubeTexture | RenderTargetTextureCube;
  specularCube?: CubeTexture | RenderTargetTextureCube;
  sheenCube?: CubeTexture | RenderTargetTextureCube;
  isVr: boolean;
  displayIdx: Index;
  setUniform: boolean;
};

export type RenderingArgWebGpu = {
  cameraComponentSid: Index;
  entity: IMeshEntity;
  specularCube?: CubeTexture | RenderTargetTextureCube;
};
export type AttributeNames = Array<string>;
