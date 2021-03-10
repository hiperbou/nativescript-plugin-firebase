"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function suggestReplies(options) {
    return new Promise(function (resolve, reject) {
        try {
            var conversation_1 = new java.util.ArrayList();
            options.conversation.forEach(function (m) {
                if (m.localUser) {
                    conversation_1.add(com.google.firebase.ml.naturallanguage.smartreply.FirebaseTextMessage.createForLocalUser(m.text, m.timestamp));
                }
                else {
                    conversation_1.add(com.google.firebase.ml.naturallanguage.smartreply.FirebaseTextMessage.createForRemoteUser(m.text, m.timestamp, m.userId));
                }
            });
            var smartReply = com.google.firebase.ml.naturallanguage.FirebaseNaturalLanguage.getInstance().getSmartReply();
            smartReply.suggestReplies(conversation_1)
                .addOnSuccessListener(new com.google.android.gms.tasks.OnSuccessListener({
                onSuccess: function (result) {
                    if (result.getStatus() == com.google.firebase.ml.naturallanguage.smartreply.SmartReplySuggestionResult.STATUS_NOT_SUPPORTED_LANGUAGE) {
                        reject("Unsupported language");
                    }
                    else if (result.getStatus() == com.google.firebase.ml.naturallanguage.smartreply.SmartReplySuggestionResult.STATUS_NO_REPLY) {
                        reject("No reply");
                    }
                    else if (result.getStatus() == com.google.firebase.ml.naturallanguage.smartreply.SmartReplySuggestionResult.STATUS_SUCCESS) {
                        var suggestions = [];
                        for (var i = 0; i < result.getSuggestions().size(); i++) {
                            var s = result.getSuggestions().get(i);
                            suggestions.push(s.getText());
                        }
                        resolve(suggestions);
                    }
                    else {
                        reject();
                    }
                }
            }))
                .addOnFailureListener(new com.google.android.gms.tasks.OnFailureListener({
                onFailure: function (exception) { return reject(exception.getMessage()); }
            }));
        }
        catch (ex) {
            console.log("Error in firebase.mlkit.suggestReplies: " + ex);
            reject(ex);
        }
    });
}
exports.suggestReplies = suggestReplies;
