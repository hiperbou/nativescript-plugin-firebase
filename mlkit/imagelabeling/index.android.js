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
                    eventName: MLKitImageLabeling.scanResultEvent,
                    object: _this,
                    value: result
                });
            }
        });
    };
    return MLKitImageLabeling;
}(imagelabeling_common_1.MLKitImageLabeling));
exports.MLKitImageLabeling = MLKitImageLabeling;
function getDetector(confidenceThreshold) {
    var labelDetectorOptions = new com.google.firebase.ml.vision.label.FirebaseVisionOnDeviceImageLabelerOptions.Builder()
        .setConfidenceThreshold(confidenceThreshold)
        .build();
    return com.google.firebase.ml.vision.FirebaseVision.getInstance().getOnDeviceImageLabeler(labelDetectorOptions);
}
function labelImageOnDevice(options) {
    return new Promise(function (resolve, reject) {
        try {
            var firebaseVisionLabelDetector_1 = getDetector(options.confidenceThreshold || 0.5);
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
                    firebaseVisionLabelDetector_1.close();
                }
            });
            var onFailureListener = new com.google.android.gms.tasks.OnFailureListener({
                onFailure: function (exception) { return reject(exception.getMessage()); }
            });
            firebaseVisionLabelDetector_1
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
exports.labelImageOnDevice = labelImageOnDevice;
function labelImageCloud(options) {
    return new Promise(function (resolve, reject) {
        try {
            var cloudDetectorOptions = new com.google.firebase.ml.vision.label.FirebaseVisionCloudImageLabelerOptions.Builder()
                .setConfidenceThreshold(options.confidenceThreshold || 0.5)
                .build();
            var firebaseVisionCloudLabelDetector_1 = com.google.firebase.ml.vision.FirebaseVision.getInstance().getCloudImageLabeler(cloudDetectorOptions);
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
                    firebaseVisionCloudLabelDetector_1.close();
                }
            });
            var onFailureListener = new com.google.android.gms.tasks.OnFailureListener({
                onFailure: function (exception) { return reject(exception.getMessage()); }
            });
            firebaseVisionCloudLabelDetector_1
                .processImage(getImage(options))
                .addOnSuccessListener(onSuccessListener)
                .addOnFailureListener(onFailureListener);
        }
        catch (ex) {
            console.log("Error in firebase.mlkit.labelImageCloud: " + ex);
            reject(ex);
        }
    });
}
exports.labelImageCloud = labelImageCloud;
function getImage(options) {
    var image = options.image instanceof image_source_1.ImageSource ? options.image.android : options.image.imageSource.android;
    return com.google.firebase.ml.vision.common.FirebaseVisionImage.fromBitmap(image);
}
