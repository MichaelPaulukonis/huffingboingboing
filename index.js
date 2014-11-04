// ### Libraries and globals

// This bot works by inspecting the front page of BoingBoing.
// So we need to use `request` to make HTTP requests,
//`cheerio` to parse the page using a jQuery-like API,
// `underscore.deferred` for [promises](http://otaqui.com/blog/1637/introducing-javascript-promises-aka-futures-in-google-chrome-canary/),
// and `twit` as our Twitter API library.
var request = require('request');
var cheerio = require('cheerio');
var _ = require('underscore');
_.mixin(require('underscore.deferred'));
var dfd = new _.Deferred();
var nlp = require('nlp_compromise');
var config = require('./config.js');
var Twit = require('twit');
var T = new Twit(config);
var shorturl = require('shorturl');

var baseUrl = 'http://boingboing.net/page/1';

// ### Utility Functions

var logger = function(msg) {
    // console.log('logging?: ' + config.log);
    if (config.log) console.log(msg);
};

// adding to array.prototype caused issues with nlp_compromise
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


var direction = {
    forward: 0,
    reverse: 1
};

// for testing
// TODO: move to external file
var headlinesFromStatic = function() {
    var headlines = [
	// { name: 'Ministry\'s "(Everyday Is) Halloween"',
	//   url: '' },
	// { name: 'The most terrifying non-horror movies',
	//   url: '' },
	{ name: 'Music video: John Cale\'s new song for Lou Reed',
	  url: 'http://boingboing.net/2014/10/28/music-video-john-cales-new.html' },
	{ name: 'Who is Gamergate? Analysis of 316K tweets',
	  url: 'http://boingboing.net/2014/10/28/who-is-gamergate-analysis-of.html' },
	{ name: 'Thousands of Americans got sub-broadband ISP service, thanks to telcoms shenanigans',
	  url: 'http://boingboing.net/2014/10/28/thousands-of-americans-got-sub.html' },
	{ name: 'Ridley Scott to produce miniseries on rocket scientist, occultist Jack Parsons',
	  url: 'http://boingboing.net/2014/10/28/ridley-scott-to-produce-minise.html' },
	{ name: 'Krs-One was a Teenage Drug Courier',
	  url: 'http://boingboing.net/2014/10/28/krs-one-was-a-teenage-drug-cou.html' },
	{ name: 'Circling the globe with the mid-20th century\'s most brilliant matchbox art',
	  url: 'http://boingboing.net/2014/10/28/circling-the-globe-with-the-mi.html' },
	{ name: 'Video: Dock Ellis who pitched a no-hitter while on LSD',
	  url: 'http://boingboing.net/2014/10/28/video-dock-ellis-who-pitched.html' },
	{ name: 'The story of Venice\'s "gentleman thief" and an amazing art heist',
	  url: 'http://boingboing.net/2014/10/28/the-story-of-venices-gentl.html' },
	{ name: 'Putting your foot in your mouth',
	  url: 'http://boingboing.net/2014/10/28/putting-your-foot-in-your-mout.html' },
	{ name: 'Furniture from old Apple G5 towers',
	  url: 'http://boingboing.net/2014/10/28/furniture-from-old-apple-g5-to.html' },
	{ name: 'Why we love man versus nature struggles',
	  url: 'http://boingboing.net/2014/10/28/themartian.html' },
	{ name: 'The Peripheral: William Gibson vs William Gibson',
	  url: 'http://boingboing.net/2014/10/28/the-peripheral-william-gibson.html' },
	{ name: 'Our Magic, a documentary about magic by magicians',
	  url: 'http://boingboing.net/2014/10/28/our-magic-a-documentary-about.html' },
	{ name: 'Oh joy! Oh Joy Sex Toy is a book!',
	  url: 'http://boingboing.net/2014/10/27/oh-joy-oh-joy-sex-toy-is-a-bo.html' },
	{ name: 'Suitsy: The business suit onesie',
	  url: 'http://boingboing.net/2014/10/27/suitsy-the-business-suit-ones.html' },
	{ name: 'The rise and fall of American Hallowe\'en costumes',
	  url: 'http://boingboing.net/2014/10/29/the-rise-and-fall-of-american.html' },
	{ name: 'Eight year old\'s incredible prize-winning scorpion photo',
	  url: 'http://boingboing.net/2014/10/29/eight-year-olds-incredible-p.html' },
	{ name: 'Verizon\'s new big budget tech-news site prohibits reporting on NSA spying or net neutrality',
	  url: 'http://boingboing.net/2014/10/29/verizons-new-big-budget-tech.html' },
	{ name: 'J. Mascis covers Mazzy Star',
	  url: 'http://boingboing.net/2014/10/29/j-mascis-covers-mazzy-star.html' },
	{ name: 'Painting with fire',
	  url: 'http://boingboing.net/2014/10/29/painting-with-fire.html' },
	{ name: 'Star Wars Costumes: The Original Trilogy',
	  url: 'http://boingboing.net/2014/10/29/star-wars-costumes-the-origin.html' },
	{ name: 'TOM THE DANCING BUG: Ernest Hemingway\'s New Typewriter',
	  url: 'http://boingboing.net/2014/10/29/tom-the-dancing-bug-ernest-he.html' },
	{ name: 'Pope: God "is not a magician" and Big Bang and evolution are A-ok',
	  url: 'http://boingboing.net/2014/10/29/pope-god-is-not-a-magician.html' },
	{ name: 'Why Are Witches Green?',
	  url: 'http://boingboing.net/2014/10/29/why-are-witches-green.html' },
	{ name: 'Obamacare: what it is, what it\'s not',
	  url: 'http://boingboing.net/2014/10/29/obamacare-what-it-is-what-it.html' },
	{ name: 'Hallowe\'en Makie mischief: Barbie freakout!',
	  url: 'http://boingboing.net/2014/10/28/halloween-makie-mischief-ba.html' },
	{ name: 'Every artist\'s "how I made it" talk, ever',
	  url: 'http://boingboing.net/2014/10/28/every-artists-how-i-made-i.html' },
	{ name: 'The Terrible Sea Lion: a social media parable',
	  url: 'http://boingboing.net/2014/10/28/the-terrible-sea-lion-a-socia.html' },
	{ name: 'Which online services will stick up for you when the copyright bullies knock?',
	  url: 'http://boingboing.net/2014/10/28/which-online-services-will-sti.html' },
	{ name: 'Political mailer includes opponent\'s SSN and driver\'s license number',
	  url: 'http://boingboing.net/2014/10/28/political-mailer-includes-oppo.html' }
    ];

    // var dfd = new _.Deferred().resolve(headlines);
    dfd.resolve(headlines);
    // The function returns a promise, and the promise resolves to the array of headlines.
    return dfd.promise();
};

