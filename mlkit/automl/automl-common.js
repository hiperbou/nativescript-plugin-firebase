"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var properties_1 = require("tns-core-modules/ui/core/properties");
var mlkit_cameraview_1 = require("../mlkit-cameraview");
exports.localModelResourceFolderProperty = new properties_1.Property({
    name: "localModelResourceFolder",
    defaultValue: null,
});
exports.confidenceThresholdProperty = new properties_1.Property({
    name: "confidenceThreshold",
    defaultValue: 0.5,
});
var MLKitAutoML = (function (_super) {
    __extends(MLKitAutoML, _super);
    function MLKitAutoML() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    MLKitAutoML.prototype[exports.localModelResourceFolderProperty.setNative] = function (value) {
        this.localModelResourceFolder = value;
    };
    MLKitAutoML.prototype[exports.confidenceThresholdProperty.setNative] = function (value) {
        this.confidenceThreshold = parseFloat(value);
    };
    MLKitAutoML.scanResultEvent = "scanResult";
    return MLKitAutoML;
}(mlkit_cameraview_1.MLKitCameraView));
exports.MLKitAutoML = MLKitAutoML;
exports.localModelResourceFolderProperty.register(MLKitAutoML);
exports.confidenceThresholdProperty.register(MLKitAutoML);
