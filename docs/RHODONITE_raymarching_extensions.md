# RHODONITE raymarching glTF extensions

Rhodonite stores raymarching scene data in two glTF extensions:

- `RHODONITE_raymarching` on a node (per `RaymarchingComponent`), including the component's
  per-component texture assignments
- `RHODONITE_raymarching_materials` at the glTF root (legacy scene-wide material textures)

Both extensions are written by `Gltf2Exporter` and read by application code. The engine importer
restores the per-node extension into `RaymarchingComponent`; the raymarching materials are
rebuilt by the application (the editor's node editor) from the restored graphs.

## `RHODONITE_raymarching` (node extension)

```json
{
  "nodes": [
    {
      "name": "SDF Sphere",
      "translation": [0.5, 0, 0],
      "extensions": {
        "RHODONITE_raymarching": {
          "graph": { "nodes": [], "connections": [] },
          "sdfShapeType": 0,
          "isPickable": true,
          "castShadow": true,
          "textures": {
            "u_texture": { "index": 0 }
          }
        }
      }
    }
  ]
}
```

| Property | Type | Description |
| --- | --- | --- |
| `graph` | `NodeJSON \| null` | The Rete-style node graph for the component. When present it is authoritative. |
| `sdfShapeType` | `number` | Built-in SDF shape index (`SdfShapeType`). Used only when `graph` is absent. |
| `isPickable` | `boolean` | Whether the object participates in picking. |
| `castShadow` | `boolean` | Whether the SDF is rendered into the shadow maps. Defaults to `true`. |
| `textures` | `{ [semantic]: { index } }` | Per-component Texture2D assignments. Each `index` refers to the standard glTF `textures` array. |

The node transform (translation/rotation/scale) is stored by the standard glTF node properties.
The importer sets `RaymarchingComponent.rrnJson` from `graph`, or `sdfShapeType` when the graph is
missing, then restores `isPickable` and `castShadow`.

### Per-object uniforms

Uniform nodes (`UniformScalarFloat`, `UniformVector2Float`, `UniformVector3Float`,
`UniformVector4Float`) are per component. Each component has its own material, so the authored
uniform name is used as-is. (When an application still merges the graphs with `collectRrnJson`,
each uniform name is postfixed with the component SID instead.)

The component's own graph keeps the user-authored name (for example `roughness`), and its control
values are what the inspector edits. Because the graphs are stored by this extension, per-object
uniform values survive save/load without additional extension fields.

## Per-component textures

Each `RaymarchingComponent` owns a material (and a buffer-less pass), so its Texture2D textures
are stored on its own node extension:

- Export with `raymarchingComponentMaterials`, which maps each component entity to its material:

  ```ts
  await Gltf2Exporter.export(engine, 'Rhodonite', {
    entities,
    type: GLTF2_EXPORT_NO_DOWNLOAD,
    raymarchingComponentMaterials: components.map(component => ({
      entity: component.entity,
      material: forwardRenderPipeline.getRaymarchingComponentMaterial(component),
    })),
  });
  ```

- The exporter writes `RHODONITE_raymarching.textures` on each component's node. Only semantics
  declared by `Texture2D` nodes in that component's graph are exported; engine-managed textures
  (IBL, shadow maps, the sheen LUT and the transmission back buffer) are skipped, as are dummy /
  not-ready textures.
- Texture indices refer to the shared glTF `textures` array, and images are deduplicated by the
  normal exporter texture handling.
- On import, `ModelConverter.getRaymarchingComponentTextureAssignments(gltfModel)` lists the
  assignments with their glTF node index, and
  `ModelConverter.createRaymarchingComponentTextures(engine, gltfModel)` creates the textures,
  keyed by node index and semantic. The imported entity carries the same node index in the
  `TagGltf2NodeIndex` (`gltf_node_index`) tag, so the application can apply each set to the
  material it rebuilds for that component.

When `raymarchingComponentMaterials` is non-empty, the exporter does not write the legacy root
extension below.

## `RHODONITE_raymarching_materials` (root extension, legacy shared material)

Applications that render every component with one merged material store its textures once at the
glTF root instead of on each node.

```json
{
  "extensions": {
    "RHODONITE_raymarching_materials": {
      "textures": {
        "u_texture": { "index": 0 }
      }
    }
  },
  "images": [{ "bufferView": 3, "mimeType": "image/png" }],
  "samplers": [{ "magFilter": 9729, "minFilter": 9987, "wrapS": 10497, "wrapT": 10497 }],
  "textures": [{ "sampler": 0, "source": 0 }]
}
```

- `textures` maps each 2D-texture shader semantic of the shared raymarching material to
  `{ "index": n }`, where `n` indexes the standard glTF `textures` array.
- Images are embedded as PNG buffer views for GLB-style exports, following the exporter's normal
  image handling.
- Only semantics declared by `Texture2D` nodes in the material's graph are exported. Engine-managed
  textures are skipped: IBL environment textures (`diffuseEnvTexture` / `specularEnvTexture`),
  shadow maps (`depthTexture` / `paraboloidDepthTexture`), the sheen LUT (`sheenLutTexture`) and
  the transmission back buffer (`backBufferTexture`).
- Dummy/placeholder textures and textures that are not ready are skipped.

The exporter writes this extension only when the application passes the legacy shared material:

```ts
await Gltf2Exporter.export(engine, 'Rhodonite', {
  entities,
  type: GLTF2_EXPORT_NO_DOWNLOAD,
  raymarchingMaterial: forwardRenderPipeline.getRaymarchingMaterial(),
});
```

On import, the application creates Rhodonite `Texture`/`Sampler` objects from the referenced
glTF images and applies them to the rebuilt material. The editor does this in
`applyImportedRaymarchingMaterialTextures` (RhodoniteEditor2).

## Round-trip notes

- The graph and its textures are per component and stored together on the node.
- When both `graph` and `sdfShapeType` are present, `graph` wins.
- Texture assignments survive save/load through the extensions; textures are re-created by the
  application, not by the engine importer, because materials do not exist until the graphs are
  rebuilt.
- Old files that only have the root extension still load: the scene-wide textures are applied to
  every rebuilt component material whose graph declares the semantic.
