import { ISceneGraphEntity } from '../../helpers';
import { IQuaternion, IVector3, MathUtil, Quaternion } from '../../math';
import { Vector3 } from '../../math/Vector3';
import { Is } from '../../misc/Is';
import { PhysicsPropertyInner } from '../PhysicsProperty';
import { PhysicsStrategy } from '../PhysicsStrategy';
import { PhysicsWorldProperty } from '../PhysicsWorldProperty';

declare const OIMO: any;

export class OimoPhysicsStrategy implements PhysicsStrategy {
  static __worldProperty: PhysicsWorldProperty = {
    gravity: Vector3.fromCopy3(0, -9.8, 0),
    random: true,
  };
  static __world: any;
  private __body: any;
  private __entity?: ISceneGraphEntity;
  private __property: any;
  private __localScale: IVector3 = Vector3.one();

  constructor() {
    if (Is.not.exist(OimoPhysicsStrategy.__world)) {
      const world = new OIMO.World({
        timestep: 1 / 60,
        iterations: 8,
        broadphase: 2,
        worldscale: 1,
        random: OimoPhysicsStrategy.__worldProperty.random,
        info: false,
        gravity: [
          OimoPhysicsStrategy.__worldProperty.gravity.x,
          OimoPhysicsStrategy.__worldProperty.gravity.y,
          OimoPhysicsStrategy.__worldProperty.gravity.z,
        ],
      });
      OimoPhysicsStrategy.__world = world;
    }
  }

  setShape(prop: PhysicsPropertyInner, entity: ISceneGraphEntity) {
    const world = OimoPhysicsStrategy.__world;
    this.__localScale = prop.size;
    this.__property = {
      type: prop.type.str.toLowerCase(),
      size: [prop.size.x, prop.size.y, prop.size.z],
      pos: [prop.position.x, prop.position.y, prop.position.z],
      rot: [prop.rotation.x, prop.rotation.y, prop.rotation.z],
      move: prop.move,
      density: prop.density,
      friction: prop.friction,
      restitution: prop.restitution,
    };
    this.__body = world.add(this.__property);
    this.__entity = entity;
  }

  update(): void {
    if (this.__entity === undefined) {
      return;
    }
    const pos = this.__body.getPosition();
    const rot = this.__body.getQuaternion();
    this.__entity.getSceneGraph().setPositionWithoutPhysics(Vector3.fromCopy3(pos.x, pos.y, pos.z));
    this.__entity
      .getSceneGraph()
      .setRotationWithoutPhysics(Quaternion.fromCopy4(rot.x, rot.y, rot.z, rot.w));
  }

  setPosition(worldPosition: IVector3): void {
    const world = OimoPhysicsStrategy.__world;
    if (this.__entity === undefined) {
      return;
    }
    this.__body.remove();
    const prop = this.__property;
    this.__property = {
      type: prop.type,
      size: [prop.size[0], prop.size[1], prop.size[2]],
      pos: [worldPosition.x, worldPosition.y, worldPosition.z],
      rot: [this.__entity.eulerAngles.x, this.__entity.eulerAngles.y, this.__entity.eulerAngles.z],
      move: prop.move,
      density: prop.density,
      friction: prop.friction,
      restitution: prop.restitution,
    };
    this.__body = world.add(this.__property);
  }

  setEulerAngle(eulerAngles: IVector3): void {
    const world = OimoPhysicsStrategy.__world;
    if (this.__entity === undefined) {
      return;
    }
    const pos = this.__body.getPosition();
    this.__body.remove();
    const prop = this.__property;
    this.__property = {
      type: prop.type,
      size: [prop.size[0], prop.size[1], prop.size[2]],
      pos: [pos.x, pos.y, pos.z],
      rot: [
        MathUtil.radianToDegree(eulerAngles.x),
        MathUtil.radianToDegree(eulerAngles.y),
        MathUtil.radianToDegree(eulerAngles.z),
      ],
      move: prop.move,
      density: prop.density,
      friction: prop.friction,
      restitution: prop.restitution,
    };
    this.__body = world.add(this.__property);
  }

  setScale(scale: IVector3): void {
    const world = OimoPhysicsStrategy.__world;
    if (this.__entity === undefined) {
      return;
    }
    const pos = this.__body.getPosition();
    this.__body.remove();
    const prop = this.__property;
    this.__property = {
      type: prop.type,
      size: [
        this.__localScale.x * scale.x,
        this.__localScale.y * scale.y,
        this.__localScale.z * scale.z,
      ],
      pos: [pos.x, pos.y, pos.z],
      rot: [this.__entity.eulerAngles.x, this.__entity.eulerAngles.y, this.__entity.eulerAngles.z],
      move: prop.move,
      density: prop.density,
      friction: prop.friction,
      restitution: prop.restitution,
    };
    this.__body = world.add(this.__property);
  }

  static update(): void {
    if (Is.exist(OimoPhysicsStrategy.__world)) {
      OimoPhysicsStrategy.__world.step();
    }
  }
}
