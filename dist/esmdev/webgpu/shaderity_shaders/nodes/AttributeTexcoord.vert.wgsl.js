// shaderity:/Users/emadurandal/ghq/github.com/actnwit/RhodoniteEditor2/submodules/RhodoniteTS/src/webgpu/shaderity_shaders/nodes/AttributeTexcoord.vert.wgsl
var code = "fn attributeTexcoord(texcoordIndex: u32, outValue: ptr<function, vec2<f32>>) {\n  if(texcoordIndex == 0u) {\n    *outValue = a_texcoord_0;\n  } else if(texcoordIndex == 1u) {\n    *outValue = a_texcoord_1;\n  } else {\n    *outValue = a_texcoord_2;\n  }\n}\n";
var shaderStage = "vertex";
var isFragmentShader = false;
var AttributeTexcoord_vert_default = { code, shaderStage, isFragmentShader };
export {
  code,
  AttributeTexcoord_vert_default as default,
  isFragmentShader,
  shaderStage
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic2hhZGVyaXR5Oi9Vc2Vycy9lbWFkdXJhbmRhbC9naHEvZ2l0aHViLmNvbS9hY3Rud2l0L1Job2Rvbml0ZUVkaXRvcjIvc3VibW9kdWxlcy9SaG9kb25pdGVUUy9zcmMvd2ViZ3B1L3NoYWRlcml0eV9zaGFkZXJzL25vZGVzL0F0dHJpYnV0ZVRleGNvb3JkLnZlcnQud2dzbCJdLAogICJzb3VyY2VzQ29udGVudCI6IFsie1wiY29kZVwiOlwiZm4gYXR0cmlidXRlVGV4Y29vcmQodGV4Y29vcmRJbmRleDogdTMyLCBvdXRWYWx1ZTogcHRyPGZ1bmN0aW9uLCB2ZWMyPGYzMj4+KSB7XFxuICBpZih0ZXhjb29yZEluZGV4ID09IDB1KSB7XFxuICAgICpvdXRWYWx1ZSA9IGFfdGV4Y29vcmRfMDtcXG4gIH0gZWxzZSBpZih0ZXhjb29yZEluZGV4ID09IDF1KSB7XFxuICAgICpvdXRWYWx1ZSA9IGFfdGV4Y29vcmRfMTtcXG4gIH0gZWxzZSB7XFxuICAgICpvdXRWYWx1ZSA9IGFfdGV4Y29vcmRfMjtcXG4gIH1cXG59XFxuXCIsXCJzaGFkZXJTdGFnZVwiOlwidmVydGV4XCIsXCJpc0ZyYWdtZW50U2hhZGVyXCI6ZmFsc2V9Il0sCiAgIm1hcHBpbmdzIjogIjtBQUFDLFdBQU87QUFBcVEsa0JBQWM7QUFBUyx1QkFBbUI7QUFBdlQsdUNBQUMsTUFBNFEsYUFBdUIsaUJBQXdCOyIsCiAgIm5hbWVzIjogW10KfQo=