// ### Screen Scraping
var headlinesFromPage1 = function() {
    // logger('inside of getHeadlines()');
    var headlines = [];
    var dfd = new _.Deferred();
    request(baseUrl, function (error, response, body) {
	// logger('inside of request');
	if (!error && response.statusCode === 200) {
	    var $ = cheerio.load(body);
	    var heads = $('h1>a');
	    // logger('head count: ' + heads.length);

	    $('h1>a').each(function() {
		var title = $(this).text();
		// logger(this);
		// logger(title);
		var hl = {};
		// hl.name = this.text();
		hl.name = clean(title);
		hl.url = this.attr('href');
		headlines.push(hl);
	    });
	    // logger(headlines);
	    dfd.resolve(headlines);
	}
	else {
	    // logger('getHeadlines.else');
	    dfd.reject();
	}
    });
    // The function returns a promise, and the promise resolves to the array of headlines.
    return dfd.promise();
};


// headline as string
var dumpInfo = function(headline) {

    logger('\n\nheadline: ' + headline);

    var p = nlp.pos(headline);
    var tokens = p[0].tokens;

    for (var i = 0; i < tokens.length; i++) {
        var t = tokens[i];
        logger('text: ' + t.text + ' (' + t.pos.tag + ')');
    }

    var nn = getNNarray(headline);
    logger(nn.join(' -  '));
};

