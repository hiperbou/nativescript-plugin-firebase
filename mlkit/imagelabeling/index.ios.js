"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var image_source_1 = require("tns-core-modules/image-source");
var imagelabeling_common_1 = require("./imagelabeling-common");
var MLKitImageLabeling = (function (_super) {
    __extends(MLKitImageLabeling, _super);
    function MLKitImageLabeling() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    MLKitImageLabeling.prototype.createDetector = function () {
        return getDetector(this.confidenceThreshold);
    };
    MLKitImageLabeling.prototype.createSuccessListener = function () {
        var _this = this;
        return function (labels, error) {
            if (error !== null) {
                console.log(error.localizedDescription);
            }
            else if (labels !== null && labels.count > 0) {
                var result = {
                    labels: []
                };
                for (var i = 0, l = labels.count; i < l; i++) {
                    var label = labels.objectAtIndex(i);
                    result.labels.push({
                        text: label.text,
                        confidence: label.confidence
                    });
                }
                _this.notify({
                    eventName: MLKitImageLabeling.scanResultEvent,
                    object: _this,
                    value: result
                });
            }
        };
    };
    MLKitImageLabeling.prototype.rotateRecording = function () {
        return true;
    };
    return MLKitImageLabeling;
}(imagelabeling_common_1.MLKitImageLabeling));
exports.MLKitImageLabeling = MLKitImageLabeling;
function getDetector(confidenceThreshold) {
    var firVision = FIRVision.vision();
    var fIRVisionOnDeviceImageLabelerOptions = FIRVisionOnDeviceImageLabelerOptions.new();
    fIRVisionOnDeviceImageLabelerOptions.confidenceThreshold = confidenceThreshold || 0.5;
    return firVision.onDeviceImageLabelerWithOptions(fIRVisionOnDeviceImageLabelerOptions);
}
function labelImageOnDevice(options) {
    return new Promise(function (resolve, reject) {
        try {
            var labelDetector = getDetector(options.confidenceThreshold);
            labelDetector.processImageCompletion(getImage(options), function (labels, error) {
                if (error !== null) {
                    reject(error.localizedDescription);
                }
                else if (labels !== null) {
                    var result = {
                        labels: []
                    };
                    for (var i = 0, l = labels.count; i < l; i++) {
                        var label = labels.objectAtIndex(i);
                        result.labels.push({
                            text: label.text,
                            confidence: label.confidence
                        });
                    }
                    resolve(result);
                }
            });
        }
        catch (ex) {
            console.log("Error in firebase.mlkit.labelImageOnDevice: " + ex);
            reject(ex);
        }
    });
}
exports.labelImageOnDevice = labelImageOnDevice;
function labelImageCloud(options) {
    return new Promise(function (resolve, reject) {
        try {
            var fIRVisionCloudImageLabelerOptions = FIRVisionCloudImageLabelerOptions.new();
            fIRVisionCloudImageLabelerOptions.confidenceThreshold = options.confidenceThreshold || 0.5;
            var firVision = FIRVision.vision();
            var labeler = firVision.cloudImageLabelerWithOptions(fIRVisionCloudImageLabelerOptions);
            labeler.processImageCompletion(getImage(options), function (labels, error) {
                if (error !== null) {
                    reject(error.localizedDescription);
                }
                else if (labels !== null) {
                    var result = {
                        labels: []
                    };
                    for (var i = 0, l = labels.count; i < l; i++) {
                        var label = labels.objectAtIndex(i);
                        result.labels.push({
                            text: label.text,
                            confidence: label.confidence
                        });
                    }
                    console.log(">>> cloud image labeling result: " + JSON.stringify(result.labels));
                    resolve(result);
                }
            });
        }
        catch (ex) {
            console.log("Error in firebase.mlkit.labelImageCloud: " + ex);
            reject(ex);
        }
    });
}
exports.labelImageCloud = labelImageCloud;
function getImage(options) {
    var image = options.image instanceof image_source_1.ImageSource ? options.image.ios : options.image.imageSource.ios;
    return FIRVisionImage.alloc().initWithImage(image);
}
