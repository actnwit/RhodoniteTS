var e=class e extends Error{constructor(o){let r=o.error;super(`
  message: ${o.message}
  error: ${typeof(r==null?void 0:r._rnException)!="undefined"?`see below Exception \u2193${r.toString()}`:o.error}
`);this.err=o;this.name=e._prefix}getRnError(){return this.err}};e._prefix=`
Rhodonite Exception`;var t=e;export{t as RnException};
