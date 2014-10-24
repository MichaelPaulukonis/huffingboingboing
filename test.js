var nlp = require('nlp_compromise');

// crude fix for the encoding problems I've encountered
// not sure what the best way to do this is. :-(
var clean = function(text) {
    text = text.replace(' ', ' ').replace('’', "\'");
    text = text.replace('“', '"').replace('”', '"');
    return text;
};

// takes in headline as a string
var dumpInfo = function(headline) {

    console.log('\n\nheadline: ' + headline);

    // so. doesn't always work, if we don't have a named entity.
    // fail: "Make you own geometrical papercraft mask"`
    var p = nlp.pos(headline);
    var tokens = p[0].tokens;

    for (var i = 0; i < tokens.length; i++) {
        var t = tokens[i];
        console.log('text: ' + t.text + ' (' + t.pos.tag + ')');
    }

    var nn = getNNarray(headline);
    console.log(nn.join(' -  '));
};

var stripWord = function(word) {

    var removals = ['"', ':', '-', ','];

    for (var i = 0 ; i < removals.length; i++) {
	var r = removals[i];
	word = word.replace(r, '');
    }

    return word;
};

// headline as a string
var getNNarray = function(headline) {

    var nn = [];
    var tokens = nlp.pos(headline)[0].tokens;

    for (var i = 0; i < tokens.length; i++) {
        var t = tokens[i];
	if (t.pos.tag === 'NN') {
	    nn.push(stripWord(t.text));
	}
    }

    return nn;

};

// simple strategy - replace all the nouns in one sentence with the nouns from another
// It's something.
var strategy1 = function(h1, h2) {

    var sent = h1;

    var nn1 = getNNarray(h1);
    var nn2 = getNNarray(h2);
    var nouns1 = nn1;
    var nouns2 = nn2;

    // if (nn1.length > nn2.length) {
    // 	sent = h2;
    // 	nouns1 = nn2;
    // 	nouns2 = nn1;
    // }

    var limit = ( nn1.length < nn2.length ? nn1.length : nn2.length);

    for (var i = 0; i < limit; i++) {
	sent = sent.replace(nouns1[i], nouns2[i]);
    }

    return sent;

};

var strategy2 = function(h1, h2) {

    var sent = h1;

    var nn1 = getNNarray(h1);
    var nn2 = getNNarray(h2);
    var nouns1 = nn1;
    var nouns2 = nn2;

    // if (nn1.length > nn2.length) {
    // 	sent = h2;
    // 	nouns1 = nn2;
    // 	nouns2 = nn1;
    // }

    var shortest = ( nn1.length < nn2.length ? nn1.length : nn2.length);
    var longest = ( nn1.length > nn2.length ? nn1.length : nn2.length);
    console.log('nn1: ' + nn1.length + ' nn2: ' + nn2.length);
    console.log('longest: ' + longest);

    if (longest > nouns1.length) {
	console.log('will loop nouns');
	console.log(nouns1.join(':'));
	console.log(nouns2.join(':'));
    }

    // the shortest list needs to be modded against its length
    for (var i = 0; i < longest; i++) {
	console.log('replace "' + nouns1[i % nouns1.length] + '" with "' + nouns2[i % nouns2.length] + '"');
	sent = sent.replace(nouns1[i % nouns1.length] , nouns2[i % nouns2.length]);
    }

    return sent;

};

// This won't work for BoingBoing, since there are no "Categories" where the category is in the headline
// hrm.
// just chop the two headlines into pieces?
// this will be... stupid.
function tweet() {

	// still having trouble w/ quotes:
	// h1: "Kitty help," a photo shared in the Boing Boing Flickr Pool
	// h2:Denim maintenance thread
	// replaced: "Kitty Denim a maintenance thread shared in the Boing Boing Flickr Pool

    // var sent = '"Kitty help," a photo shared in the Boing Boing Flickr Pool';
    // dumpInfo(sent);

    // var nn = getNNarray(sent);
    // console.log(nn);

    // console.log(stripWord(sent));

	// console.log('\nh1: ' + h1.name + '\nh2:' + h2.name);

	// console.log("replaced: " + strategy1(h1.name, h2.name));

    var h2 = " Interviews with active people in their 80s and 90s";
    var h1 = "10 years ago, a TV flub flattened a career";

    dumpInfo(h2);

	console.log('\nh1: ' + h1 + '\nh2:' + h2);

	var strategy = strategy1;

	console.log("replaced: " + strategy(h1, h2));

}


tweet();
