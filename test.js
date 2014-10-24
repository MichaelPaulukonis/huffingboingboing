var nlp = require('nlp_compromise');


var p = nlp.pos('Make your own geometrical papercraft mask');
var tokens = p[0].tokens;

console.log('length: ' + tokens.length);

for (var i = 0; i < tokens.length; i++) {
    var t= tokens[i];
    console.log('text: ' + t.text + ' (' + t.pos.tag + ')');
}
