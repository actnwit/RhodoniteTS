import { Matrix44, RenderTargetTextureCube } from '../../import';
import { LightComponent } from '../../foundation/components/Light/LightComponent';
import { Primitive } from '../../foundation/geometry/Primitive';
import { IMeshEntity } from '../../foundation/helpers/EntityHelper';
import { IMatrix33 } from '../../foundation/math/IMatrix';
import { RenderPass } from '../../foundation/renderer/RenderPass';
import { CubeTexture } from '../../foundation/textures/CubeTexture';
import { Index } from '../../types/CommonTypes';
import { WebGLContextWrapper } from '../WebGLContextWrapper';

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
