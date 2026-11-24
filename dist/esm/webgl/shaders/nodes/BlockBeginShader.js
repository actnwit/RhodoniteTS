import{StandardShaderPart as s}from"../StandardShaderPart.js";var r=class extends s{constructor(o,e,t){super();this.$A=o;this.oy=e;this.py=t}getVertexShaderDefinitions(o){let e=`void ${this.$A}(
in bool context,
      `;for(let t=0;t<this.oy.length;t++){let i=this.oy[t],n=i.compositionType.getGlslStr(i.componentType);e+=`
        in ${n} value${t},`}for(let t=0;t<this.py.length;t++){let i=this.py[t],n=i.compositionType.getGlslStr(i.componentType);e+=`
        out ${n} outValue${t}${t===this.py.length-1?"":","}`}e+=`) {
`;for(let t=0;t<this.py.length;t++)e+=`
      outValue${t} = value${t};
`;return e+="}",e}getPixelShaderDefinitions(o){return this.getVertexShaderDefinitions(o)}get attributeNames(){return[]}get attributeSemantics(){return[]}get attributeCompositions(){return[]}};export{r as BlockBeginShader};
