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

export const MiscUtil = Object.freeze({ isMobile, preventDefaultForDesktopOnly });
