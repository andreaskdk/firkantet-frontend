(function (global, factory) {
typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
typeof define === 'function' && define.amd ? define(['exports'], factory) :
(global = global || self, factory(global.firkantet = global.firkantet || {}));
}(this, function (exports) { 'use strict';

var version = "0.0.2";

exports.version = version;

Object.defineProperty(exports, '__esModule', { value: true });
    
}));