var stripWord = function(word) {

    // let punctuation and possessives remain
    // TODO: unit-tests for various errors we encounter
    // Venice's := Venice
    // VENICE'S := VENICE
    // etc.
    var removals = ['"', ':', '-', ',', '\'s$', '\\(', '\\)', '\\[', '\\]' ];

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
	logger(err.message);
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

    // logger('splitterPos');

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

var replacer = function(pos, vector) {

    var posReplacement = function(h1, h2) {

	// logger('posReplacement');

	var sent = h1;

	var words1 = getPOSarray(h1, pos);
	var words2 = getPOSarray(h2, pos);

	var longest = ( words1.length > words2.length ? words1.length : words2.length);

	// the shortest list needs to be modded against its length
	for (var i = 0; i < longest; i++) {
	    // logger('replace: ' + words1[i % words1.length] + ' with: ' +  words2[i % words2.length]);
	    sent = sent.replace(new RegExp('\\b' + words1[i % words1.length] + '\\b', 'i'), words2[i % words2.length]);
	}

	return sent;

    };

    // loop through the second (smaller) array in reverse.
    // uh. wheeee?
    var replacementPos = function(h1, h2) {

	// logger('replacementPos');

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
	    // logger('i: ' + i + ' invert: ' + invert);
	    sent = sent.replace(new RegExp('\\b' + words1[i % words1.length] + '\\b', 'i'), words2[invert]);
	}

	return sent;

    };

    return (vector == direction.forward ? posReplacement : replacementPos);

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
	strategy = (Math.random() > 0.5) ? replacer('NN', direction.forward) : replacer('NN', direction.reverse);
    }

    return strategy;
};

var picker = function(headlines) {

    logger('picker!');

    var h1 = pickRemove(headlines);
    var h2 = pickRemove(headlines);

    logger('\nh1: ' + h1.name + '\nh2:' + h2.name);

    var two = [h1, h2];

    return two;

};

// we do NOT have the data here... :-(
var tweeter = function(headlines) {

    logger('tweeter!');
    logger(arguments);
    // logger(headlines);

    // not random at the mo
    // because passing in original array WTF?!?!?
    var h1 = headlines[0];
    var h2 = headlines[1];

    logger('\nh1: ' + h1.name + '\nh2:' + h2.name);

    var strategy = getStrategy(h1.name, h2.name);;

    try {
	var newSentence = strategy(h1.name, h2.name);
	// capitalize first word
	// I tried inflection's "titleize" but that zapped acronyms like "SSN" and "NSA"
	newSentence = newSentence.slice(0,1).toUpperCase() + newSentence.slice(1);

        if (newSentence.length < 120) newSentence += ' ' + headlines[0].url;
        if (newSentence.length < 120) newSentence += ' ' + headlines[1].url;
	logger(newSentence);

	if(!newSentence) {
	    logger('NOTHING NOTHING NOTHING');
	}
    } catch (err) {
	console.log('Error: ' + err.message);
    }

    if (config.tweet_on) {
	T.post('statuses/update', { status: newSentence }, function(err, reply) {
	    if (err) {
		console.log('error:', err);
	    }
	    else {
                // nothing on success
	    }
	});
    }

};

// headline: { name, url }
var shortenit = function(headline) {

    var dfd = new _.Deferred();
    logger('shortenit!');
    logger(headline);
    // plan on using https://www.npmjs.org/package/shorturl
    var newUrl = shorturl(headline.url, function(result) {
        logger('returned from shorturl');
        logger(result);
        headline.url = result;
        dfd.resolve(headline);
    });


    return dfd.promise();

};


function tweet() {

    // http://blog.mediumequalsmessage.com/promise-deferred-objects-in-javascript-pt2-practical-use
    // http://stackoverflow.com/questions/17216438/chain-multiple-then-in-jquery-when

    logger('in tweet');

    getHeadlines()
	.then(function(hs1) {
            var twoheads = picker(hs1);
            logger('two headlines picked:');
            _.when(
                shortenit(twoheads[0]),
                shortenit(twoheads[1])
            ).done(function() {
                var res = _.flatten(arguments);
                logger('DONE DONE DONE!');
                tweeter(arguments);
            });
        });

};

// Tweets ever n minutes
// set config.seconds to 60 for a complete minute
setInterval(function () {
    try {
	tweet();
    }
    catch (e) {
	console.log(e);
    }
}, 1000 * config.minutes * config.seconds);


// hard-coded headlines, or OMG ITS ALIVE
var getHeadlines = (config.static_lib ? headlinesFromStatic : headlinesFromPage1);

// Tweets once on initialization.
tweet();
