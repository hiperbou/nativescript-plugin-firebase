"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var application = require("tns-core-modules/application");
var utils = require("tns-core-modules/utils/utils");
var mlkit_cameraview_common_1 = require("./mlkit-cameraview-common");
var ActivityCompatClass = useAndroidX() ? global.androidx.core.app.ActivityCompat : android.support.v4.app.ActivityCompat;
var ContentPackageName = useAndroidX() ? global.androidx.core.content : android.support.v4.content;
var CAMERA_PERMISSION_REQUEST_CODE = 502;
var SizePair = (function () {
    function SizePair() {
    }
    return SizePair;
}());
function useAndroidX() {
    return global.androidx && global.androidx.appcompat;
}
var MLKitCameraView = (function (_super) {
    __extends(MLKitCameraView, _super);
    function MLKitCameraView() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.bytesToByteBuffer = new Map();
        _this.pendingFrameData = null;
        return _this;
    }
    MLKitCameraView.prototype.disposeNativeView = function () {
        _super.prototype.disposeNativeView.call(this);
        this.surfaceView = null;
        if (this.camera != null) {
            application.off("orientationChanged");
            this.camera.stopPreview();
            this.camera.setPreviewCallbackWithBuffer(null);
            try {
                this.camera.setPreviewDisplay(null);
            }
            catch (e) {
                console.log("Error cleaning up the ML Kit camera (you can probably ignore this): " + e);
            }
            this.camera.release();
            this.camera = null;
        }
        this.bytesToByteBuffer.clear();
        if (this.detector) {
            this.detector.close();
            this.detector = undefined;
        }
        this.lastVisionImage = null;
        this.pendingFrameData = null;
    };
    MLKitCameraView.prototype.createNativeView = function () {
        var _this = this;
        var nativeView = _super.prototype.createNativeView.call(this);
        if (this.hasCamera()) {
            if (this.wasCameraPermissionGranted()) {
                this.initView(nativeView);
            }
            else {
                var permissionCb_1 = function (args) {
                    if (args.requestCode === CAMERA_PERMISSION_REQUEST_CODE) {
                        application.android.off(application.AndroidApplication.activityRequestPermissionsEvent, permissionCb_1);
                        for (var i = 0; i < args.permissions.length; i++) {
                            if (args.grantResults[i] === android.content.pm.PackageManager.PERMISSION_DENIED) {
                                console.log("Camera permission denied");
                                return;
                            }
                        }
                        _this.initView(nativeView);
                    }
                };
                application.android.on(application.AndroidApplication.activityRequestPermissionsEvent, permissionCb_1);
                ActivityCompatClass.requestPermissions(application.android.foregroundActivity || application.android.startActivity, [android.Manifest.permission.CAMERA], CAMERA_PERMISSION_REQUEST_CODE);
            }
        }
        else {
            console.log("There's no Camera on this device :(");
        }
        return nativeView;
    };
    MLKitCameraView.prototype.initNativeView = function () {
        var _this = this;
        _super.prototype.initNativeView.call(this);
        application.on("resume", function (arg) { return _this.runCamera(); });
    };
    MLKitCameraView.prototype.hasCamera = function () {
        return !!utils.ad
            .getApplicationContext()
            .getPackageManager()
            .hasSystemFeature("android.hardware.camera");
    };
    MLKitCameraView.prototype.wasCameraPermissionGranted = function () {
        var hasPermission = android.os.Build.VERSION.SDK_INT < 23;
        if (!hasPermission) {
            hasPermission = android.content.pm.PackageManager.PERMISSION_GRANTED ===
                ContentPackageName.ContextCompat.checkSelfPermission(utils.ad.getApplicationContext(), android.Manifest.permission.CAMERA);
        }
        return hasPermission;
    };
    MLKitCameraView.prototype.initView = function (nativeView) {
        this.surfaceView = new android.view.SurfaceView(utils.ad.getApplicationContext());
        nativeView.addView(this.surfaceView);
        this.runCamera();
    };
    MLKitCameraView.prototype.runCamera = function () {
        var _this = this;
        setTimeout(function () {
            if (!_this.surfaceView) {
                return;
            }
            try {
                var surfaceHolder = _this.surfaceView.getHolder();
                var cameraFacingRequested = _this.preferFrontCamera ? android.hardware.Camera.CameraInfo.CAMERA_FACING_FRONT : android.hardware.Camera.CameraInfo.CAMERA_FACING_BACK;
                var cameraInfo = new android.hardware.Camera.CameraInfo();
                var requestedCameraId_1 = android.hardware.Camera.CameraInfo.CAMERA_FACING_BACK;
                for (var i = 0; i < android.hardware.Camera.getNumberOfCameras(); ++i) {
                    android.hardware.Camera.getCameraInfo(i, cameraInfo);
                    if (cameraInfo.facing === cameraFacingRequested) {
                        requestedCameraId_1 = i;
                        break;
                    }
                }
                _this.camera = android.hardware.Camera.open(requestedCameraId_1);
                var sizePair = _this.selectSizePair(_this.camera, 1400, 1200);
                if (!sizePair) {
                    console.log("Could not find suitable preview size.");
                    return;
                }
                var pictureSize = sizePair.pictureSize;
                var previewSize_1 = sizePair.previewSize;
                var parameters_1 = _this.camera.getParameters();
                if (pictureSize) {
                    parameters_1.setPictureSize(pictureSize.width, pictureSize.height);
                }
                parameters_1.setPreviewSize(previewSize_1.width, previewSize_1.height);
                parameters_1.setPreviewFormat(android.graphics.ImageFormat.NV21);
                application.off("orientationChanged");
                application.on("orientationChanged", function () {
                    _this.setRotation(_this.camera, parameters_1, requestedCameraId_1);
                    setTimeout(function () {
                        _this.fixStretch(previewSize_1);
                        _this.setMetadata(previewSize_1);
                    }, 700);
                });
                _this.setRotation(_this.camera, parameters_1, requestedCameraId_1);
                _this.fixStretch(previewSize_1);
                if (parameters_1.getSupportedFocusModes().contains(android.hardware.Camera.Parameters.FOCUS_MODE_CONTINUOUS_VIDEO)) {
                    parameters_1.setFocusMode(android.hardware.Camera.Parameters.FOCUS_MODE_CONTINUOUS_VIDEO);
                }
                if (_this.torchOn) {
                    if (parameters_1.getSupportedFlashModes() && parameters_1.getSupportedFlashModes().contains(android.hardware.Camera.Parameters.FLASH_MODE_TORCH)) {
                        parameters_1.setFlashMode(android.hardware.Camera.Parameters.FLASH_MODE_TORCH);
                    }
                }
                _this.camera.setParameters(parameters_1);
                _this.detector = _this.createDetector();
                var onSuccessListener_1 = _this.createSuccessListener();
                var onFailureListener_1 = _this.createFailureListener();
                _this.setMetadata(previewSize_1);
                var throttle_1 = 0;
                _this.camera.setPreviewCallbackWithBuffer(new android.hardware.Camera.PreviewCallback({
                    onPreviewFrame: function (byteArray, camera) {
                        if (_this.pendingFrameData !== null) {
                            camera.addCallbackBuffer(_this.pendingFrameData.array());
                            _this.pendingFrameData = null;
                        }
                        if (!_this.bytesToByteBuffer.has(byteArray)) {
                            console.log("Skipping frame");
                            return;
                        }
                        byteArray = _this.preProcessImage(byteArray);
                        _this.pendingFrameData = _this.bytesToByteBuffer.get(byteArray);
                        if (throttle_1++ % _this.processEveryNthFrame !== 0) {
                            return;
                        }
                        var data = _this.pendingFrameData;
                        if (_this.detector.processImage) {
                            _this.lastVisionImage = com.google.firebase.ml.vision.common.FirebaseVisionImage.fromByteBuffer(data, _this.metadata);
                            _this.detector
                                .processImage(_this.lastVisionImage)
                                .addOnSuccessListener(onSuccessListener_1)
                                .addOnFailureListener(onFailureListener_1);
                        }
                        else if (_this.detector.detectInImage) {
                            _this.lastVisionImage = com.google.firebase.ml.vision.common.FirebaseVisionImage.fromByteBuffer(data, _this.metadata);
                            _this.detector
                                .detectInImage(_this.lastVisionImage)
                                .addOnSuccessListener(onSuccessListener_1)
                                .addOnFailureListener(onFailureListener_1);
                        }
                        else {
                            _this.runDetector(data, previewSize_1.width, previewSize_1.height);
                        }
                    }
                }));
                _this.camera.addCallbackBuffer(_this.createPreviewBuffer(previewSize_1));
                _this.camera.addCallbackBuffer(_this.createPreviewBuffer(previewSize_1));
                _this.camera.addCallbackBuffer(_this.createPreviewBuffer(previewSize_1));
                _this.camera.addCallbackBuffer(_this.createPreviewBuffer(previewSize_1));
                _this.camera.setPreviewDisplay(surfaceHolder);
                if (!_this.pause) {
                    _this.camera.startPreview();
                }
            }
            catch (e) {
                console.log("Error in Firebase MLKit's runCamera function: " + e);
            }
        }, 500);
    };
    MLKitCameraView.prototype.setMetadata = function (previewSize) {
        this.metadata =
            new com.google.firebase.ml.vision.common.FirebaseVisionImageMetadata.Builder()
                .setFormat(com.google.firebase.ml.vision.common.FirebaseVisionImageMetadata.IMAGE_FORMAT_NV21)
                .setWidth(previewSize.width)
                .setHeight(previewSize.height)
                .setRotation(this.rotation)
                .build();
    };
    MLKitCameraView.prototype.fixStretch = function (previewSize) {
        var measuredWidth = this.surfaceView.getMeasuredWidth();
        var measuredHeight = this.surfaceView.getMeasuredHeight();
        var scale = previewSize.width / previewSize.height;
        var invertedScale = previewSize.height / previewSize.width;
        var measuredScale = measuredWidth / measuredHeight;
        var scaleX = 1, scaleY = 1;
        if (this.rotation == 1 || this.rotation == 3) {
            if (measuredScale <= scale) {
                scaleY = (measuredWidth * scale) / measuredHeight;
            }
            else {
                scaleX = (measuredHeight * scale) / measuredWidth;
            }
        }
        else {
            if (measuredScale >= invertedScale) {
                scaleY = (measuredWidth * invertedScale) / measuredHeight;
            }
            else {
                scaleX = (measuredHeight * invertedScale) / measuredWidth;
            }
        }
        var correction = scaleX / scaleY > 1 ? scaleX / scaleY : 1;
        this.surfaceView.setScaleX(scaleX * correction);
        this.surfaceView.setScaleY(scaleY * correction);
    };
    MLKitCameraView.prototype.updateTorch = function () {
        if (this.camera) {
            var parameters = this.camera.getParameters();
            parameters.setFlashMode(this.torchOn ? android.hardware.Camera.Parameters.FLASH_MODE_TORCH : android.hardware.Camera.Parameters.FLASH_MODE_OFF);
            this.camera.setParameters(parameters);
        }
    };
    MLKitCameraView.prototype.pauseScanning = function () {
        if (this.camera != null) {
            this.camera.stopPreview();
        }
    };
    MLKitCameraView.prototype.resumeScanning = function () {
        this.runCamera();
    };
    MLKitCameraView.prototype.runDetector = function (imageByteBuffer, width, height) {
        throw new Error("No custom detector implemented for detector " + this.detector + ", so 'runDetector' can't do its thing");
    };
    MLKitCameraView.prototype.createFailureListener = function () {
        return new com.google.android.gms.tasks.OnFailureListener({
            onFailure: function (exception) { return console.log(exception.getMessage()); }
        });
    };
    MLKitCameraView.prototype.generateValidPreviewSizeList = function (camera) {
        var parameters = camera.getParameters();
        var supportedPreviewSizes = parameters.getSupportedPreviewSizes();
        var supportedPictureSizes = parameters.getSupportedPictureSizes();
        var validPreviewSizes = [];
        for (var i = 0; i < supportedPreviewSizes.size(); i++) {
            var previewSize = supportedPreviewSizes.get(i);
            var previewAspectRatio = previewSize.width / previewSize.height;
            for (var j = 0; j < supportedPictureSizes.size(); j++) {
                var pictureSize = supportedPictureSizes.get(j);
                var pictureAspectRatio = pictureSize.width / pictureSize.height;
                if (Math.abs(previewAspectRatio - pictureAspectRatio) < 0.01) {
                    validPreviewSizes.push({ previewSize: previewSize, pictureSize: pictureSize });
                    break;
                }
            }
        }
        if (validPreviewSizes.length === 0) {
            console.log("No preview sizes have a corresponding same-aspect-ratio picture size");
            for (var i = 0; i < supportedPreviewSizes.size(); i++) {
                var previewSize = supportedPreviewSizes.get(i);
                validPreviewSizes.push({ previewSize: previewSize, pictureSize: null });
            }
        }
        return validPreviewSizes;
    };
    MLKitCameraView.prototype.selectSizePair = function (camera, desiredWidth, desiredHeight) {
        var validPreviewSizes = this.generateValidPreviewSizeList(camera);
        var selectedPair = null;
        var minDiff = java.lang.Integer.MAX_VALUE;
        for (var i = 0; i < validPreviewSizes.length; i++) {
            var sizePair = validPreviewSizes[i];
            var size = sizePair.previewSize;
            var diff = Math.abs(size.width - desiredWidth) + Math.abs(size.height - desiredHeight);
            if (diff < minDiff) {
                selectedPair = sizePair;
                minDiff = diff;
            }
        }
        return selectedPair;
    };
    MLKitCameraView.prototype.createPreviewBuffer = function (previewSize) {
        var bitsPerPixel = android.graphics.ImageFormat.getBitsPerPixel(android.graphics.ImageFormat.NV21);
        var sizeInBits = previewSize.height * previewSize.width * bitsPerPixel;
        var bufferSize = Math.ceil(sizeInBits / 8.0) + 1;
        var byteArray = Array.create('byte', bufferSize);
        var buffer = java.nio.ByteBuffer.wrap(byteArray);
        if (!buffer.hasArray() || (buffer.array() !== byteArray)) {
            console.log("Failed to create valid buffer for camera source.");
        }
        else {
            this.bytesToByteBuffer.set(byteArray, buffer);
            return byteArray;
        }
    };
    MLKitCameraView.prototype.setRotation = function (camera, parameters, cameraId) {
        var windowManager = (application.android.foregroundActivity || application.android.startActivity).getSystemService(android.content.Context.WINDOW_SERVICE);
        var degrees = 0;
        var deviceRotation = windowManager.getDefaultDisplay().getRotation();
        switch (deviceRotation) {
            case android.view.Surface.ROTATION_0:
                degrees = 0;
                break;
            case android.view.Surface.ROTATION_90:
                degrees = 90;
                break;
            case android.view.Surface.ROTATION_180:
                degrees = 180;
                break;
            case android.view.Surface.ROTATION_270:
                degrees = 270;
                break;
            default:
                console.log("Bad rotation value: " + deviceRotation);
        }
        var cameraInfo = new android.hardware.Camera.CameraInfo();
        android.hardware.Camera.getCameraInfo(cameraId, cameraInfo);
        var angle;
        var displayAngle;
        if (cameraInfo.facing === android.hardware.Camera.CameraInfo.CAMERA_FACING_FRONT) {
            angle = (cameraInfo.orientation + degrees) % 360;
            displayAngle = (360 - angle) % 360;
        }
        else {
            angle = (cameraInfo.orientation - degrees + 360) % 360;
            displayAngle = angle;
        }
        this.rotation = angle / 90;
        camera.setDisplayOrientation(displayAngle);
        parameters.setRotation(angle);
    };
    return MLKitCameraView;
}(mlkit_cameraview_common_1.MLKitCameraView));
exports.MLKitCameraView = MLKitCameraView;
