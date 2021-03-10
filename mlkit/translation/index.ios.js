"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function ensureTranslationModelDownloaded(options) {
    return new Promise(function (resolve, reject) {
        _downloadTranslationModelIfNeeded(options)
            .then(function () { return resolve(); })
            .catch(reject);
    });
}
exports.ensureTranslationModelDownloaded = ensureTranslationModelDownloaded;
function translateText(options) {
    return new Promise(function (resolve, reject) {
        try {
            _downloadTranslationModelIfNeeded(options)
                .then(function (firTranslator) {
                firTranslator.translateTextCompletion(options.text, (function (result, error) {
                    error ? reject(error.localizedDescription) : resolve(result);
                }));
            })
                .catch(reject);
        }
        catch (ex) {
            console.log("Error in firebase.mlkit.translation.translateText: " + ex);
            reject(ex);
        }
    });
}
exports.translateText = translateText;
function _downloadTranslationModelIfNeeded(options) {
    return new Promise(function (resolve, reject) {
        try {
            var firTranslatorOptions = FIRTranslatorOptions.alloc().initWithSourceLanguageTargetLanguage(FIRTranslateLanguageForLanguageCode(options.from), FIRTranslateLanguageForLanguageCode(options.to));
            var nl = FIRNaturalLanguage.naturalLanguage();
            var firTranslator_1 = nl.translatorWithOptions(firTranslatorOptions);
            var firModelDownloadConditions = FIRModelDownloadConditions.alloc().initWithAllowsCellularAccessAllowsBackgroundDownloading(false, true);
            firTranslator_1.downloadModelIfNeededWithConditionsCompletion(firModelDownloadConditions, function (error) {
                error ? reject(error.localizedDescription) : resolve(firTranslator_1);
            });
        }
        catch (ex) {
            console.log("Error downloading translation model: " + ex);
            reject(ex);
        }
    });
}
