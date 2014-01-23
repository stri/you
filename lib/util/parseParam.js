(function(module) {
  module.exports = function(oSource, oParams, isown) {
    var key, obj = {};
    oParams = oParams || {};
    for (key in oSource) {
      obj[key] = oSource[key];
      if (oParams[key] != null) {
        if (isown) { // 仅复制自己
          if (oSource.hasOwnProperty[key]) {
            obj[key] = oParams[key];
          }
        } else {
          obj[key] = oParams[key];
        }
      }
    }
    return obj;
  };
})(module);