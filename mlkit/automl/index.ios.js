"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var image_source_1 = require("tns-core-modules/image-source");
var automl_common_1 = require("./automl-common");
var MLKitAutoML = (function (_super) {
    __extends(MLKitAutoML, _super);
    function MLKitAutoML() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    MLKitAutoML.prototype.createDetector = function () {
        return getDetector(this.localModelResourceFolder, this.confidenceThreshold);
    };
    MLKitAutoML.prototype.createSuccessListener = function () {
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
                    eventName: MLKitAutoML.scanResultEvent,
                    object: _this,
                    value: result
                });
            }
        };
    };
    MLKitAutoML.prototype.rotateRecording = function () {
        return true;
    };
    return MLKitAutoML;
}(automl_common_1.MLKitAutoML));
exports.MLKitAutoML = MLKitAutoML;
function getDetector(localModelResourceFolder, confidenceThreshold) {
    var manifestPath = NSBundle.mainBundle.pathForResourceOfTypeInDirectory("manifest", "json", localModelResourceFolder);
    var fIRAutoMLLocalModel = FIRAutoMLLocalModel.alloc().initWithManifestPath(manifestPath);
    var options = FIRVisionOnDeviceAutoMLImageLabelerOptions.alloc().initWithLocalModel(fIRAutoMLLocalModel);
    options.confidenceThreshold = confidenceThreshold || 0.5;
    var fIRVisionImageLabeler = FIRVision.vision().onDeviceAutoMLImageLabelerWithOptions(options);
    return fIRVisionImageLabeler;
}
function labelImage(options) {
    return new Promise(function (resolve, reject) {
        try {
            var labelDetector = getDetector(options.localModelResourceFolder, options.confidenceThreshold);
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
exports.labelImage = labelImage;
function getImage(options) {
    var image = options.image instanceof image_source_1.ImageSource ? options.image.ios : options.image.imageSource.ios;
    return FIRVisionImage.alloc().initWithImage(image);
}
