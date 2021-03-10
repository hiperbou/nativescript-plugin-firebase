"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("tns-core-modules/file-system");
var image_source_1 = require("tns-core-modules/image-source");
var custommodel_common_1 = require("./custommodel-common");
var MLKitCustomModel = (function (_super) {
    __extends(MLKitCustomModel, _super);
    function MLKitCustomModel() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    MLKitCustomModel.prototype.createDetector = function () {
        this.modelInterpreter = getInterpreter(this.localModelFile);
        return this.modelInterpreter;
    };
    MLKitCustomModel.prototype.runDetector = function (image, onComplete) {
        var _this = this;
        var modelExpectsWidth = this.modelInputShape[1];
        var modelExpectsHeight = this.modelInputShape[2];
        var isQuantized = this.modelInputType !== "FLOAT32";
        if (!this.inputOutputOptions) {
            this.inputOutputOptions = FIRModelInputOutputOptions.new();
            var inputType = void 0;
            var arrIn_1 = NSMutableArray.new();
            this.modelInputShape.forEach(function (dim) { return arrIn_1.addObject(dim); });
            inputType = isQuantized ? 3 : 1;
            this.inputOutputOptions.setInputFormatForIndexTypeDimensionsError(0, inputType, arrIn_1);
            var arrOut = NSMutableArray.new();
            arrOut.addObject(1);
            arrOut.addObject(this.labels.length);
            this.inputOutputOptions.setOutputFormatForIndexTypeDimensionsError(0, inputType, arrOut);
        }
        var inputData;
        if (isQuantized) {
            inputData = TNSMLKitCameraView.scaledDataWithSizeByteCountIsQuantized(image, CGSizeMake(modelExpectsWidth, modelExpectsHeight), modelExpectsWidth * modelExpectsHeight * this.modelInputShape[3] * this.modelInputShape[0], isQuantized);
        }
        else {
            inputData = TNSMLKitCameraView.getInputDataWithRowsAndColumnsAndType(image, modelExpectsWidth, modelExpectsHeight, "Float32");
        }
        var inputs = FIRModelInputs.new();
        inputs.addInputError(inputData);
        this.modelInterpreter.runWithInputsOptionsCompletion(inputs, this.inputOutputOptions, function (outputs, error) {
            if (error !== null) {
                console.log(error.localizedDescription);
            }
            else if (outputs !== null) {
                var probabilities = outputs.outputAtIndexError(0)[0];
                if (_this.labels.length !== probabilities.count) {
                    console.log("The number of labels (" + _this.labels.length + ") is not equal to the interpretation result (" + probabilities.count + ")!");
                    onComplete();
                }
                else {
                    var result = {
                        result: getSortedResult(_this.labels, probabilities, _this.maxResults)
                    };
                    _this.notify({
                        eventName: MLKitCustomModel.scanResultEvent,
                        object: _this,
                        value: result
                    });
                }
            }
            onComplete();
        });
    };
    MLKitCustomModel.prototype.createSuccessListener = function () {
        var _this = this;
        return function (outputs, error) {
            if (error !== null) {
                console.log(error.localizedDescription);
            }
            else if (outputs !== null) {
                var result = {
                    result: []
                };
                console.log(">>> outputs: " + outputs);
                _this.notify({
                    eventName: MLKitCustomModel.scanResultEvent,
                    object: _this,
                    value: result
                });
            }
        };
    };
    MLKitCustomModel.prototype.rotateRecording = function () {
        return false;
    };
    return MLKitCustomModel;
}(custommodel_common_1.MLKitCustomModel));
exports.MLKitCustomModel = MLKitCustomModel;
function getInterpreter(localModelFile) {
    if (localModelFile) {
        var localModelFilePath = void 0;
        if (localModelFile.indexOf("~/") === 0) {
            localModelFilePath = fs.knownFolders.currentApp().path + localModelFile.substring(1);
        }
        else {
            localModelFilePath = NSBundle.mainBundle.pathForResourceOfType(localModelFile.substring(0, localModelFile.lastIndexOf(".")), localModelFile.substring(localModelFile.lastIndexOf(".") + 1));
        }
        var localModel = FIRCustomLocalModel.alloc().initWithModelPath(localModelFilePath);
        if (localModel) {
            return FIRModelInterpreter.modelInterpreterForLocalModel(localModel);
        }
        else {
            console.log("No (cloud or local) model was successfully loaded.");
        }
    }
    return null;
}
function useCustomModel(options) {
    return new Promise(function (resolve, reject) {
        try {
            var image = options.image instanceof image_source_1.ImageSource ? options.image.ios : options.image.imageSource.ios;
            var isQuant = options.modelInput[0].type !== "FLOAT32";
            var inputData = void 0;
            if (isQuant) {
                inputData = TNSMLKitCameraView.scaledDataWithSizeByteCountIsQuantized(image, CGSizeMake(options.modelInput[0].shape[1], options.modelInput[0].shape[2]), options.modelInput[0].shape[1] * options.modelInput[0].shape[2] * options.modelInput[0].shape[3] * options.modelInput[0].shape[0], options.modelInput[0].type !== "FLOAT32");
            }
            else {
                inputData = TNSMLKitCameraView.getInputDataWithRowsAndColumnsAndType(image, options.modelInput[0].shape[1], options.modelInput[0].shape[2], "Float32");
            }
            var inputs = FIRModelInputs.new();
            inputs.addInputError(inputData);
            var inputOptions_1 = FIRModelInputOutputOptions.new();
            var inputType_1;
            options.modelInput.forEach(function (dimensionAndType, i) {
                var arrIn = NSMutableArray.new();
                dimensionAndType.shape.forEach(function (dim) { return arrIn.addObject(dim); });
                inputType_1 = dimensionAndType.type === "FLOAT32" ? 1 : 3;
                inputOptions_1.setInputFormatForIndexTypeDimensionsError(i, inputType_1, arrIn);
            });
            var labels_1;
            if (options.labelsFile.indexOf("~/") === 0) {
                labels_1 = custommodel_common_1.getLabelsFromAppFolder(options.labelsFile);
            }
            else {
                var labelsFile = NSBundle.mainBundle.pathForResourceOfType(options.labelsFile.substring(0, options.labelsFile.lastIndexOf(".")), options.labelsFile.substring(options.labelsFile.lastIndexOf(".") + 1));
                labels_1 = custommodel_common_1.getLabelsFromFile(labelsFile);
            }
            var arrOut = NSMutableArray.new();
            arrOut.addObject(1);
            arrOut.addObject(labels_1.length);
            inputOptions_1.setOutputFormatForIndexTypeDimensionsError(0, inputType_1, arrOut);
            var modelInterpreter = getInterpreter(options.localModelFile);
            modelInterpreter.runWithInputsOptionsCompletion(inputs, inputOptions_1, function (outputs, error) {
                if (error !== null) {
                    reject(error.localizedDescription);
                }
                else if (outputs !== null) {
                    var probabilities = outputs.outputAtIndexError(0)[0];
                    if (labels_1.length !== probabilities.count) {
                        console.log("The number of labels in " + options.labelsFile + " (" + labels_1.length + ") is not equal to the interpretation result (" + probabilities.count + ")!");
                        return;
                    }
                    var result = {
                        result: getSortedResult(labels_1, probabilities, options.maxResults)
                    };
                    resolve(result);
                }
            });
        }
        catch (ex) {
            console.log("Error in firebase.mlkit.useCustomModel: " + ex);
            reject(ex);
        }
    });
}
exports.useCustomModel = useCustomModel;
function getSortedResult(labels, probabilities, maxResults) {
    if (maxResults === void 0) { maxResults = 5; }
    var result = [];
    labels.forEach(function (text, i) { return result.push({ text: text, confidence: probabilities.objectAtIndex(i) }); });
    result.sort(function (a, b) { return a.confidence < b.confidence ? 1 : (a.confidence === b.confidence ? 0 : -1); });
    if (result.length > maxResults) {
        result.splice(maxResults);
    }
    var softmaxScale = 1.0 / 256.0;
    result.map(function (r) { return r.confidence = NSNumber.numberWithFloat(softmaxScale * r.confidence); });
    return result;
}
