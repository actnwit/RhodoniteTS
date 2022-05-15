import { Count } from "../../types/CommonTypes";
import { ComponentTypeEnum } from "./ComponentType";
import { CompositionTypeEnum } from "./CompositionType";
import { ShaderSemanticsEnum } from "./ShaderSemantics";
import { ShaderTypeEnum } from "./ShaderType";
import { ShaderVariableUpdateIntervalEnum } from "./ShaderVariableUpdateInterval";

export type ShaderSemanticsInfo = {
  semantic: ShaderSemanticsEnum;
  prefix?: string;
  arrayLength?: Count; // the array length of the array type shader variable
  compositionType: CompositionTypeEnum;
  componentType: ComponentTypeEnum;
  min: number;
  max: number;
  valueStep?: number;
  isCustomSetting: boolean;
  initialValue?: any; // initial value
  updateInterval?: ShaderVariableUpdateIntervalEnum;
  stage: ShaderTypeEnum;
  xName?: string;
  yName?: string;
  zName?: string;
  wName?: string;
  soloDatum?: boolean; // is the shader variable's value unique (one resource) in the material
  isComponentData?: boolean;
  noControlUi?: boolean;
  needUniformInFastest?: boolean;
  none_u_prefix?: boolean;
};

