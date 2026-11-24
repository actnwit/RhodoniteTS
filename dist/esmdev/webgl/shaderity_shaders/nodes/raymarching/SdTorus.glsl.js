// shaderity:/Users/emadurandal/ghq/github.com/actnwit/RhodoniteEditor2/submodules/RhodoniteTS/src/webgl/shaderity_shaders/nodes/raymarching/SdTorus.glsl
var code = "void sdTorus(in vec3 position, in float radius, in float tubeRadius, out float outDistance) {\n  vec2 q = vec2(length(position.xz) - radius, position.y);\n  outDistance = length(q) - tubeRadius;\n}\n";
var shaderStage = "fragment";
var isFragmentShader = true;
var SdTorus_default = { code, shaderStage, isFragmentShader };
export {
  code,
  SdTorus_default as default,
  isFragmentShader,
  shaderStage
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic2hhZGVyaXR5Oi9Vc2Vycy9lbWFkdXJhbmRhbC9naHEvZ2l0aHViLmNvbS9hY3Rud2l0L1Job2Rvbml0ZUVkaXRvcjIvc3VibW9kdWxlcy9SaG9kb25pdGVUUy9zcmMvd2ViZ2wvc2hhZGVyaXR5X3NoYWRlcnMvbm9kZXMvcmF5bWFyY2hpbmcvU2RUb3J1cy5nbHNsIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJ7XCJjb2RlXCI6XCJ2b2lkIHNkVG9ydXMoaW4gdmVjMyBwb3NpdGlvbiwgaW4gZmxvYXQgcmFkaXVzLCBpbiBmbG9hdCB0dWJlUmFkaXVzLCBvdXQgZmxvYXQgb3V0RGlzdGFuY2UpIHtcXG4gIHZlYzIgcSA9IHZlYzIobGVuZ3RoKHBvc2l0aW9uLnh6KSAtIHJhZGl1cywgcG9zaXRpb24ueSk7XFxuICBvdXREaXN0YW5jZSA9IGxlbmd0aChxKSAtIHR1YmVSYWRpdXM7XFxufVxcblwiLFwic2hhZGVyU3RhZ2VcIjpcImZyYWdtZW50XCIsXCJpc0ZyYWdtZW50U2hhZGVyXCI6dHJ1ZX0iXSwKICAibWFwcGluZ3MiOiAiO0FBQUMsV0FBTztBQUEwTSxrQkFBYztBQUFXLHVCQUFtQjtBQUE5UCx3QkFBQyxNQUFpTixhQUF5QixpQkFBdUI7IiwKICAibmFtZXMiOiBbXQp9Cg==
