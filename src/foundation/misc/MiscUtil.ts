const isMobile = function() {
  const ua = [
    'iPod',
    'iPad',
    'iPhone',
    'Android'
  ];

  for (var i=0; i<ua.length; i++) {
    if (navigator.userAgent.indexOf(ua[i]) > 0) {
      return true;
    }
  }

  return false;
}

const preventDefaultForDesktopOnly = function(e: Event) {
  if (!isMobile()) {
    e.preventDefault();
  }
}

const isObject = function(o: any) {
  return (o instanceof Object && !(o instanceof Array)) ? true : false;
};

// https://stackoverflow.com/questions/30003353/can-es6-template-literals-be-substituted-at-runtime-or-reused
const fillTemplate = function(templateString: string, templateVars: string){
  return new Function("return `"+templateString +"`;").call(templateVars);
}

export const MiscUtil = Object.freeze({ isMobile, preventDefaultForDesktopOnly, isObject, fillTemplate });
