"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var image_source_1 = require("tns-core-modules/image-source");
var barcodescanning_common_1 = require("./barcodescanning-common");
exports.BarcodeFormat = barcodescanning_common_1.BarcodeFormat;
var application = require("tns-core-modules/application");
var gmsTasks = com.google.android.gms.tasks;
var MLKitBarcodeScanner = (function (_super) {
    __extends(MLKitBarcodeScanner, _super);
    function MLKitBarcodeScanner() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.inverseThrottle = 0;
        return _this;
    }
    MLKitBarcodeScanner.prototype.disposeNativeView = function () {
        _super.prototype.disposeNativeView.call(this);
        if (this.player) {
            this.player.release();
            this.player = undefined;
        }
    };
    MLKitBarcodeScanner.prototype.createDetector = function () {
        var formats;
        if (this.formats) {
            formats = [];
            var requestedFormats = this.formats.split(",");
            requestedFormats.forEach(function (format) { return formats.push(barcodescanning_common_1.BarcodeFormat[format.trim().toUpperCase()]); });
        }
        if (this.beepOnScan) {
            var activity = (application.android.foregroundActivity || application.android.startActivity);
            activity.setVolumeControlStream(android.media.AudioManager.STREAM_MUSIC);
            try {
                var file = application.android.context.getResources().getIdentifier("beep", "raw", application.android.context.getPackageName());
                if (file === 0) {
                    console.log("No 'beep.*' soundfile found in the resources /raw folder. There will be no audible feedback upon scanning a barcode.");
                }
                else {
                    this.player = new android.media.MediaPlayer();
                    var fileDescriptor = application.android.context.getResources().openRawResourceFd(file);
                    try {
                        this.player.setDataSource(fileDescriptor.getFileDescriptor(), fileDescriptor.getStartOffset(), fileDescriptor.getLength());
                    }
                    finally {
                        fileDescriptor.close();
                    }
                    this.player.setAudioStreamType(android.media.AudioManager.STREAM_MUSIC);
                    this.player.setLooping(false);
                    this.player.setVolume(0.10, 0.10);
                    this.player.prepare();
                }
            }
            catch (e) {
                console.log(e);
                this.player.release();
                this.player = undefined;
            }
        }
        return getBarcodeDetector(formats);
    };
    MLKitBarcodeScanner.prototype.createSuccessListener = function () {
        var _this = this;
        return new gmsTasks.OnSuccessListener({
            onSuccess: function (barcodes) {
                var result = {
                    barcodes: []
                };
                if (barcodes && barcodes.size() > 0) {
                    var image = _this.lastVisionImage && _this.lastVisionImage.getBitmap ? _this.lastVisionImage.getBitmap() : null;
                    for (var i = 0; i < barcodes.size(); i++) {
                        var barcode = barcodes.get(i);
                        result.barcodes.push({
                            value: barcode.getRawValue(),
                            displayValue: barcode.getDisplayValue(),
                            format: barcodescanning_common_1.BarcodeFormat[barcode.getFormat()],
                            android: barcode,
                            bounds: boundingBoxToBounds(barcode.getBoundingBox()),
                            image: !image ? null : {
                                width: image.getWidth(),
                                height: image.getHeight()
                            }
                        });
                    }
                    if (_this.player) {
                        _this.player.start();
                    }
                }
                _this.notify({
                    eventName: MLKitBarcodeScanner.scanResultEvent,
                    object: _this,
                    value: result
                });
            }
        });
    };
    MLKitBarcodeScanner.prototype.preProcessImage = function (byteArray) {
        if (this.supportInverseBarcodes && this.inverseThrottle++ % 2 === 0) {
            return byteArray = org.nativescript.plugins.firebase.mlkit.BitmapUtil.byteArrayBitwiseNotHelper(byteArray);
        }
        return byteArray;
    };
    return MLKitBarcodeScanner;
}(barcodescanning_common_1.MLKitBarcodeScanner));
exports.MLKitBarcodeScanner = MLKitBarcodeScanner;
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
function getBarcodeDetector(formats) {
    if (formats && formats.length > 0) {
        var firebaseVisionBarcodeDetectorOptions = new com.google.firebase.ml.vision.barcode.FirebaseVisionBarcodeDetectorOptions.Builder()
            .setBarcodeFormats(formats[0], formats)
            .build();
        return com.google.firebase.ml.vision.FirebaseVision.getInstance().getVisionBarcodeDetector(firebaseVisionBarcodeDetectorOptions);
    }
    else {
        return com.google.firebase.ml.vision.FirebaseVision.getInstance().getVisionBarcodeDetector();
    }
}
function scanBarcodesOnDevice(options) {
    return new Promise(function (resolve, reject) {
        try {
            var firebaseVisionBarcodeDetector_1 = getBarcodeDetector(options.formats);
            var image_1 = options.image instanceof image_source_1.ImageSource ? options.image.android : options.image.imageSource.android;
            var firImage = com.google.firebase.ml.vision.common.FirebaseVisionImage.fromBitmap(image_1);
            var onSuccessListener = new gmsTasks.OnSuccessListener({
                onSuccess: function (barcodes) {
                    var result = {
                        barcodes: []
                    };
                    if (barcodes) {
                        for (var i = 0; i < barcodes.size(); i++) {
                            var barcode = barcodes.get(i);
                            result.barcodes.push({
                                value: barcode.getRawValue(),
                                displayValue: barcode.getDisplayValue(),
                                format: barcodescanning_common_1.BarcodeFormat[barcode.getFormat()],
                                android: barcode,
                                bounds: boundingBoxToBounds(barcode.getBoundingBox()),
                                image: {
                                    width: image_1.getWidth(),
                                    height: image_1.getHeight()
                                }
                            });
                        }
                    }
                    resolve(result);
                    firebaseVisionBarcodeDetector_1.close();
                }
            });
            var onFailureListener = new gmsTasks.OnFailureListener({
                onFailure: function (exception) { return reject(exception.getMessage()); }
            });
            firebaseVisionBarcodeDetector_1
                .detectInImage(firImage)
                .addOnSuccessListener(onSuccessListener)
                .addOnFailureListener(onFailureListener);
        }
        catch (ex) {
            console.log("Error in firebase.mlkit.scanBarcodesOnDevice: " + ex);
            reject(ex);
        }
    });
}
exports.scanBarcodesOnDevice = scanBarcodesOnDevice;
