import { SceneGraphComponent } from '../components/SceneGraph/SceneGraphComponent';
import { Vector3 } from '../math/Vector3';
export declare class CapsuleCollider {
    position: Vector3;
    radius: number;
    tail: Vector3;
    baseSceneGraph?: SceneGraphComponent;
    collision(bonePosition: Vector3, boneRadius: number): {
        direction: Vector3;
        distance: number;
    };
}
