import {Entity, Matrix44} from '../..';
import LightComponent from '../../foundation/components/Light/LightComponent';
import {Primitive} from '../../foundation/geometry/Primitive';
import {Cube} from '../../foundation/geometry/shapes/Cube';
import { IMeshEntity } from '../../foundation/helpers/EntityHelper';
import { IMatrix33 } from '../../foundation/math/IMatrix';
import MutableMatrix33 from '../../foundation/math/MutableMatrix33';
import RenderPass from '../../foundation/renderer/RenderPass';
import CubeTexture from '../../foundation/textures/CubeTexture';
import {Index} from '../../types/CommonTypes';
import WebGLContextWrapper from '../WebGLContextWrapper';

export type RenderingArg = {
  glw: WebGLContextWrapper;
  entity: IMeshEntity;
  primitive: Primitive;
  worldMatrix: Matrix44;
  normalMatrix: IMatrix33;
  lightComponents: LightComponent[];
  renderPass: RenderPass;
  diffuseCube?: CubeTexture;
  specularCube?: CubeTexture;
  isVr: boolean;
  displayIdx: Index;
  setUniform: boolean;
};
