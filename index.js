// ### Libraries and globals

// This bot works by inspecting the front page of Google News. So we need
// to use `request` to make HTTP requests, `cheerio` to parse the page using
// a jQuery-like API, `underscore.deferred` for [promises](http://otaqui.com/blog/1637/introducing-javascript-promises-aka-futures-in-google-chrome-canary/),
// and `twit` as our Twitter API library.
var request = require('request');
var cheerio = require('cheerio');
var _ = require('underscore.deferred');
var nlp = require('nlp_compromise');
var inflection = require('inflection');
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
	  url: 'http://boingboing.net/page/1http://boingboing.net/2014/10/27/suitsy-the-business-suit-ones.html' },
	{ name: 'The rise and fall of American Hallowe\'en costumes',
	  url: 'http://boingboing.net/page/1http://boingboing.net/2014/10/29/the-rise-and-fall-of-american.html' },
	{ name: 'Eight year old\'s incredible prize-winning scorpion photo',
	  url: 'http://boingboing.net/page/1http://boingboing.net/2014/10/29/eight-year-olds-incredible-p.html' },
	{ name: 'Verizon\'s new big budget tech-news site prohibits reporting on NSA spying or net neutrality',
	  url: 'http://boingboing.net/page/1http://boingboing.net/2014/10/29/verizons-new-big-budget-tech.html' },
	{ name: 'J. Mascis covers Mazzy Star',
	  url: 'http://boingboing.net/page/1http://boingboing.net/2014/10/29/j-mascis-covers-mazzy-star.html' },
	{ name: 'Painting with fire',
	  url: 'http://boingboing.net/page/1http://boingboing.net/2014/10/29/painting-with-fire.html' },
	{ name: 'Star Wars Costumes: The Original Trilogy',
	  url: 'http://boingboing.net/page/1http://boingboing.net/2014/10/29/star-wars-costumes-the-origin.html' },
	{ name: 'TOM THE DANCING BUG: Ernest Hemingway\'s New Typewriter',
	  url: 'http://boingboing.net/page/1http://boingboing.net/2014/10/29/tom-the-dancing-bug-ernest-he.html' },
	{ name: 'Pope: God "is not a magician" and Big Bang and evolution are A-ok',
	  url: 'http://boingboing.net/page/1http://boingboing.net/2014/10/29/pope-god-is-not-a-magician.html' },
	{ name: 'Why Are Witches Green?',
	  url: 'http://boingboing.net/page/1http://boingboing.net/2014/10/29/why-are-witches-green.html' },
	{ name: 'Obamacare: what it is, what it\'s not',
	  url: 'http://boingboing.net/page/1http://boingboing.net/2014/10/29/obamacare-what-it-is-what-it.html' },
	{ name: 'Hallowe\'en Makie mischief: Barbie freakout!',
	  url: 'http://boingboing.net/page/1http://boingboing.net/2014/10/28/halloween-makie-mischief-ba.html' },
	{ name: 'Every artist\'s "how I made it" talk, ever',
	  url: 'http://boingboing.net/page/1http://boingboing.net/2014/10/28/every-artists-how-i-made-i.html' },
	{ name: 'The Terrible Sea Lion: a social media parable',
	  url: 'http://boingboing.net/page/1http://boingboing.net/2014/10/28/the-terrible-sea-lion-a-socia.html' },
	{ name: 'Which online services will stick up for you when the copyright bullies knock?',
	  url: 'http://boingboing.net/page/1http://boingboing.net/2014/10/28/which-online-services-will-sti.html' },
	{ name: 'Political mailer includes opponent\'s SSN and driver\'s license number',
	  url: 'http://boingboing.net/page/1http://boingboing.net/2014/10/28/political-mailer-includes-oppo.html' }
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
	    console.log(headlines);
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


