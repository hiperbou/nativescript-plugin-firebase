"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function suggestReplies(options) {
    return new Promise(function (resolve, reject) {
        try {
            var naturalLanguage = FIRNaturalLanguage.naturalLanguage();
            var smartReply = naturalLanguage.smartReply();
            var conversation_1 = NSMutableArray.new();
            options.conversation.forEach(function (m) { return conversation_1.addObject(FIRTextMessage.alloc().initWithTextTimestampUserIDIsLocalUser(m.text, m.timestamp, m.userId, m.localUser)); });
            smartReply.suggestRepliesForMessagesCompletion(conversation_1, function (result, error) {
                if (error) {
                    reject(error.localizedDescription);
                }
                else if (!result) {
                    reject("No results");
                }
                else if (result.status === 1) {
                    reject("Unsupported language");
                }
                else if (result.status === 2) {
                    reject("No reply");
                }
                else if (result.status === 0) {
                    var suggestions = [];
                    for (var i = 0; i < result.suggestions.count; i++) {
                        var s = result.suggestions.objectAtIndex(i);
                        suggestions.push(s.text);
                    }
                    resolve(suggestions);
                }
                else {
                    reject();
                }
            });
        }
        catch (ex) {
            console.log("Error in firebase.mlkit.suggestReplies: " + ex);
            reject(ex);
        }
    });
}
exports.suggestReplies = suggestReplies;
