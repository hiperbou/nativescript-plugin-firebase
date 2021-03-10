"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var properties_1 = require("tns-core-modules/ui/core/properties");
var view_base_1 = require("tns-core-modules/ui/core/view-base");
var mlkit_cameraview_1 = require("../mlkit-cameraview");
var ObjectDetectionCategory;
(function (ObjectDetectionCategory) {
    ObjectDetectionCategory[ObjectDetectionCategory["Unknown"] = 0] = "Unknown";
    ObjectDetectionCategory[ObjectDetectionCategory["HomeGoods"] = 1] = "HomeGoods";
    ObjectDetectionCategory[ObjectDetectionCategory["FashionGoods"] = 2] = "FashionGoods";
    ObjectDetectionCategory[ObjectDetectionCategory["Food"] = 3] = "Food";
    ObjectDetectionCategory[ObjectDetectionCategory["Places"] = 4] = "Places";
    ObjectDetectionCategory[ObjectDetectionCategory["Plants"] = 5] = "Plants";
})(ObjectDetectionCategory = exports.ObjectDetectionCategory || (exports.ObjectDetectionCategory = {}));
exports.classifyProperty = new properties_1.Property({
    name: "classify",
    defaultValue: false,
    valueConverter: view_base_1.booleanConverter
});
exports.multipleProperty = new properties_1.Property({
    name: "multiple",
    defaultValue: false,
    valueConverter: view_base_1.booleanConverter
});
var MLKitObjectDetection = (function (_super) {
    __extends(MLKitObjectDetection, _super);
    function MLKitObjectDetection() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    MLKitObjectDetection.prototype[exports.classifyProperty.setNative] = function (value) {
        this.classify = value;
    };
    MLKitObjectDetection.prototype[exports.multipleProperty.setNative] = function (value) {
        this.multiple = value;
    };
    MLKitObjectDetection.scanResultEvent = "scanResult";
    return MLKitObjectDetection;
}(mlkit_cameraview_1.MLKitCameraView));
exports.MLKitObjectDetection = MLKitObjectDetection;
exports.classifyProperty.register(MLKitObjectDetection);
exports.multipleProperty.register(MLKitObjectDetection);
