import EntityRepository from '../core/EntityRepository';
import Entity from '../core/Entity';
import {ShaderSemantics} from '../definitions/ShaderSemantics';
import AbstractTexture from '../textures/AbstractTexture';
import {glTF2, Gltf2Mesh, Gltf2Primitive} from '../../types/glTF';
import {Is} from '../misc/Is';
import {Index} from '../../types/CommonTypes';
const _VERSION = require('./../../../VERSION-FILE').default;

declare let window: any;
declare let URL: any;

interface Gltf2ExporterArguments {
  entities: Entity[]; // The target entities. This exporter includes their descendants for the output.
}

/**
 * The glTF2 format Exporter class.
 */
export default class Gltf2Exporter {
  private static __entityRepository = EntityRepository.getInstance();

  private constructor() {}

  /**
   * Exports scene data in the rhodonite system in glTF2 format.
   * @param filename
   * @param option a option config
   */
  static export(filename: string, option?: Gltf2ExporterArguments) {
    const entities = this.__collectEntities(option);

    const {json, fileName}: {json: any; fileName: string} =
      this.__createJsonBase(filename);

    this.__createMeshBinaryMetaData(json, entities);

    const indicesOfGltfMeshes = this.__createMeshes(json, entities);

    this.__createNodes(json, entities, indicesOfGltfMeshes);

    this.__createMaterials(json, entities);

    const arraybuffer = this.__createBinary(json);

    this.__download(json, fileName, arraybuffer);
  }

  private static __collectEntities(option: Gltf2ExporterArguments | undefined) {
    let entities = Gltf2Exporter.__entityRepository._getEntities();
    if (Is.exist(option) && option.entities.length > 0) {
      const collectChildren = (entity: Entity): Entity[] => {
        const sg = entity.getSceneGraph();
        let array = [entity];
        for (let i = 0; i < sg.children.length; i++) {
          const child = sg.children[i];
          array = array.concat(collectChildren(child.entity));
        }
        return array;
      };
      entities = option.entities.flatMap(e => collectChildren(e));
    }
    return entities;
  }

  private static __createJsonBase(filename: string) {
    const json: any = {
      asset: {
        version: '2.0',
        generator: `Rhodonite (${_VERSION.version})`,
      },
    };

    const fileName = filename ? filename : 'Rhodonite_' + new Date().getTime();

    json.buffers = [
      {
        uri: fileName + '.bin',
      },
    ];

    json.bufferViews = [];
    json.accessors = [];

    json.materials = [
      {
        pbrMetallicRoughness: {
          baseColorFactor: [1.0, 1.0, 1.0, 1.0],
        },
      },
    ];
    return {json, fileName};
  }

  /**
   * create binary
   * @param json
   * @returns A arraybuffer
   */
  private static __createBinary(json: glTF2) {
    const buffer = new ArrayBuffer(json.buffers[0].byteLength);
    const dataView = new DataView(buffer);

    for (let i = 0; i < json.accessors.length; i++) {
      const accessor = json.accessors[i];
      const rnAccessor = accessor.accessor!;
      const compositionType = rnAccessor.compositionType;
      const componentType = rnAccessor.componentType;
      const dataViewSetter = rnAccessor.getDataViewSetter(componentType)!;
      const attributeCount = accessor.count;
      const bufferView = json.bufferViews[accessor.bufferView!];
      const bufferViewByteOffset = bufferView.byteOffset!;
      for (let k = 0; k < attributeCount; k++) {
        if (compositionType.getNumberOfComponents() === 1) {
          const byteIndex = componentType.getSizeInBytes() * k;
          const value = rnAccessor.getScalar(k, {});
          (dataView as any)[dataViewSetter](
            bufferViewByteOffset + byteIndex,
            value,
            true
          );
        } else if (compositionType.getNumberOfComponents() === 2) {
          const array = rnAccessor.getVec2AsArray(k, {});
          for (let l = 0; l < 2; l++) {
            (dataView as any)[dataViewSetter](
              bufferViewByteOffset +
                componentType.getSizeInBytes() * (k * 2 + l),
              array[l],
              true
            );
          }
        } else if (compositionType.getNumberOfComponents() === 3) {
          const array = rnAccessor.getVec3AsArray(k, {});
          for (let l = 0; l < 3; l++) {
            (dataView as any)[dataViewSetter](
              bufferViewByteOffset +
                componentType.getSizeInBytes() * (k * 3 + l),
              array[l],
              true
            );
          }
        } else if (compositionType.getNumberOfComponents() === 4) {
          const array = rnAccessor.getVec4AsArray(k, {});
          for (let l = 0; l < 4; l++) {
            (dataView as any)[dataViewSetter](
              bufferViewByteOffset +
                componentType.getSizeInBytes() * (k * 4 + l),
              array[l],
              true
            );
          }
        }
      }
      accessor.accessor = void 0;
    }

    return buffer;
  }

