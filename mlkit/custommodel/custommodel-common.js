"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("tns-core-modules/file-system");
var properties_1 = require("tns-core-modules/ui/core/properties");
var mlkit_cameraview_1 = require("../mlkit-cameraview");
exports.localModelFileProperty = new properties_1.Property({
    name: "localModelFile",
    defaultValue: null,
});
exports.labelsFileProperty = new properties_1.Property({
    name: "labelsFile",
    defaultValue: null,
});
exports.modelInputShapeProperty = new properties_1.Property({
    name: "modelInputShape",
    defaultValue: null,
});
exports.modelInputTypeProperty = new properties_1.Property({
    name: "modelInputType",
    defaultValue: null,
});
exports.maxResultsProperty = new properties_1.Property({
    name: "maxResults",
    defaultValue: 5
});
var MLKitCustomModel = (function (_super) {
    __extends(MLKitCustomModel, _super);
    function MLKitCustomModel() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    MLKitCustomModel.prototype[exports.localModelFileProperty.setNative] = function (value) {
        this.localModelFile = value;
    };
    MLKitCustomModel.prototype[exports.labelsFileProperty.setNative] = function (value) {
        this.labelsFile = value;
        if (value.indexOf("~/") === 0) {
            this.labels = getLabelsFromAppFolder(value);
        }
        else {
            console.log("For the 'labelsFile' property, use the ~/ prefix for now..");
            return;
        }
    };
    MLKitCustomModel.prototype[exports.maxResultsProperty.setNative] = function (value) {
        this.maxResults = parseInt(value);
    };
    MLKitCustomModel.prototype[exports.modelInputShapeProperty.setNative] = function (value) {
        if ((typeof value) === "string") {
            this.modelInputShape = value.split(",").map(function (v) { return parseInt(v.trim()); });
        }
    };
    MLKitCustomModel.prototype[exports.modelInputTypeProperty.setNative] = function (value) {
        this.modelInputType = value;
    };
    MLKitCustomModel.scanResultEvent = "scanResult";
    return MLKitCustomModel;
}(mlkit_cameraview_1.MLKitCameraView));
exports.MLKitCustomModel = MLKitCustomModel;
exports.localModelFileProperty.register(MLKitCustomModel);
exports.labelsFileProperty.register(MLKitCustomModel);
exports.maxResultsProperty.register(MLKitCustomModel);
exports.modelInputShapeProperty.register(MLKitCustomModel);
exports.modelInputTypeProperty.register(MLKitCustomModel);
function getLabelsFromAppFolder(labelsFile) {
    var labelsPath = fs.knownFolders.currentApp().path + labelsFile.substring(1);
    return getLabelsFromFile(labelsPath);
}
exports.getLabelsFromAppFolder = getLabelsFromAppFolder;
function getLabelsFromFile(labelsFile) {
    var fileContents = fs.File.fromPath(labelsFile).readTextSync();
    var lines = fileContents.split("\n");
    while (lines[lines.length - 1].trim() === "") {
        lines.pop();
    }
    return lines;
}
exports.getLabelsFromFile = getLabelsFromFile;
