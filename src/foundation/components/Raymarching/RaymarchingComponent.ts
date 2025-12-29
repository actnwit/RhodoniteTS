import type { ComponentSID, ComponentTID, Count, EntityUID, Index, PrimitiveUID } from '../../../types/CommonTypes';
import type { NodeJSON } from '../../../types/NodeJSON';
import { Component } from '../../core/Component';
import type { IEntity } from '../../core/Entity';
import { type EntityRepository, applyMixins } from '../../core/EntityRepository';
import type { ProcessApproachEnum } from '../../definitions/ProcessApproach';
import { ProcessStage, type ProcessStageEnum } from '../../definitions/ProcessStage';
import { SdfShapeType, type SdfShapeTypeEnum } from '../../definitions/SdfShapeType';
import type { ISceneGraphEntity } from '../../helpers/EntityHelper';
import type { RenderPass } from '../../renderer/RenderPass';
import type { Engine } from '../../system/Engine';
import type { ComponentToComponentMethods } from '../ComponentTypes';
import { WellKnownComponentTIDs } from '../WellKnownComponentTIDs';

/**
 * RaymarchingComponent is a component that manages raymarching for an entity.
 * This component handles the raymarching of the entity.
 */
export class RaymarchingComponent extends Component {
  private __rrnJson: NodeJSON = {
    nodes: [],
    connections: [],
  };

  private __sdfShapeType: SdfShapeTypeEnum = SdfShapeType.Custom;

  constructor(
    engine: Engine,
    entityUid: EntityUID,
    componentSid: ComponentSID,
    entityComponent: EntityRepository,
    isReUse: boolean
  ) {
    super(engine, entityUid, componentSid, entityComponent, isReUse);
    this.moveStageTo(ProcessStage.Logic);
  }

  /**
   * Gets the component type identifier for RaymarchingComponent.
   * @returns The component type ID for RaymarchingComponent
   */
  static get componentTID() {
    return WellKnownComponentTIDs.RaymarchingComponentTID;
  }

  /**
   * Gets the component type identifier for this RaymarchingComponent instance.
   * @returns The component type ID for RaymarchingComponent
   */
  get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.RaymarchingComponentTID;
  }

  static common_$render(): boolean {
    return true;
  }

  /**
   * Sets the RRN JSON data for the RaymarchingComponent.
   * @param rrnJson - The RRN JSON data
   */
  set rrnJson(rrnJson: NodeJSON) {
    this.__rrnJson = rrnJson;
    this.__sdfShapeType = SdfShapeType.Custom;
  }

  /**
   * Gets the RRN JSON data for the RaymarchingComponent.
   * @returns The RRN JSON data
   */
  get rrnJson(): NodeJSON {
    return this.__rrnJson;
  }

  /**
   * Gets the SDF shape type for the RaymarchingComponent.
   * @returns The SDF shape type
   */
  get sdfShapeType(): SdfShapeTypeEnum {
    return this.__sdfShapeType;
  }

  /**
   * Sets the SDF shape type for the RaymarchingComponent.
   * @param sdfShapeType - The SDF shape type
   */
  set sdfShapeType(sdfShapeType: SdfShapeTypeEnum) {
    this.__sdfShapeType = sdfShapeType;

    if (sdfShapeType === SdfShapeType.Sphere) {
      this.__rrnJson = {
        nodes: [
          {
            id: '9bb9fc374f4d0600',
            name: 'InitialPosition',
            outputs: {
              outPosition: {
                id: '681369724380a644',
                label: 'Out Position',
                socket: {
                  name: 'Vector3<float>',
                },
              },
            },
            inputs: {},
            controls: {},
            position: {
              x: -580.4537626212735,
              y: -186.78308294802224,
            },
          },
          {
            id: '395df09a261a97eb',
            name: 'SdSphere',
            outputs: {
              outDistance: {
                id: 'ad50a972a9417d0a',
                label: 'Out Distance',
                socket: {
                  name: 'Scalar<float>',
                },
              },
            },
            inputs: {
              position: {
                id: '37692daa15c2d683',
                label: 'Position',
                socket: {
                  name: 'Vector3<float>',
                },
              },
              radius: {
                id: '7a2e51b1667d273d',
                label: 'Radius',
                socket: {
                  name: 'Scalar<float>',
                },
              },
            },
            controls: {},
            position: {
              x: -0.352127266212392,
              y: -235.13699920478643,
            },
          },
          {
            id: '823515b29e38a2b2',
            name: 'OutUnion',
            outputs: {},
            inputs: {
              in1: {
                id: '64f4769de2c33eb0',
                label: 'In Scalar<float>',
                socket: {
                  name: 'Scalar<float>',
                },
              },
            },
            controls: {
              shaderStage: null,
            },
            position: {
              x: 303.79296875,
              y: -241.73046875,
            },
          },
          {
            id: '77399eb88bd6c79f',
            name: 'SdApplyWorldMatrix',
            outputs: {
              outTransformedPosition: {
                id: '785e52535b88c3cf',
                label: 'Out Transformed Position',
                socket: {
                  name: 'Vector3<float>',
                },
              },
            },
            inputs: {
              position: {
                id: '149533a627739067',
                label: 'Position',
                socket: {
                  name: 'Vector3<float>',
                },
              },
            },
            controls: {
              name: {
                value: `worldMatrix_${this.componentSID}`,
              },
            },
            position: {
              x: -296.95703125,
              y: -220.53125,
            },
          },
        ],
        connections: [
          {
            id: '21a87bc76a795af2',
            from: {
              id: '9bb9fc374f4d0600',
              portName: 'outPosition',
            },
            to: {
              id: '77399eb88bd6c79f',
              portName: 'position',
            },
          },
          {
            id: '8a29fc501b6b230a',
            from: {
              id: '77399eb88bd6c79f',
              portName: 'outTransformedPosition',
            },
            to: {
              id: '395df09a261a97eb',
              portName: 'position',
            },
          },
          {
            id: '569e8716db0e5d2f',
            from: {
              id: '395df09a261a97eb',
              portName: 'outDistance',
            },
            to: {
              id: '823515b29e38a2b2',
              portName: 'in1',
            },
          },
        ],
      };
    }
  }

  /**
   * Creates a shallow copy of this RaymarchingComponent from another RaymarchingComponent.
   * @param component - The source component to copy from
   * @protected
   */
  _shallowCopyFrom(component: Component): void {
    super._shallowCopyFrom(component);
  }

  /**
   * Destroys this RaymarchingComponent and cleans up resources.
   * @protected
   */
  _destroy(): void {
    super._destroy();
  }

  addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(
    base: EntityBase,
    _componentClass: SomeComponentClass
  ) {
    /**
     * RaymarchingEntity is a mixin that adds raymarching-specific methods to the base entity.
     * @extends EntityBase
     */
    class RaymarchingEntity extends (base.constructor as any) {
      /**
       * Gets the RaymarchingComponent associated with this entity.
       * @returns The RaymarchingComponent instance
       */
      getRaymarching() {
        return this.getComponentByComponentTID(WellKnownComponentTIDs.RaymarchingComponentTID) as RaymarchingComponent;
      }
    }
    applyMixins(base, RaymarchingEntity);
    return base as unknown as ComponentToComponentMethods<SomeComponentClass> & EntityBase;
  }
}
