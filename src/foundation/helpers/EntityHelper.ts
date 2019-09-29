import EntityRepository from "../core/EntityRepository";
import TransformComponent from "../components/TransformComponent";
import SceneGraphComponent from "../components/SceneGraphComponent";
import MeshComponent from "../components/MeshComponent";
import MeshRendererComponent from "../components/MeshRendererComponent";
import CameraComponent from "../components/CameraComponent";
import CameraControllerComponent from "../components/CameraControllerComponent";

function createGroupEntity() {
  return EntityRepository.getInstance().createEntity([TransformComponent, SceneGraphComponent]);
}

function createMeshEntity() {
  return EntityRepository.getInstance().createEntity([TransformComponent, SceneGraphComponent, MeshComponent, MeshRendererComponent]);
}

function createCameraEntity() {
  return EntityRepository.getInstance().createEntity([TransformComponent, SceneGraphComponent, CameraComponent]);
}

function createCameraWithControllerEntity() {
  return EntityRepository.getInstance().createEntity([TransformComponent, SceneGraphComponent, CameraComponent, CameraControllerComponent]);
}

export default Object.freeze({createGroupEntity, createMeshEntity, createCameraEntity, createCameraWithControllerEntity });

