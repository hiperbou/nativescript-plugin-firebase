"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._";
function getNonce(length) {
    var text = "";
    for (var i = 0; i < length; i++) {
        text += CHARSET.charAt(Math.floor(Math.random() * CHARSET.length));
    }
    return text;
}
exports.getNonce = getNonce;
function Sha256(input) {
    var nsStr = NSString.stringWithString(input);
    var nsData = nsStr.dataUsingEncoding(NSUTF8StringEncoding);
    var hash = NSMutableData.dataWithLength(32);
    CC_SHA256(nsData.bytes, nsData.length, hash.mutableBytes);
    var data = NSData.dataWithBytesLength(hash.mutableBytes, 32);
    return _Format(data);
}
exports.Sha256 = Sha256;
function _Format(data) {
    var buffer = interop.bufferFromData(data);
    var view = new Uint8Array(buffer);
    var result = "";
    for (var i = 0; i !== data.length; ++i) {
        var tmp = view[i].toString(16);
        if (tmp.length === 1) {
            result += "0";
        }
        result += tmp;
    }
    return result;
}
