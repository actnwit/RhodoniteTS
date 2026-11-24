// shaderity:/Users/emadurandal/ghq/github.com/actnwit/RhodoniteEditor2/submodules/RhodoniteTS/src/webgpu/shaderity_shaders/nodes/raymarching/BendYZ.wgsl
var code = "fn bendYZ(position: vec3f, strength: f32, outPosition: ptr<function, vec3f>) {\n  let angle = strength * position.y;\n  let c = cos(angle);\n  let s = sin(angle);\n  *outPosition = vec3f(position.x, c * position.y - s * position.z, s * position.y + c * position.z);\n}\n";
var shaderStage = "fragment";
var isFragmentShader = true;
var BendYZ_default = { code, shaderStage, isFragmentShader };
export {
  code,
  BendYZ_default as default,
  isFragmentShader,
  shaderStage
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic2hhZGVyaXR5Oi9Vc2Vycy9lbWFkdXJhbmRhbC9naHEvZ2l0aHViLmNvbS9hY3Rud2l0L1Job2Rvbml0ZUVkaXRvcjIvc3VibW9kdWxlcy9SaG9kb25pdGVUUy9zcmMvd2ViZ3B1L3NoYWRlcml0eV9zaGFkZXJzL25vZGVzL3JheW1hcmNoaW5nL0JlbmRZWi53Z3NsIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJ7XCJjb2RlXCI6XCJmbiBiZW5kWVoocG9zaXRpb246IHZlYzNmLCBzdHJlbmd0aDogZjMyLCBvdXRQb3NpdGlvbjogcHRyPGZ1bmN0aW9uLCB2ZWMzZj4pIHtcXG4gIGxldCBhbmdsZSA9IHN0cmVuZ3RoICogcG9zaXRpb24ueTtcXG4gIGxldCBjID0gY29zKGFuZ2xlKTtcXG4gIGxldCBzID0gc2luKGFuZ2xlKTtcXG4gICpvdXRQb3NpdGlvbiA9IHZlYzNmKHBvc2l0aW9uLngsIGMgKiBwb3NpdGlvbi55IC0gcyAqIHBvc2l0aW9uLnosIHMgKiBwb3NpdGlvbi55ICsgYyAqIHBvc2l0aW9uLnopO1xcbn1cXG5cIixcInNoYWRlclN0YWdlXCI6XCJmcmFnbWVudFwiLFwiaXNGcmFnbWVudFNoYWRlclwiOnRydWV9Il0sCiAgIm1hcHBpbmdzIjogIjtBQUFDLFdBQU87QUFBaVIsa0JBQWM7QUFBVyx1QkFBbUI7QUFBclUsdUJBQUMsTUFBd1IsYUFBeUIsaUJBQXVCOyIsCiAgIm5hbWVzIjogW10KfQo=
