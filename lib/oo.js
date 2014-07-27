var assert = require('assert');

exports.extend = extend;

function extend(child, parent){
    var f = function(){};
    f.prototype = parent.prototype;
    child.prototype = new f();
    child.prototype.constructor = child;
    child._parent = parent.prototype;
    return;
}


