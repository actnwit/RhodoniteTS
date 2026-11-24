// shaderity:/Users/emadurandal/ghq/github.com/actnwit/RhodoniteEditor2/submodules/RhodoniteTS/src/webgl/shaderity_shaders/nodes/raymarching/RaymarchTBN.glsl
var code = "void raymarchTBN(out mat3 outValue) {\n  uint cameraSID = uint(u_currentComponentSIDs[/* shaderity: @{WellKnownComponentTIDs.CameraComponentTID} */]);\n  vec3 viewVector = get_viewPosition(cameraSID) - g_hitPosition;\n  outValue = getTBN(g_hitNormal, vec3(1.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0), viewVector, vec2(0.0));\n}\n";
var shaderStage = "fragment";
var isFragmentShader = true;
var RaymarchTBN_default = { code, shaderStage, isFragmentShader };
export {
  code,
  RaymarchTBN_default as default,
  isFragmentShader,
  shaderStage
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic2hhZGVyaXR5Oi9Vc2Vycy9lbWFkdXJhbmRhbC9naHEvZ2l0aHViLmNvbS9hY3Rud2l0L1Job2Rvbml0ZUVkaXRvcjIvc3VibW9kdWxlcy9SaG9kb25pdGVUUy9zcmMvd2ViZ2wvc2hhZGVyaXR5X3NoYWRlcnMvbm9kZXMvcmF5bWFyY2hpbmcvUmF5bWFyY2hUQk4uZ2xzbCJdLAogICJzb3VyY2VzQ29udGVudCI6IFsie1wiY29kZVwiOlwidm9pZCByYXltYXJjaFRCTihvdXQgbWF0MyBvdXRWYWx1ZSkge1xcbiAgdWludCBjYW1lcmFTSUQgPSB1aW50KHVfY3VycmVudENvbXBvbmVudFNJRHNbLyogc2hhZGVyaXR5OiBAe1dlbGxLbm93bkNvbXBvbmVudFRJRHMuQ2FtZXJhQ29tcG9uZW50VElEfSAqL10pO1xcbiAgdmVjMyB2aWV3VmVjdG9yID0gZ2V0X3ZpZXdQb3NpdGlvbihjYW1lcmFTSUQpIC0gZ19oaXRQb3NpdGlvbjtcXG4gIG91dFZhbHVlID0gZ2V0VEJOKGdfaGl0Tm9ybWFsLCB2ZWMzKDEuMCwgMC4wLCAwLjApLCB2ZWMzKDAuMCwgMS4wLCAwLjApLCB2aWV3VmVjdG9yLCB2ZWMyKDAuMCkpO1xcbn1cXG5cIixcInNoYWRlclN0YWdlXCI6XCJmcmFnbWVudFwiLFwiaXNGcmFnbWVudFNoYWRlclwiOnRydWV9Il0sCiAgIm1hcHBpbmdzIjogIjtBQUFDLFdBQU87QUFBb1Usa0JBQWM7QUFBVyx1QkFBbUI7QUFBeFgsNEJBQUMsTUFBMlUsYUFBeUIsaUJBQXVCOyIsCiAgIm5hbWVzIjogW10KfQo=
