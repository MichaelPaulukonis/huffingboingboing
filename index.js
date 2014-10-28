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

var headlinesFromStatic = function() {
    var headlines = [
	{ name: 'Music video: John Cale\'s new song for Lou Reed',
	  url: 'http://boingboing.net/page/1http://boingboing.net/2014/10/28/music-video-john-cales-new.html' },
	{ name: 'Who is Gamergate? Analysis of 316K tweets',
	  url: 'http://boingboing.net/page/1http://boingboing.net/2014/10/28/who-is-gamergate-analysis-of.html' },
	{ name: 'Thousands of Americans got sub-broadband ISP service, thanks to telcoms shenanigans',
	  url: 'http://boingboing.net/page/1http://boingboing.net/2014/10/28/thousands-of-americans-got-sub.html' },
	{ name: 'Ridley Scott to produce miniseries on rocket scientist, occultist Jack Parsons',
	  url: 'http://boingboing.net/page/1http://boingboing.net/2014/10/28/ridley-scott-to-produce-minise.html' },
	{ name: 'Krs-One was a Teenage Drug Courier',
	  url: 'http://boingboing.net/page/1http://boingboing.net/2014/10/28/krs-one-was-a-teenage-drug-cou.html' },
	{ name: 'Circling the globe with the mid-20th century\'s most brilliant matchbox art',
	  url: 'http://boingboing.net/page/1http://boingboing.net/2014/10/28/circling-the-globe-with-the-mi.html' },
	{ name: 'Video: Dock Ellis who pitched a no-hitter while on LSD',
	  url: 'http://boingboing.net/page/1http://boingboing.net/2014/10/28/video-dock-ellis-who-pitched.html' },
	{ name: 'The story of Venice\'s "gentleman thief" and an amazing art heist',
	  url: 'http://boingboing.net/page/1http://boingboing.net/2014/10/28/the-story-of-venices-gentl.html' },
	{ name: 'Putting your foot in your mouth',
	  url: 'http://boingboing.net/page/1http://boingboing.net/2014/10/28/putting-your-foot-in-your-mout.html' },
	{ name: 'Furniture from old Apple G5 towers',
	  url: 'http://boingboing.net/page/1http://boingboing.net/2014/10/28/furniture-from-old-apple-g5-to.html' },
	{ name: 'Why we love man versus nature struggles',
	  url: 'http://boingboing.net/page/1http://boingboing.net/2014/10/28/themartian.html' },
	{ name: 'The Peripheral: William Gibson vs William Gibson',
	  url: 'http://boingboing.net/page/1http://boingboing.net/2014/10/28/the-peripheral-william-gibson.html' },
	{ name: 'Our Magic, a documentary about magic by magicians',
	  url: 'http://boingboing.net/page/1http://boingboing.net/2014/10/28/our-magic-a-documentary-about.html' },
	{ name: 'Oh joy! Oh Joy Sex Toy is a book!',
	  url: 'http://boingboing.net/page/1http://boingboing.net/2014/10/27/oh-joy-oh-joy-sex-toy-is-a-bo.html' },
	{ name: 'Suitsy: The business suit onesie',
	  url: 'http://boingboing.net/page/1http://boingboing.net/2014/10/27/suitsy-the-business-suit-ones.html' }
    ];

    var dfd = new _.Deferred().resolve(headlines);
    // The function returns a promise, and the promise resolves to the array of headlines.
    return dfd.promise();
};

// ### Screen Scraping
var headlinesFromPage1 = function() {
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
};


// headline as string
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

    // let punctuation and possessives remain
    // TODO: unit-tests for various errors we encounter
    // Venice's := Venice
    // VENICE'S := VENICE
    // etc.
    var removals = ['"', ':', '-', ',', '\'s$'];

    for (var i = 0 ; i < removals.length; i++) {
	var r = removals[i];
	word = word.replace(new RegExp(r, 'i'), '');
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

var getPOSarray = function(headline, pos) {

    var parts = [];
    var tokens = nlp.pos(headline)[0].tokens;

    for (var i = 0; i < tokens.length; i++) {
        var t = tokens[i];
	if (t.pos.tag === pos) {
	    parts.push(stripWord(t.text));
	}
    }

    return parts;

};


// simple strategy - replace all the nouns in one sentence with the nouns from another
// It's something.
var posReplacement = function(h1, h2, pos) {

    var sent = h1;

    var words1 = getPOSarray(h1, pos);
    var words2 = getPOSarray(h2, pos);

    var longest = ( words1.length > words2.length ? words1.length : words2.length);

    // the shortest list needs to be modded against its length
    for (var i = 0; i < longest; i++) {
	// console.log('replace: ' + words1[i % words1.length] + ' with: ' +  words2[i % words2.length]);
	sent = sent.replace(new RegExp('\\b' + words1[i % words1.length] + '\\b', 'i'), words2[i % words2.length]);
    }

    return sent;

};

// loop through the second (smaller) array in reverse.
// uh. wheeee?
var replacementPos = function(h1, h2, pos) {

    var sent = h1;

    var words1 = getPOSarray(h1, pos);
    var words2 = getPOSarray(h2, pos);

    var longest = ( words1.length > words2.length ? words1.length : words2.length);

    // ugh ugh ugh ugh ugh
    var w2i = words2.length;
    // the shortest list needs to be modded against its length
    for (var i = 0; i < longest; i++) {
	w2i--;
	if (w2i < 0) w2i = words2.length - 1;
	var invert = w2i;
	// console.log('i: ' + i + ' invert: ' + invert);
	sent = sent.replace(new RegExp('\\b' + words1[i % words1.length] + '\\b', 'i'), words2[invert]);
    }

    return sent;

};

// input: two headlines as strings
// output: a strategy method
var getStrategy = function(h1, h2) {
    var strategy;
    strategy = (Math.random() > 0.5) ? posReplacement : replacementPos;
    return strategy;
};


// This won't work for BoingBoing, since there are no "Categories" where the category is in the headline
// hrm.
// just chop the two headlines into pieces?
// this will be... stupid.
function tweet() {

    getHeadlines().then(function(headlines) {

	// console.log(headlines);

	var h1 = pickRemove(headlines);
	var h2 = pickRemove(headlines);

	// still having trouble w/ quotes:
	// h1: "Kitty help," a photo shared in the Boing Boing Flickr Pool
	// h2:Denim maintenance thread
	// replaced: "Kitty Denim a maintenance thread shared in the Boing Boing Flickr Pool

	console.log('\nh1: ' + h1.name + '\nh2:' + h2.name);

	var strategy = getStrategy(h1.name, h2.name);;

	// NOPE: this is a step in the right direction, but not the right step
	console.log(strategy(h1.name, h2.name, 'NN'));

	// console.log("reversenoun: " + replacementPos(h1.name, h2.name));
	// console.log("noun normal: " + posReplacement(h1.name, h2.name));

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

var getHeadlines = headlinesFromPage1;
// var getHeadlines = headlinesFromStatic; // a static method for testing

// var h1 = {name: ' Ridley Scott to produce miniseries on rocket scientist, occultist Jack Parsons' };
// var h2 = { name: 'Circling the globe with the mid-20th century\'s most brilliant matchbox art' };

// console.log('\nh1: ' + h1.name + '\nh2:' + h2.name);

// console.log("reversenoun: " + replacementPos(h1.name, h2.name));
// console.log("noun normal: " + posReplacement(h1.name, h2.name));

// return;

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
