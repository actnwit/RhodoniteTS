export interface KHR_interactivity_Types {
  signature: 'bool' | 'custom' | 'float' | 'float2' | 'float3' | 'float4' | 'float2x2' | 'float3x3' | 'float4x4' | 'int'
}

export interface KHR_interactivity_Variables {

}

export interface KHR_interactivity_Events {

}

export interface KHR_interactivity_Declarations {
  op: string,
  extension?: string,
  inputValueSockets?: object,
  outputValueSockets?: object,
}

export interface KHR_interactivity_Nodes {
  declaration: number,
  configuration: object,
  values: object,
  flows: object,
}

export interface KHR_interactivity_Graph {
  types: KHR_interactivity_Types[],
  variables: KHR_interactivity_Variables[],
  events: KHR_interactivity_Events[],
  declarations: KHR_interactivity_Declarations[],
  nodes: KHR_interactivity_Nodes[],
}

export interface KHR_interactivity {
  graphs: KHR_interactivity_Graph[],
  graph: number
}
