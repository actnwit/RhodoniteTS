function h(e,r){let n=[];(!r||e.isJoint())&&n.push(e);let o=e.children;for(let t=0;t<o.length;t++){let p=h(o[t],r);Array.prototype.push.apply(n,p)}return n}export{h as flattenHierarchy};
