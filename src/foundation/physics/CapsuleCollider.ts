import { SceneGraphComponent } from "../components/SceneGraph/SceneGraphComponent";
import { Vector3 } from "../math/Vector3";

export class CapsuleCollider {
  public position = Vector3.zero();
  public radius = 0;
  public tail = Vector3.zero();
}
