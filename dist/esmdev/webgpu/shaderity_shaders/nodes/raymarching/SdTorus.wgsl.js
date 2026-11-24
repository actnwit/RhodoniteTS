// shaderity:/Users/emadurandal/ghq/github.com/actnwit/RhodoniteEditor2/submodules/RhodoniteTS/src/webgpu/shaderity_shaders/nodes/raymarching/SdTorus.wgsl
var code = "fn sdTorus(position: vec3f, radius: f32, tubeRadius: f32, outDistance: ptr<function, f32>) {\n  let q = vec2f(length(position.xz) - radius, position.y);\n  *outDistance = length(q) - tubeRadius;\n}\n";
var shaderStage = "fragment";
var isFragmentShader = true;
var SdTorus_default = { code, shaderStage, isFragmentShader };
export {
  code,
  SdTorus_default as default,
  isFragmentShader,
  shaderStage
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic2hhZGVyaXR5Oi9Vc2Vycy9lbWFkdXJhbmRhbC9naHEvZ2l0aHViLmNvbS9hY3Rud2l0L1Job2Rvbml0ZUVkaXRvcjIvc3VibW9kdWxlcy9SaG9kb25pdGVUUy9zcmMvd2ViZ3B1L3NoYWRlcml0eV9zaGFkZXJzL25vZGVzL3JheW1hcmNoaW5nL1NkVG9ydXMud2dzbCJdLAogICJzb3VyY2VzQ29udGVudCI6IFsie1wiY29kZVwiOlwiZm4gc2RUb3J1cyhwb3NpdGlvbjogdmVjM2YsIHJhZGl1czogZjMyLCB0dWJlUmFkaXVzOiBmMzIsIG91dERpc3RhbmNlOiBwdHI8ZnVuY3Rpb24sIGYzMj4pIHtcXG4gIGxldCBxID0gdmVjMmYobGVuZ3RoKHBvc2l0aW9uLnh6KSAtIHJhZGl1cywgcG9zaXRpb24ueSk7XFxuICAqb3V0RGlzdGFuY2UgPSBsZW5ndGgocSkgLSB0dWJlUmFkaXVzO1xcbn1cXG5cIixcInNoYWRlclN0YWdlXCI6XCJmcmFnbWVudFwiLFwiaXNGcmFnbWVudFNoYWRlclwiOnRydWV9Il0sCiAgIm1hcHBpbmdzIjogIjtBQUFDLFdBQU87QUFBME0sa0JBQWM7QUFBVyx1QkFBbUI7QUFBOVAsd0JBQUMsTUFBaU4sYUFBeUIsaUJBQXVCOyIsCiAgIm5hbWVzIjogW10KfQo=
