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
        return new com.google.android.gms.tasks.OnSuccessListener({
            onSuccess: function (labels) {
                if (labels.size() === 0)
                    return;
                var result = {
                    labels: []
                };
                for (var i = 0; i < labels.size(); i++) {
                    var label = labels.get(i);
                    result.labels.push({
                        text: label.getText(),
                        confidence: label.getConfidence()
                    });
                }
                _this.notify({
                    eventName: MLKitAutoML.scanResultEvent,
                    object: _this,
                    value: result
                });
            }
        });
    };
    return MLKitAutoML;
}(automl_common_1.MLKitAutoML));
exports.MLKitAutoML = MLKitAutoML;
function getDetector(localModelResourceFolder, confidenceThreshold) {
    var model = new com.google.firebase.ml.vision.automl.FirebaseAutoMLLocalModel.Builder()
        .setAssetFilePath(localModelResourceFolder + "/manifest.json")
        .build();
    var labelDetectorOptions = new com.google.firebase.ml.vision.label.FirebaseVisionOnDeviceAutoMLImageLabelerOptions.Builder(model)
        .setConfidenceThreshold(confidenceThreshold)
        .build();
    return com.google.firebase.ml.vision.FirebaseVision.getInstance()
        .getOnDeviceAutoMLImageLabeler(labelDetectorOptions);
}
function labelImage(options) {
    return new Promise(function (resolve, reject) {
        try {
            var firebaseVisionAutoMLImageLabeler_1 = getDetector(options.localModelResourceFolder, options.confidenceThreshold || 0.5);
            var onSuccessListener = new com.google.android.gms.tasks.OnSuccessListener({
                onSuccess: function (labels) {
                    var result = {
                        labels: []
                    };
                    if (labels) {
                        for (var i = 0; i < labels.size(); i++) {
                            var label = labels.get(i);
                            result.labels.push({
                                text: label.getText(),
                                confidence: label.getConfidence()
                            });
                        }
                    }
                    resolve(result);
                    firebaseVisionAutoMLImageLabeler_1.close();
                }
            });
            var onFailureListener = new com.google.android.gms.tasks.OnFailureListener({
                onFailure: function (exception) { return reject(exception.getMessage()); }
            });
            firebaseVisionAutoMLImageLabeler_1
                .processImage(getImage(options))
                .addOnSuccessListener(onSuccessListener)
                .addOnFailureListener(onFailureListener);
        }
        catch (ex) {
            console.log("Error in firebase.mlkit.labelImageOnDevice: " + ex);
            reject(ex);
        }
    });
}
exports.labelImage = labelImage;
function getImage(options) {
    var image = options.image instanceof image_source_1.ImageSource ? options.image.android : options.image.imageSource.android;
    return com.google.firebase.ml.vision.common.FirebaseVisionImage.fromBitmap(image);
}
