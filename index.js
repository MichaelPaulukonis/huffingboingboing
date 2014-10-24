// ### Libraries and globals

// This bot works by inspecting the front page of Google News. So we need
// to use `request` to make HTTP requests, `cheerio` to parse the page using
// a jQuery-like API, `underscore.deferred` for [promises](http://otaqui.com/blog/1637/introducing-javascript-promises-aka-futures-in-google-chrome-canary/),
// and `twit` as our Twitter API library.
var request = require('request');
var cheerio = require('cheerio');
var _ = require('underscore.deferred');
var nlp = require('nlp_compromise');
// var Twit = require('twit');
// var T = new Twit(require('./config.js'));
function T() {
    function post() { }
}
// var baseUrl = 'http://news.google.com';
var baseUrl = 'http://boingboing.net/page/1';

// ### Utility Functions
var pick = function(arr) {
    return arr[Math.floor(Math.random()*arr.length)];
};

var pickRemove = function(arr) {
    var index = Math.floor(Math.random()*arr.length);
    return arr.splice(index,1)[0];
};

// crude fix for the encoding problems I've encountered
// not sure what the best way to do this is. :-(
var clean = function(text) {
    text = text.replace(' ', ' ').replace('’', "\'");
    text = text.replace('“', '"').replace('”', '"');
    return text;
};

// ### Screen Scraping
function getHeadlines() {
    // console.log('inside of getHeadlines()');
    var headlines = [];
    var dfd = new _.Deferred();
    request(baseUrl, function (error, response, body) {
	// console.log('inside of request');
	if (!error && response.statusCode === 200) {
	    var $ = cheerio.load(body);
	    var heads = $('h1>a');
	    // console.log('head count: ' + heads.length);

	    $('h1>a').each(function() {
		var title = $(this).text();
		// console.log(this);
		// console.log(title);
		var hl = {};
		// hl.name = this.text();
		hl.name = clean(title);
		hl.url = baseUrl + this.attr('href');
		headlines.push(hl);
	    });

	    dfd.resolve(headlines);
	}
	else {
	    // console.log('getHeadlines.else');
	    dfd.reject();
	}
    });
    // The function returns a promise, and the promise resolves to the array of headlines.
    return dfd.promise();
}


// ### Tweeting

//      Category codes:
//      w:  world
//      n:  region
//      b:  business<
//      tc: technology
//      e:  entertainment
//      s:  sports

// This is the core function that is called on a timer that initiates the @twoheadlines algorithm.
// First, we get our list of topics from the Google News sidebar.
// Then we pick-and-remove a random topic from that list.
// Next we grab a random headline available for that topic.
// If the topic itself is in the headline itself, we replace it with a new topic. (For example,
// if `topic.name` is "Miley Cyrus" and `headline` is "Miley Cyrus Wins a Grammy", then we
// get a topic from a different category of news and fill in the blank for "______ Wins a Grammy".)
// If we're unable to find a headline where we can easily find/replace, we simply try again.


var dumpInfo = function(headline) {

    console.log('\n\nheadline: ' + headline);

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
var nounreplacement = function(h1, h2) {

    var sent = h1;

    var nn1 = getNNarray(h1);
    var nn2 = getNNarray(h2);
    var nouns1 = nn1;
    var nouns2 = nn2;

    var longest = ( nn1.length > nn2.length ? nn1.length : nn2.length);

    // the shortest list needs to be modded against its length
    for (var i = 0; i < longest; i++) {
	sent = sent.replace(nouns1[i % nouns1.length] , nouns2[i % nouns2.length]);
	// console.log(nouns1[i % nouns1.length]);
	// console.log(nouns2[i % nouns1.length]);
	sent = sent.replace(new RegExp(nouns1[i % nouns1.length], 'gi'), nouns2[i % nouns2.length]);
    }

    return sent;

};

// simple strategy - replace all the nouns in one sentence with the nouns from another
// It's something.
// trouble with some invert calcs:
// (when the two arrays are the same length?)
//
// h1: 'Interstellar' VFX give new insights into black holes
// h2:Which crowdfunded privacy routers are worthy of your trust?
// i: 0 invert: 1 n2.length: 2
// i: 1 invert: 0 n2.length: 2
//
// i: 2 invert: -1 n2.length: 2
//
// reversenoun: trust? give new privacy routers into black undefined
// noun normal: privacy routers give new trust? into black privacy routers
var replacementnoun = function(h1, h2) {

    var sent = h1;

    var nn1 = getNNarray(h1);
    var nn2 = getNNarray(h2);
    var nouns1 = nn1;
    var nouns2 = nn2;

    var longest = ( nn1.length > nn2.length ? nn1.length : nn2.length);

    // the shortest list needs to be modded against its length
    for (var i = 0; i < longest; i++) {
	var invert = (nouns2.length - 1 - i) % nouns2.length;
	console.log('i: ' + i + ' invert: ' + invert + ' n2.length: ' + nouns2.length);
	sent = sent.replace(new RegExp(nouns1[i % nouns1.length], 'gi'), nouns2[invert]);
	// sent = sent.replace(nouns1[i % nouns1.length] , nouns2[invert]);
    }

    return sent;

};



// This won't work for BoingBoing, since there are no "Categories" where the category is in the headline
// hrm.
// just chop the two headlines into pieces?
// this will be... stupid.
function tweet() {

    getHeadlines().then(function(headlines) {

	var h1 = pickRemove(headlines);
	var h2 = pickRemove(headlines);

	// for (var i = 0; i < headlines.length; i++) {
	//     // console.log(headlines[i]);
	//     dumpInfo(headlines[i].name);
	// }

	// still having trouble w/ quotes:
	// h1: "Kitty help," a photo shared in the Boing Boing Flickr Pool
	// h2:Denim maintenance thread
	// replaced: "Kitty Denim a maintenance thread shared in the Boing Boing Flickr Pool


	console.log('\nh1: ' + h1.name + '\nh2:' + h2.name);

	var strategy = nounreplacement;

	console.log("reversenoun: " + replacementnoun(h1.name, h2.name));
	console.log("noun normal: " + nounreplacement(h1.name, h2.name));

	// so. this doesn't work. we will have to split apart using some other means.
	// OR - only use those sentences that DO have a named-entity in them
	// but I don't know if that will split well....
	// use the named-entity from one in the other sentence?
	// that could work.....

	// var topic = headlines.pickRemove();

	// console.log(topic);
	// getHeadlines().then(function(headline) {
	//     if (headline.indexOf(topic.name) > -1) {
	// 	getHeadlines(categoryCodes.pickRemove()).then(function(headlines) {
	// 	    var newTopic = headlines.pick();
	// 	    var newHeadline = headline.replace(topic.name, newTopic.name);
	// 	    console.log(newHeadline);
	// 	    T.post('statuses/update', { status: newHeadline }, function(err, reply) {
	// 		if (err) {
	// 		    console.log('error:', err);
	// 		}
	// 		else {
	// 		    console.log('reply:', reply);
	// 		}
	// 	    });
	// 	});
	//     }
	//     else {
	// 	console.log('couldn\'t find a headline match, trying again...');
	// 	tweet();
	//     }
	// });
    });
}


// Tweets once on initialization.
tweet();

// Tweets every 15 minutes.
setInterval(function () {
    try {
	tweet();
    }
    catch (e) {
	console.log(e);
    }
// }, 1000 * 60 * 60);
}, 5000 );
