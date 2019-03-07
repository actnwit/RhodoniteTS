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
      'uri': fileName + '.bin'
    }];
    json.bufferViews = [];
    json.accessors = [];

    json.materials = [{
      "pbrMetallicRoughness": {
        "baseColorFactor": [
          1.0,
          1.0,
          1.0,
          1.0
        ]
      }
    }]


    this.countMeshes(json, entities);


    this.createNodes(json, entities);

    this.createMeshBinaryMetaData(json, entities);

    this.createMeshes(json, entities);

    const arraybuffer = this.createWriteBinary(json, entities);

    this.download(json, fileName, arraybuffer);
  }

  createWriteBinary(json: any, entities: Entity[]) {
    const buffer = new ArrayBuffer(json.buffers[0].byteLength);
    const dataView = new DataView(buffer);

    for(let i=0; i<json.accessors.length; i++) {
      const accessor = json.accessors[i];
      const rnAccessor = accessor.accessor;
      const compositionType = rnAccessor.compositionType;
      const componentType = rnAccessor.componentType;
      const dataViewSetter = rnAccessor.getDataViewSetter(componentType)!;
      const attributeCount = accessor.count;
      const bufferview = json.bufferViews[accessor.bufferView];
      const bufferViewByteOffset = bufferview.byteOffset;
      for(let k=0; k<attributeCount; k++) {
        if (compositionType.getNumberOfComponents() === 1) {
          const byteIndex = componentType.getSizeInBytes() * k;
          const value = rnAccessor.getScalar(k, {});
          (dataView as any)[dataViewSetter](bufferViewByteOffset + byteIndex, value, true);
        } else if (compositionType.getNumberOfComponents() === 2) {
          const array = rnAccessor.getVec2AsArray(k, {});
          for(let l=0; l<2; l++) {
            (dataView as any)[dataViewSetter](bufferViewByteOffset + componentType.getSizeInBytes() * (k*2+l), array[l], true);
          }
        } else if (compositionType.getNumberOfComponents() === 3) {
          const array = rnAccessor.getVec3AsArray(k, {});
          for(let l=0; l<3; l++) {
            (dataView as any)[dataViewSetter](bufferViewByteOffset + componentType.getSizeInBytes() * (k*3+l), array[l], true);
          }
        } else if (compositionType.getNumberOfComponents() === 4) {
          const array = rnAccessor.getVec4AsArray(k, {});
          for(let l=0; l<4; l++) {
            (dataView as any)[dataViewSetter](bufferViewByteOffset + componentType.getSizeInBytes() * (k*4+l), array[l], true);
          }
        }
      }
      accessor.accessor = void 0;
    }

    return buffer;
  }

  countMeshes(json: any, entities: Entity[]) {
    let count = 0;
    json.meshes = [];
    for(let i=0; i<entities.length; i++) {
      const entity = entities[i];
      const meshComponent = entity.getComponent(MeshComponent) as MeshComponent;
      if (meshComponent) {
        (entity as any).gltfMeshIndex = count++;
      }
    }
  }

  createMeshes(json: any, entities: Entity[]) {
    let count = 0;
    json.meshes = [];
    for(let i=0; i<entities.length; i++) {
      const entity = entities[i];
      const meshComponent = entity.getComponent(MeshComponent) as MeshComponent;
      if (meshComponent) {
        json.meshes[count] = {};
        const mesh = json.meshes[count];
        mesh.primitives = [];
        const primitiveCount = meshComponent.getPrimitiveNumber();
        for(let j=0; j<primitiveCount; j++) {
          mesh.primitives[j] = {};
          const primitive = mesh.primitives[j];
          const rnPrimitive = meshComponent.getPrimitiveAt(j);
          const indicesAccessor = rnPrimitive.indicesAccessor;

          if (indicesAccessor) {
            primitive.indices = (indicesAccessor as any).gltfAccessorIndex;
            primitive.mode = rnPrimitive.primitiveMode.index;
          }

          const attributeAccessors = rnPrimitive.attributeAccessors;
          primitive.attributes = {};
          const attributes = primitive.attributes;
          for(let k=0; k<attributeAccessors.length; k++) {
            const attributeAccessor = attributeAccessors[k];
            attributes[rnPrimitive.attributeSemantics[k].str] = (attributeAccessor as any).gltfAccessorIndex;
          }
          primitive.material = 0;
        }

        (entity as any).gltfMeshIndex = count++;
      }
    }
  }

  createNodes(json: any, entities: Entity[]) {
    json.nodes = [];
    json.scenes = [{'nodes':[]}];
    const scene = json.scenes[0];
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

      if (sceneGraphComponent.parent == null) {
        scene.nodes.push(i);
      }
    }
  }

  createMeshBinaryMetaData(json: any, entities: Entity[]) {
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
            json.bufferViews[count] = {};
            const bufferview = json.bufferViews[count];
            bufferview.buffer = 0;
            bufferview.byteLength = indicesAccessor.byteLength;
            bufferview.byteOffset = bufferByteLength;
            bufferview.target = 34963;

            // Accessor
            json.accessors[count] = {};
            const accessor = json.accessors[count];
            accessor.bufferView = count;
            accessor.byteOffset = 0;//indicesAccessor.byteOffsetInBufferView;
            accessor.componentType = 5123;
            accessor.count = indicesAccessor.elementCount;
            indicesAccessor.calcMinMax();
            accessor.max = [indicesAccessor.max];
            accessor.min = [indicesAccessor.min];
            accessor.type = 'SCALAR';
            bufferByteLength += indicesAccessor.byteLength;
            (indicesAccessor as any).gltfAccessorIndex = count;
            count++;

            accessor.accessor = indicesAccessor;
          }

          const attributeAccessors = primitive.attributeAccessors;
          for(let j=0; j<attributeAccessors.length; j++) {
            // BufferView
            json.bufferViews[count] = {};
            const bufferview = json.bufferViews[count];
            bufferview.buffer = 0;
            bufferview.byteLength = attributeAccessors[j].byteLength;
            bufferview.byteOffset = bufferByteLength;
            bufferview.target = 34962;

            // Accessor
            json.accessors[count] = {};
            const accessor = json.accessors[count];
            const attributeAccessor = attributeAccessors[j];
            accessor.bufferView = count;
            accessor.byteOffset = 0;//attributeAccessor.byteOffsetInBufferView;
            accessor.componentType = 5126;
            accessor.count = attributeAccessor.elementCount;
            attributeAccessor.calcMinMax();
            accessor.max = Array.prototype.slice.call(attributeAccessor.max);
            accessor.min = Array.prototype.slice.call(attributeAccessor.min);
            accessor.type = 'VEC' + accessor.max.length;
            bufferByteLength += attributeAccessor.byteLength;
            (attributeAccessor as any).gltfAccessorIndex = count;
            count++;

            accessor.accessor = attributeAccessor;
          }
        }
      }
    }
    const buffer = json.buffers[0];
    buffer.byteLength = bufferByteLength;
  }

  download(json: any, filename: string, arraybuffer: ArrayBuffer) {
    let a = document.createElement('a');
    let e = document.createEvent('MouseEvent');

    a.download = filename + '.gltf';
    a.href = "data:application/octet-stream," + encodeURIComponent(JSON.stringify(json));

    (e as any).initEvent("click", true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null);

    a.dispatchEvent(e);


    a = document.createElement('a');
    e = document.createEvent('MouseEvent');
    (e as any).initEvent("click", true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
    var blob = new Blob([arraybuffer], {type: "octet/stream"}),
    url = window.URL.createObjectURL(blob);
    a.download = filename + '.bin';
    a.href = url;
    a.dispatchEvent(e);
  }
}
