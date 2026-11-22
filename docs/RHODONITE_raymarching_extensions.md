# RHODONITE raymarching glTF extensions

Rhodonite stores raymarching scene data in two glTF extensions:

- `RHODONITE_raymarching` on a node (per `RaymarchingComponent`)
- `RHODONITE_raymarching_materials` at the glTF root (for the shared raymarching material)

Both extensions are written by `Gltf2Exporter` and read by application code. The engine importer
restores the per-node extension into `RaymarchingComponent`; the shared material is rebuilt by the
application (the editor's node editor) from the restored graphs and material extension.

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
          "isPickable": true
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

The node transform (translation/rotation/scale) is stored by the standard glTF node properties.
The importer sets `RaymarchingComponent.rrnJson` from `graph`, or `sdfShapeType` when the graph is
missing, then restores `isPickable`.

## `RHODONITE_raymarching_materials` (root extension)

The raymarching material is shared by every `RaymarchingComponent`, so its user-assigned textures
are stored once at the glTF root instead of on each node.

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

- `textures` maps each 2D-texture shader semantic of the raymarching material to `{ "index": n }`,
  where `n` indexes the standard glTF `textures` array (and from there `samplers` / `images`).
- Images are embedded as PNG buffer views for GLB-style exports, following the exporter's normal
  image handling.
- Only semantics declared by `Texture2D` nodes in the material's graph are exported. Engine-managed
  textures are skipped: IBL environment textures (`diffuseEnvTexture` / `specularEnvTexture`),
  shadow maps (`depthTexture` / `paraboloidDepthTexture`), the sheen LUT (`sheenLutTexture`) and
  the transmission back buffer (`backBufferTexture`).
- Dummy/placeholder textures and textures that are not ready are skipped.

The exporter writes this extension only when the application passes the shared material:

```ts
await Gltf2Exporter.export(engine, 'Rhodonite', {
  entities,
  type: GLTF2_EXPORT_NO_DOWNLOAD,
  raymarchingMaterial: forwardRenderPipeline.getRaymarchingMaterial(),
});
```

On import, the application creates Rhodonite `Texture`/`Sampler` objects from the referenced
glTF images and applies them to the material after rebuilding it from the node graphs. The editor
does this in `applyImportedRaymarchingMaterialTextures` (RhodoniteEditor2).

## Round-trip notes

- The graph is per component; the material (and therefore its textures) is shared.
- When both `graph` and `sdfShapeType` are present, `graph` wins.
- Texture assignments survive save/load through `RHODONITE_raymarching_materials`; textures are
  re-created by the application, not by the engine importer, because the material does not exist
  until the graphs are merged.
