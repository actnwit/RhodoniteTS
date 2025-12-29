export interface NodeJSONNodeInput {
  id: string;
  label: string;
  socket: {
    name: string;
  };
}

export interface NodeJSONNodeOutput {
  id: string;
  label: string;
  socket: {
    name: string;
  };
}

export interface NodeJSONNode {
  id: string;
  name: string;
  inputs: Record<string, NodeJSONNodeInput>;
  outputs: Record<string, NodeJSONNodeOutput>;
  position: {
    x: number;
    y: number;
  };
  controls: Record<string, any>;
}

export interface NodeJSONConnection {
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

export interface NodeJSON {
  nodes: NodeJSONNode[];
  connections: NodeJSONConnection[];
}
