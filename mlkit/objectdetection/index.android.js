"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var image_source_1 = require("tns-core-modules/image-source");
var objectdetection_common_1 = require("./objectdetection-common");
var MLKitObjectDetection = (function (_super) {
    __extends(MLKitObjectDetection, _super);
    function MLKitObjectDetection() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    MLKitObjectDetection.prototype.createDetector = function () {
        return getDetector(this.classify, this.multiple);
    };
    MLKitObjectDetection.prototype.createSuccessListener = function () {
        var _this = this;
        return new com.google.android.gms.tasks.OnSuccessListener({
            onSuccess: function (objects) {
                console.log(">> onSuccess @ " + new Date().getTime() + ", objects: " + objects.size());
                if (objects.size() === 0)
                    return;
                var result = {
                    objects: []
                };
                var image = _this.lastVisionImage && _this.lastVisionImage.getBitmap ? _this.lastVisionImage.getBitmap() : null;
                for (var i = 0; i < objects.size(); i++) {
                    result.objects.push(getMLKitObjectDetectionResultItem(objects.get(i), image));
                }
                _this.notify({
                    eventName: MLKitObjectDetection.scanResultEvent,
                    object: _this,
                    value: result
                });
            }
        });
    };
    return MLKitObjectDetection;
}(objectdetection_common_1.MLKitObjectDetection));
exports.MLKitObjectDetection = MLKitObjectDetection;
function getDetector(classify, multiple) {
    var builder = new com.google.firebase.ml.vision.objects.FirebaseVisionObjectDetectorOptions.Builder()
        .setDetectorMode(com.google.firebase.ml.vision.objects.FirebaseVisionObjectDetectorOptions.SINGLE_IMAGE_MODE);
    if (classify) {
        builder.enableClassification();
    }
    if (multiple) {
        builder.enableMultipleObjects();
    }
    return com.google.firebase.ml.vision.FirebaseVision.getInstance().getOnDeviceObjectDetector(builder.build());
}
function detectObjects(options) {
    return new Promise(function (resolve, reject) {
        try {
            var firebaseObjectDetector_1 = getDetector(options.classify, options.multiple);
            var image_1 = options.image instanceof image_source_1.ImageSource ? options.image.android : options.image.imageSource.android;
            var firImage = com.google.firebase.ml.vision.common.FirebaseVisionImage.fromBitmap(image_1);
            var onSuccessListener = new com.google.android.gms.tasks.OnSuccessListener({
                onSuccess: function (objects) {
                    var result = {
                        objects: []
                    };
                    if (objects) {
                        for (var i = 0; i < objects.size(); i++) {
                            result.objects.push(getMLKitObjectDetectionResultItem(objects.get(i), image_1));
                        }
                    }
                    resolve(result);
                    firebaseObjectDetector_1.close();
                }
            });
            var onFailureListener = new com.google.android.gms.tasks.OnFailureListener({
                onFailure: function (exception) { return reject(exception.getMessage()); }
            });
            firebaseObjectDetector_1
                .processImage(firImage)
                .addOnSuccessListener(onSuccessListener)
                .addOnFailureListener(onFailureListener);
        }
        catch (ex) {
            console.log("Error in firebase.mlkit.labelImageOnDevice: " + ex);
            reject(ex);
        }
    });
}
exports.detectObjects = detectObjects;
function getMLKitObjectDetectionResultItem(obj, image) {
    return {
        id: obj.getTrackingId() ? obj.getTrackingId().intValue() : undefined,
        confidence: obj.getClassificationConfidence() ? obj.getClassificationConfidence().doubleValue() : undefined,
        category: objectdetection_common_1.ObjectDetectionCategory[obj.getClassificationCategory()],
        bounds: boundingBoxToBounds(obj.getBoundingBox()),
        image: !image ? null : {
            width: image.getWidth(),
            height: image.getHeight()
        }
    };
}
function getImage(options) {
    var image = options.image instanceof image_source_1.ImageSource ? options.image.android : options.image.imageSource.android;
    return com.google.firebase.ml.vision.common.FirebaseVisionImage.fromBitmap(image);
}
function boundingBoxToBounds(rect) {
    return {
        origin: {
            x: rect.left,
            y: rect.top
        },
        size: {
            width: rect.width(),
            height: rect.height()
        }
    };
}
