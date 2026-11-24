import type { Count } from '../../../types/CommonTypes';
import type { IMeshRendererEntityMethods } from '../../components/MeshRenderer/IMeshRendererEntity';
import { ProcessStage } from '../../definitions/ProcessStage';
import type { Primitive } from '../../geometry/Primitive';
import type { AbstractMaterialContent } from '../../materials/core/AbstractMaterialContent';
import type { Material } from '../../materials/core/Material';
import { Is } from '../../misc/Is';
import type { Engine } from '../../system/Engine';

/**
 * Creates a new material with the specified material content and maximum instances.
 *
 * @param materialContent - The material content that defines the material's properties and shaders
 * @param materialCountPerBufferView - the material count per buffer view
 * @returns A newly created Material instance
 */
export function createMaterial(
  engine: Engine,
  materialContent: AbstractMaterialContent,
  materialCountPerBufferView?: Count
): Material {
  const materialSemanticsVariantName = materialContent.getMaterialSemanticsVariantName();
  engine.materialRepository.registerMaterial(
    engine,
    materialSemanticsVariantName,
    materialContent,
    materialCountPerBufferView
  );
  const material = engine.materialRepository.createMaterial(engine, materialSemanticsVariantName, materialContent);
  return material;
}

/**
 * Reuses an existing material if compatible with the new content, or recreates it if incompatible.
 * This function optimizes performance by avoiding unnecessary material recreation.
 *
 * @param engine - The engine instance
 * @param currentMaterial - The existing material to potentially reuse
 * @param materialContent - The new material content to apply
 * @param materialCountPerBufferView - the material count per buffer view
 * @returns The reused or newly created Material instance
 */
export function reuseOrRecreateMaterial(
  engine: Engine,
  materialContent: AbstractMaterialContent,
  materialCountPerBufferView: Count,
  currentMaterial?: Material
): Material {
  let material = currentMaterial;
  if (Is.exist(material) && engine.materialRepository.isMaterialCompatible(material, materialContent)) {
    material._materialContent = materialContent;
    material.makeShadersInvalidate();
    return material;
  }
  const materialSemanticsVariantName = materialContent.getMaterialSemanticsVariantName();
  engine.materialRepository.registerMaterial(
    engine,
    materialSemanticsVariantName,
    materialContent,
    materialCountPerBufferView
  );
  material = engine.materialRepository.createMaterial(engine, materialSemanticsVariantName, materialContent);
  return material;
}

/**
 * Forces recreation of a material with the specified content, bypassing compatibility checks.
 * Use this when you need to ensure a completely fresh material instance.
 *
 * @param engine - The engine instance
 * @param materialContent - The material content for the new material
 * @param materialCountPerBufferView - the material count per buffer view
 * @returns A newly recreated Material instance
 */
export function recreateMaterial(
  engine: Engine,
  materialContent: AbstractMaterialContent,
  materialCountPerBufferView?: Count
): Material {
  const materialSemanticsVariantName = materialContent.getMaterialSemanticsVariantName();
  engine.materialRepository.forceRegisterMaterial(
    engine,
    materialSemanticsVariantName,
    materialContent,
    materialCountPerBufferView
  );

  const material = engine.materialRepository.createMaterial(engine, materialSemanticsVariantName, materialContent);
  return material;
}

/**
 * Changes the material assigned to a specific primitive on an entity.
 * This function updates the primitive's material and triggers necessary render state updates.
 * Translucency properties (isTranslucent, alphaMode) and backBufferTexture are preserved
 * from the old material to maintain proper rendering behavior for transmission materials.
 *
 * @param entity - The mesh renderer entity containing the primitive
 * @param primitive - The primitive to change the material for
 * @param material - The new material to assign to the primitive
 */
export function changeMaterial(entity: IMeshRendererEntityMethods, primitive: Primitive, material: Material) {
  const meshRendererComponent = entity.getMeshRenderer()!;

  // Preserve translucency properties from the old material
  // This is important for transmission materials (KHR_materials_transmission) to ensure
  // they continue to be rendered in the correct render pass after material change
  const oldMaterial = primitive.material;
  if (oldMaterial != null) {
    material.isTranslucent = oldMaterial.isTranslucent;
    material.alphaMode = oldMaterial.alphaMode;
  }

  primitive.material = material;
  meshRendererComponent.moveStageTo(ProcessStage.Load);
}
