// shaderity:/Users/emadurandal/ghq/github.com/actnwit/RhodoniteEditor2/submodules/RhodoniteTS/src/webgpu/shaderity_shaders/nodes/raymarching/BendZX.wgsl
var code = "fn bendZX(position: vec3f, strength: f32, outPosition: ptr<function, vec3f>) {\n  let angle = strength * position.z;\n  let c = cos(angle);\n  let s = sin(angle);\n  *outPosition = vec3f(s * position.z + c * position.x, position.y, c * position.z - s * position.x);\n}\n";
var shaderStage = "fragment";
var isFragmentShader = true;
var BendZX_default = { code, shaderStage, isFragmentShader };
export {
  code,
  BendZX_default as default,
  isFragmentShader,
  shaderStage
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic2hhZGVyaXR5Oi9Vc2Vycy9lbWFkdXJhbmRhbC9naHEvZ2l0aHViLmNvbS9hY3Rud2l0L1Job2Rvbml0ZUVkaXRvcjIvc3VibW9kdWxlcy9SaG9kb25pdGVUUy9zcmMvd2ViZ3B1L3NoYWRlcml0eV9zaGFkZXJzL25vZGVzL3JheW1hcmNoaW5nL0JlbmRaWC53Z3NsIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJ7XCJjb2RlXCI6XCJmbiBiZW5kWlgocG9zaXRpb246IHZlYzNmLCBzdHJlbmd0aDogZjMyLCBvdXRQb3NpdGlvbjogcHRyPGZ1bmN0aW9uLCB2ZWMzZj4pIHtcXG4gIGxldCBhbmdsZSA9IHN0cmVuZ3RoICogcG9zaXRpb24uejtcXG4gIGxldCBjID0gY29zKGFuZ2xlKTtcXG4gIGxldCBzID0gc2luKGFuZ2xlKTtcXG4gICpvdXRQb3NpdGlvbiA9IHZlYzNmKHMgKiBwb3NpdGlvbi56ICsgYyAqIHBvc2l0aW9uLngsIHBvc2l0aW9uLnksIGMgKiBwb3NpdGlvbi56IC0gcyAqIHBvc2l0aW9uLngpO1xcbn1cXG5cIixcInNoYWRlclN0YWdlXCI6XCJmcmFnbWVudFwiLFwiaXNGcmFnbWVudFNoYWRlclwiOnRydWV9Il0sCiAgIm1hcHBpbmdzIjogIjtBQUFDLFdBQU87QUFBaVIsa0JBQWM7QUFBVyx1QkFBbUI7QUFBclUsdUJBQUMsTUFBd1IsYUFBeUIsaUJBQXVCOyIsCiAgIm5hbWVzIjogW10KfQo=
