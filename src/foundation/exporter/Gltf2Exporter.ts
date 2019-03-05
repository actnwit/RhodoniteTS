import EntityRepository from "../core/EntityRepository";
import Entity from "../core/Entity";

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

  export() {
    const entities = Gltf2Exporter.__entityRepository._getEntities();
    const json = {
      "asset": {
          "version": "2.0",
          "generator": `Rhodonite (${window['Rn'].VERSION})`
      }
    };

    this.createNodes(json, entities);
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
      node.matrix = entity.getTransform().matrix;
    }
  }
}
