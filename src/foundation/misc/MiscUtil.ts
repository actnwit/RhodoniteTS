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

export const MiscUtil = Object.freeze({ isMobile, preventDefaultForDesktopOnly, isObject });