  static __createMeshes(json: glTF2, entities: Entity[]): Index[] {
    let count = 0;
    json.meshes = [];
    const gltfMeshesIndices: Index[] = [];
    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i];
      const meshComponent = entity.getMesh();
      if (meshComponent && meshComponent.mesh) {
        json.meshes[count] = {} as unknown as Gltf2Mesh;
        const mesh = json.meshes[count];
        mesh.primitives = [];
        const primitiveCount = meshComponent.mesh.getPrimitiveNumber();
        for (let j = 0; j < primitiveCount; j++) {
          mesh.primitives[j] = {} as unknown as Gltf2Primitive;
          const primitive = mesh.primitives[j];
          const rnPrimitive = meshComponent.mesh.getPrimitiveAt(j);
          const indicesAccessor = rnPrimitive.indicesAccessor;

          if (indicesAccessor) {
            primitive.indices = (indicesAccessor as any).gltfAccessorIndex;
            primitive.mode = rnPrimitive.primitiveMode.index;
          }

          const attributeAccessors = rnPrimitive.attributeAccessors;
          primitive.attributes = {};
          const attributes = primitive.attributes;
          for (let k = 0; k < attributeAccessors.length; k++) {
            const attributeAccessor = attributeAccessors[k];
            attributes[rnPrimitive.attributeSemantics[k].str] = (
              attributeAccessor as any
            ).gltfAccessorIndex;
          }
          primitive.material = 0;
        }

        gltfMeshesIndices[i] = count++;
      } else {
        gltfMeshesIndices[i] = -1;
      }
    }

    return gltfMeshesIndices;
  }

  static __createMaterials(json: glTF2, entities: Entity[]) {
    let countMesh = 0;
    let countMaterial = 0;
    let countTexture = 0;
    let countImage = 0;
    json.materials = [];
    json.textures = [];
    json.samplers = [];
    json.images = [];
    json.samplers[0] = {
      magFilter: 9729,
      minFilter: 9987,
      wrapS: 10497,
      wrapT: 10497,
    };

    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i];
      const meshComponent = entity.getMesh();
      if (meshComponent && meshComponent.mesh) {
        const mesh = json.meshes[countMesh++];
        const primitiveCount = meshComponent.mesh.getPrimitiveNumber();
        for (let j = 0; j < primitiveCount; j++) {
          const rnPrimitive = meshComponent.mesh.getPrimitiveAt(j);
          const primitive = mesh.primitives[j];
          const rnMaterial = rnPrimitive.material!;

          const material: any = {
            pbrMetallicRoughness: {},
          };

          let colorParam;
          let metallic = 1.0;
          let roughness = 1.0;
          if (rnMaterial != null) {
            colorParam = rnMaterial.getParameter(
              ShaderSemantics.BaseColorFactor
            );
            if (colorParam == null) {
              colorParam = rnMaterial.getParameter(
                ShaderSemantics.DiffuseColorFactor
              );
            } else {
              metallic = rnMaterial.getParameter(
                ShaderSemantics.MetallicRoughnessFactor
              ).x;
              roughness = rnMaterial.getParameter(
                ShaderSemantics.MetallicRoughnessFactor
              ).y;
            }
          }

          if (colorParam) {
            material.pbrMetallicRoughness.baseColorFactor =
              Array.prototype.slice.call(colorParam._v);
          }
          material.pbrMetallicRoughness.metallicFactor = metallic;
          material.pbrMetallicRoughness.roughnessFactor = roughness;

          if (rnMaterial) {
            material.alphaMode = rnMaterial.alphaMode.str;

            const existedImages: string[] = [];

            const processTexture = (rnTexture: AbstractTexture) => {
              if (rnTexture && rnTexture.width > 1 && rnTexture.height > 1) {
                let imageIndex = countImage;
                let match = false;
                for (let k = 0; k < json.images.length; k++) {
                  const image = json.images[k];
                  if (image.uri === rnTexture.name) {
                    imageIndex = k;
                    match = true;
                  }
                }
                if (!match) {
                  const imageJson = {
                    uri: rnTexture.name,
                  };

                  if (existedImages.indexOf(rnTexture.name) !== -1) {
                    imageJson.uri += '_' + rnTexture.textureUID;
                  }

                  existedImages.push(imageJson.uri);

                  if (Is.not.exist(imageJson.uri.match(/\.(png|jpg|jpeg)/))) {
                    imageJson.uri += '.png';
                  }
                  const htmlCanvasElement = rnTexture.htmlCanvasElement;
                  if (htmlCanvasElement) {
                    htmlCanvasElement.toBlob((blob: Blob | null) => {
                      setTimeout(() => {
                        const a = document.createElement('a');
                        const e = document.createEvent(
                          'MouseEvent'
                        ) as MouseEvent;
                        e.initMouseEvent(
                          'click',
                          true,
                          true,
                          window,
                          1,
                          0,
                          0,
                          0,
                          0,
                          false,
                          false,
                          false,
                          false,
                          0,
                          null
                        );
                        a.href = URL.createObjectURL(blob!);
                        a.download = imageJson.uri;
                        a.dispatchEvent(e);
                      }, Math.random() * 10000);
                    });
                  }
                  json.images[countImage++] = imageJson;
                }

                json.textures![countTexture] = {
                  sampler: 0,
                  source: imageIndex,
                };

                return countTexture++;
              }
              return void 0;
            };

            let textureParam = rnMaterial.getParameter(
              ShaderSemantics.BaseColorTexture
            );
            let rnTexture;
            let textureIndex;
            if (textureParam != null) {
              rnTexture = textureParam[1];
              textureIndex = processTexture(rnTexture!);
              if (textureIndex != null) {
                material.pbrMetallicRoughness.baseColorTexture = {
                  index: textureIndex,
                };
              }
            } else {
              textureParam = rnMaterial.getParameter(
                ShaderSemantics.DiffuseColorTexture
              );
              if (textureParam != null) {
                const rnTexture = textureParam[1];
                const textureIndex = processTexture(rnTexture!);
                if (textureIndex != null) {
                  material.pbrMetallicRoughness.diffuseColorTexture = {
                    index: textureIndex,
                  };
                }
              }
            }

            textureParam = rnMaterial.getParameter(
              ShaderSemantics.MetallicRoughnessTexture
            ) as AbstractTexture;
            if (textureParam) {
              rnTexture = textureParam[1];
              textureIndex = processTexture(rnTexture!);
              if (textureIndex != null) {
                material.pbrMetallicRoughness.metallicRoughnessTexture = {
                  index: textureIndex,
                };
              }
            }

            textureParam = rnMaterial.getParameter(
              ShaderSemantics.NormalTexture
            ) as AbstractTexture;
            if (textureParam) {
              rnTexture = textureParam[1];
              textureIndex = processTexture(rnTexture!);
              if (textureIndex != null) {
                material.normalTexture = {index: textureIndex};
              }
            }

            textureParam = rnMaterial.getParameter(
              ShaderSemantics.OcclusionTexture
            ) as AbstractTexture;
            if (textureParam) {
              rnTexture = textureParam[1];
              textureIndex = processTexture(rnTexture!);
              if (textureIndex != null) {
                material.occlusionTexture = {index: textureIndex};
              }
            }

            textureParam = rnMaterial.getParameter(
              ShaderSemantics.EmissiveTexture
            ) as AbstractTexture;
            if (textureParam) {
              rnTexture = textureParam[1];
              textureIndex = processTexture(rnTexture!);
              if (textureIndex != null) {
                material.emissiveTexture = {index: textureIndex};
              }
            }
          }

          json.materials.push(material);
          primitive.material = countMaterial++;
        }
      }
    }
  }

  static __createNodes(
    json: glTF2,
    entities: Entity[],
    indicesOfGltfMeshes: Index[]
  ) {
    json.nodes = [];
    json.scenes = [{nodes: []}];
    const scene = json.scenes[0];
    const nodes = json.nodes;
    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i];
      (entity as any).gltfNodeIndex = i;
    }

    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i];
      nodes[i] = {};
      const node = nodes[i];

      // node.name
      node.name = entity.uniqueName;

      // node.children
      node.children = [];
      const sceneGraphComponent = entity.getSceneGraph();
      const children = sceneGraphComponent.children;
      for (let j = 0; j < children.length; j++) {
        const child = children[j];
        node.children.push((child.entity as any).gltfNodeIndex);
      }

      // matrix
      node.matrix = Array.prototype.slice.call(entity.getTransform().matrix._v);

      // mesh
      if (Is.exist(entity.getMesh())) {
        if (indicesOfGltfMeshes[i] >= 0) {
          node.mesh = indicesOfGltfMeshes[i];
        }
      }

      // If the entity has no parent, it must be a top level entity in the scene graph.
      if (Is.not.exist(sceneGraphComponent.parent)) {
        scene.nodes!.push(i);
      }
    }
  }

  static __createMeshBinaryMetaData(json: any, entities: Entity[]) {
    let count = 0;
    let bufferByteLength = 0;

    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i];
      const meshComponent = entity.getMesh();
      if (meshComponent && meshComponent.mesh) {
        const primitiveCount = meshComponent.mesh.getPrimitiveNumber();
        for (let j = 0; j < primitiveCount; j++) {
          const primitive = meshComponent.mesh.getPrimitiveAt(j);
          const indicesAccessor = primitive.indicesAccessor;

          if (indicesAccessor) {
            // BufferView
            let match = false;
            for (let k = 0; k < json.bufferViews.length; k++) {
              const bufferview = json.bufferViews[k];
              if (bufferview.rnAccessor === indicesAccessor) {
                match = true;
                (indicesAccessor as any).gltfAccessorIndex = k;
              }
            }

            if (!match) {
              json.bufferViews[count] = {};
              const bufferview = json.bufferViews[count];

              bufferview.rnAccessor = indicesAccessor;
              bufferview.buffer = 0;
              bufferview.byteLength = indicesAccessor.byteLength;
              bufferview.byteOffset = bufferByteLength;
              bufferview.target = 34963;

              // Accessor
              json.accessors[count] = {};
              const accessor = json.accessors[count];
              accessor.bufferView = count;
              accessor.byteOffset = 0; //indicesAccessor.byteOffsetInBufferView;
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
          }

          const attributeAccessors = primitive.attributeAccessors;
          for (let j = 0; j < attributeAccessors.length; j++) {
            const attributeAccessor = attributeAccessors[j];

            let match = false;
            for (let k = 0; k < json.bufferViews.length; k++) {
              const bufferview = json.bufferViews[k];
              if (bufferview.rnAccessor === attributeAccessor) {
                match = true;
                (attributeAccessor as any).gltfAccessorIndex = k;
              }
            }
            if (!match) {
              // BufferView
              json.bufferViews[count] = {};
              const bufferview = json.bufferViews[count];
              bufferview.rnAccessor = attributeAccessor;
              bufferview.buffer = 0;
              bufferview.byteLength = attributeAccessors[j].byteLength;
              bufferview.byteOffset = bufferByteLength;
              bufferview.target = 34962;

              // Accessor
              json.accessors[count] = {};
              const accessor = json.accessors[count];
              accessor.bufferView = count;
              accessor.byteOffset = 0; //attributeAccessor.byteOffsetInBufferView;
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
    }

    json.bufferViews.forEach((bufferView: any) => {
      bufferView.rnAccessor = void 0;
    });

    const buffer = json.buffers[0];
    buffer.byteLength = bufferByteLength;
  }

  static __download(json: glTF2, filename: string, arraybuffer: ArrayBuffer) {
    let a = document.createElement('a');
    let e = document.createEvent('MouseEvent');

    a.download = filename + '.gltf';
    a.href =
      'data:application/octet-stream,' +
      encodeURIComponent(JSON.stringify(json, null, 2));

    (e as any).initEvent(
      'click',
      true,
      true,
      window,
      1,
      0,
      0,
      0,
      0,
      false,
      false,
      false,
      false,
      0,
      null
    );

    a.dispatchEvent(e);

    a = document.createElement('a');
    e = document.createEvent('MouseEvent');
    (e as any).initEvent(
      'click',
      true,
      true,
      window,
      1,
      0,
      0,
      0,
      0,
      false,
      false,
      false,
      false,
      0,
      null
    );
    const blob = new Blob([arraybuffer], {type: 'octet/stream'}),
      url = window.URL.createObjectURL(blob);
    a.download = filename + '.bin';
    a.href = url;
    a.dispatchEvent(e);
  }
}
