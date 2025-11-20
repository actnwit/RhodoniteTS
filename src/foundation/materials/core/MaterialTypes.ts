import type { Index } from '../../../types/CommonTypes';
import type { ShaderSemanticsInfo } from '../../definitions/ShaderSemanticsInfo';

export type MaterialTypeName = string;
export type IndexInTheDataView = Index;
export type IndexOfBufferViews = Index;
export type ShaderVariable = {
  value: any;
  info: ShaderSemanticsInfo;
};
