import type { ShaderSemanticsInfo } from '../../definitions/ShaderSemanticsInfo';

export type MaterialTypeName = string;
export type ShaderVariable = {
  value: any;
  info: ShaderSemanticsInfo;
};
