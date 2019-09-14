
const IsUtil:any = {
  not: {},
  all: {},
  any: {},

  _not(fn:Function) {
    return function() {
      return !fn.apply(null, [...arguments]);
    };
  },

  _all(fn:Function) {
    return function() {
      if (Array.isArray(arguments[0])) {
        return arguments[0].every(fn as any);
      }
      return [...arguments].every((fn as any));
    };
  },

  _any(fn:Function) {
    return function() {
      if (Array.isArray(arguments[0])) {
        return arguments[0].some(fn as any);
      }
      return [...arguments].some((fn as any));
    };
  },

  defined(val:any) {
    return val !== void 0;
  },

  undefined(val:any) {
    return val === void 0;
  },

  null(val:any) {
    return val === null;
  },

  // is NOT null or undefined
  exist(val:any) {
    return val != null;
  },

  function(val:any) {
    return typeof val === 'function';
  }

}

for (let fn in IsUtil) {
  if (IsUtil.hasOwnProperty(fn)) {
    const interfaces = ['not', 'all', 'any'];
    if (fn.indexOf('_') === -1 && !(interfaces as any).includes(fn)) {
      interfaces.forEach((itf)=>{
        const op = '_' + itf;
        (IsUtil as any)[itf][fn] = (IsUtil as any)[op]((IsUtil as any)[fn]);
      });
    }
  }
}

export default IsUtil;
