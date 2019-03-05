import EntityRepository from "../core/EntityRepository";
import Entity from "../core/Entity";
import MeshComponent from "../components/MeshComponent";

declare var window: any;

export default class Gltf2Exporter {
  private static __instance: Gltf2Exporter;
  private static __entityRepository = EntityRepository.getInstance();

  private constructor() {
  }

  static getInstance() {
    if (!this.__instance) {
      this.__instance = new Gltf2Exporter();
    }
    return this.__instance;
  }

  export(filename: string) {
    const entities = Gltf2Exporter.__entityRepository._getEntities();
    const json: any = {
      "asset": {
          "version": "2.0",
          "generator": `Rhodonite (${window['Rn'].VERSION})`
      }
    };

    const fileName = filename ? filename : 'Rhodonite_' + (new Date()).getTime();

    json.buffers = [{
      'url': fileName + '.bin'
    }];
    json.bufferviews = [];
    json.accessors = [];

    this.createMeshes(json, entities);

    this.createNodes(json, entities);

    this.createMeshBinary(json, entities);

    this.download(json, fileName);
  }

  createMeshes(json: any, entities: Entity[]) {
    let count = 0;
    for(let i=0; i<entities.length; i++) {
      const entity = entities[i];
      const meshComponent = entity.getComponent(MeshComponent);
      if (meshComponent) {
        (entity as any).gltfMeshIndex = count++;
      }
    }
  }

  createNodes(json: any, entities: Entity[]) {
    json.nodes = [];
    const nodes = json.nodes;
    for(let i=0; i<entities.length; i++) {
      const entity = entities[i];
      (entity as any).gltfNodeIndex = i;
    }

    for(let i=0; i<entities.length; i++) {
      const entity = entities[i];
      nodes[i] = {};
      const node = nodes[i];

      // node.name
      node.name = entity.uniqueName;

      // node.children
      node.children = [];
      const sceneGraphComponent = entity.getSceneGraph();
      const children = sceneGraphComponent.children;
      for (let j=0; j<children.length; j++) {
        const child = children[j];
        node.children.push((child.entity as any).gltfNodeIndex);
      }

      // matrix
      node.matrix = Array.prototype.slice.call(entity.getTransform().matrix.v);

      // mesh
      node.mesh = (entity as any).gltfMeshIndex;
    }
  }

  createMeshBinary(json: any, entities: Entity[]) {
    let count = 0;
    let bufferByteLength = 0;

    for(let i=0; i<entities.length; i++) {
      const entity = entities[i];
      const meshComponent = entity.getComponent(MeshComponent) as MeshComponent;
      if (meshComponent) {
        const primitiveCount = meshComponent.getPrimitiveNumber();
        for(let j=0; j<primitiveCount; j++) {
          const primitive = meshComponent.getPrimitiveAt(j);
          const indicesAccessor = primitive.indicesAccessor;

          if (indicesAccessor) {
            // BufferView
            json.bufferviews[count] = {};
            const bufferview = json.bufferviews[count];
            bufferview.buffer = 0;
            bufferview.byteLength = indicesAccessor.byteLength;
            bufferview.byteOffset = bufferByteLength;
            bufferview.target = 34963;

            // Accessor
            json.accessors[count] = {};
            const accessor = json.accessors[count];
            accessor.bufferView = count;
            accessor.byteOffset = indicesAccessor.byteOffsetInBufferView;
            accessor.componentType = 5123;
            accessor.count = indicesAccessor.elementCount;
            indicesAccessor.calcMinMax();
            accessor.max = [indicesAccessor.max];
            accessor.min = [indicesAccessor.min];
            accessor.type = 'SCALAR';
            bufferByteLength += indicesAccessor.byteLength;
            count++;
          }

          const attributeAccessors = primitive.attributeAccessors
          for(let j=0; j<attributeAccessors.length; j++) {
            // BufferView
            json.bufferviews[count] = {};
            const bufferview = json.bufferviews[count];
            bufferview.buffer = 0;
            bufferview.byteLength = attributeAccessors[j].byteLength;
            bufferview.byteOffset = bufferByteLength;
            bufferview.target = 34962;

            // Accessor
            json.accessors[count] = {};
            const accessor = json.accessors[count];
            const attributeAccessor = attributeAccessors[j];
            accessor.bufferView = count;
            accessor.byteOffset = attributeAccessor.byteOffsetInBufferView;
            accessor.componentType = 5126;
            accessor.count = attributeAccessor.elementCount;
            attributeAccessor.calcMinMax();
            accessor.max = Array.prototype.slice.call(attributeAccessor.max);
            accessor.min = Array.prototype.slice.call(attributeAccessor.min);
            accessor.type = 'VEC' + accessor.max.length;
            bufferByteLength += attributeAccessor.byteLength;
            count++;
          }
        }
      }
    }
    const buffer = json.buffers[0];
    buffer.byteLength = bufferByteLength;
  }

  download(json: any, filename: string) {
    const a = document.createElement('a');
    const e = document.createEvent('MouseEvent');

    a.download = filename;
    a.href = "data:application/octet-stream," + encodeURIComponent(JSON.stringify(json));

    (e as any).initEvent("click", true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null);

    a.dispatchEvent(e);
  }
}
