export interface ShaderNodeJson {
  nodes: ShaderNodeJsonNode[];
  connections: ShaderNodeJsonConnection[];
}

export interface ShaderNodeJsonNode {
  id: string;
  name: string;
  inputs: Record<string, ShaderNodeJsonNodeInput>;
  outputs: Record<string, ShaderNodeJsonNodeOutput>;
  position: {
    x: number;
    y: number;
  };
  controls: Record<string, any>;
}

export interface ShaderNodeJsonNodeOutput {
  id: string;
  label: string;
  socket: {
    name: string;
  };
}

export interface ShaderNodeJsonNodeInput {
  type: string;
  value: any;
  socket: {
    name: string;
  };
}

export interface ShaderNodeJsonConnection {
  id: string;
  from: {
    id: string;
    portName: string;
  };
  to: {
    id: string;
    portName: string;
  };
}
