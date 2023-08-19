import { Vector3 } from '../../math/Vector3';
import { Is } from '../../misc/Is';
import { PhysicsProperty } from '../PhysicsProperty';
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

  setShape(shape: PhysicsProperty) {
    const world = OimoPhysicsStrategy.__world;
    this.__body = world.add({
      type: shape.type.str.toLowerCase(),
      size: [shape.size.x, shape.size.y, shape.size.z],
      pos: [shape.position.x, shape.position.y, shape.position.z],
      rot: [shape.rotation.x, shape.rotation.y, shape.rotation.z],
      move: true,
      density: 1,
      friction: shape.friction,
      restitution: shape.restitution,
    });
  }

  update(): void {
    // Nothing to do
  }

  static update(): void {
    if (Is.exist(OimoPhysicsStrategy.__world)) {
      OimoPhysicsStrategy.__world.step();
    }
  }
}
