var n=`/* shaderity: @{definitions} */
/* shaderity: @{vertexOutput} */
/* shaderity: @{prerequisites} */

/* shaderity: @{getters} */
/* shaderity: @{matricesGetters} */

@vertex
fn main(
  @builtin(vertex_index) vertexIdx : u32,
) -> VertexOutput {
  var output : VertexOutput;

/* shaderity: @{fullscreen} */

  return output;

}
`,r="vertex",i=!1,s={code:n,shaderStage:r,isFragmentShader:i};export{n as code,s as default,i as isFragmentShader,r as shaderStage};
