export interface KHR_interactivity_Type {
  signature:
    | 'bool'
    | 'custom'
    | 'float'
    | 'float2'
    | 'float3'
    | 'float4'
    | 'float2x2'
    | 'float3x3'
    | 'float4x4'
    | 'int';
}

export interface KHR_interactivity_Variable {}

export interface KHR_interactivity_Event {}

export interface KHR_interactivity_Declaration {
  op: string;
  extension?: string;
  inputValueSockets?: object;
  outputValueSockets?: object;
}

export interface KHR_interactivity_Flow {
  node: number;
  socket: 'in';
}
export interface KHR_interactivity_Value {
  type: number;
  value: number[];
}
export interface KHR_interactivity_Configuration {
  node: number;
  socket: 'in';
}

export type KHR_interactivity_value_type = 'animation' | 'speed' | 'startTIme' | 'endTime';

export interface KHR_interactivity_Configuration {
  nodeIndex: {
    value: number[];
  };
  stopPropagation: {
    value: boolean;
  };
}
export interface KHR_interactivity_Node {
  declaration: number;
  configuration: KHR_interactivity_Configuration;
  values: Record<KHR_interactivity_value_type, KHR_interactivity_Value>;
  flows: Record<string, KHR_interactivity_Flow>;
}

export interface KHR_interactivity_Graph {
  types: KHR_interactivity_Type[];
  variables: KHR_interactivity_Variable[];
  events: KHR_interactivity_Event[];
  declarations: KHR_interactivity_Declaration[];
  nodes: KHR_interactivity_Node[];
}

export interface KHR_interactivity {
  graphs: KHR_interactivity_Graph[];
  graph: number;
}