// this is SOMETIMES FAILING
// WHEN THE FOLLOWING COMBO OCCURS (as well as )
// h1: Why we love man versus nature struggles
// h2:Who is Gamergate? Analysis of 316K tweets
//
// NB: no error when the sentences are in the REVERSE ORDER
// so... something is left dangling ????
var getPOSarrayFull = function(headline) {

    var parts = [];
    var target = (headline == 'Who is Gamergate? Analysis of 316K tweets');

    try {
	var n = nlp.pos(headline);
	var tokens = n[0].tokens;
	for (var i = 0; i < tokens.length; i++) {
            var t = tokens[i];
	    parts.push({ word: stripWord(t.text), pos: t.pos.tag });
	}
    } catch (err) {
	console.log(err.message);
    }

    return parts;

};

var firstPOS = function(parts, pos) {

    var word = '';

    for(var i = 0; i < parts.length; i++) {
	if (parts[i].pos == pos) {
	    word = parts[i].word;
	    break;
	}
    }

    return word;
};

// split on inner punctuation
var splitterPunct = function(h1, h2) {

    // this should be accecptable
    // 	{ name: 'Who is Gamergate? Analysis of 316K tweets'

    var h1Loc = h1.indexOf(':');
    var h2Loc = h2.indexOf(':');

    var sent = h1.slice(0, h1Loc) + h2.slice(h2Loc);
    return sent;

};

var splitterPos = function(h1,h2) {

    // console.log('splitterPos');

    var pos = 'CC';

    var words1 = getPOSarrayFull(h1);
    var words2 = getPOSarrayFull(h2);

    // sentence1 up to CC
    // then sentence2 from CC

    // we don't do token replacement, because then we lose punctuation, etc.
    var firstCC = firstPOS(words1, pos);
    var secondCC = firstPOS(words2, pos);

    var firstLoc = h1.indexOf(firstCC);
    var secondLoc = h2.indexOf(secondCC); // - secondCC.length;

    var sent = h1.slice(0, firstLoc) + h2.slice(secondLoc);

    return sent;


};


var replaceBuilder = function(pos) {


    return b;

};

var pr = function(pos) {

    return function(h1, h2) { return posReplacement(h1,h2,pos); };

};


// simple strategy - replace all the nouns in one sentence with the nouns from another
// It's something.
var posReplacement = function(h1, h2, pos) {

    // console.log('posReplacement');

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

    // console.log('replacementPos');

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

var hasCCs = function(h1, h2) {

    var h1f = false;
    var h2f = false;

    for (var i = 0; i < h1.length; i++) {
	if (h1[i].pos == 'CC') {
	    h1f = true;
	    break;
	}
    }

    for (i = 0; i < h2.length; i++) {
	if (h2[i].pos == 'CC') {
	    h2f = true;
	    break;
	}
    }

    var found = h1f && h2f;

    return found;

};

var hasColons = function(h1, h2) {

    return (h1.indexOf(':') > -1 && h2.indexOf(':') > -1);

};

// 50-50 chance (unless override)
var coinflip = function(chance) {

    if (!chance) chance = 0.5;

    return (Math.random() < chance);

};

// input: two headlines as strings
// output: a strategy method
var getStrategy = function(h1, h2) {

    var hp1 = getPOSarrayFull(h1);
    var hp2 = getPOSarrayFull(h2);
    var ccs = hasCCs(hp1,hp2);
    var colons = hasColons(h1, h2);

    var strategy;

    if (colons && coinflip(0.75)) {
	strategy = splitterPunct;
    }
    else if(ccs && coinflip(0.75)) {
	strategy = splitterPos;
    }

    if (!strategy) {
	strategy = (Math.random() > 0.5) ? posReplacement : replacementPos;
    }

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

	console.log('\nh1: ' + h1.name + '\nh2:' + h2.name);

	var strategy = getStrategy(h1.name, h2.name);;

	try {
	    // NOPE: this is a step in the right direction, but not the right step
	    var newSentence = inflection.titleize(strategy(h1.name, h2.name, 'NN'));
	    console.log(newSentence);
	    if(!newSentence) {
		console.log('NOTHING NOTHING NOTHING');
	    }
	} catch (err) {
	    console.log('Error: ' + err.message);
	}

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

// var getHeadlines = headlinesFromPage1;
var getHeadlines = headlinesFromStatic; // a static method for testing

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
}, 500 );
