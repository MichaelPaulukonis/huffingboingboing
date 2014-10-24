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

// This function lets us call `pick()` on any array to get a random element from it.
// Array.prototype.pick = function() {
//     return this[Math.floor(Math.random()*this.length)];
// };

// // This function lets us call `pickRemove()` on any array to get a random element
// // from it, then remove that element so we can't get it again.
// Array.prototype.pickRemove = function() {
//     var index = Math.floor(Math.random()*this.length);
//     return this.splice(index,1)[0];
// };

var pick = function(arr) {
    return arr[Math.floor(Math.random()*arr.length)];
};

var pickRemove = function(arr) {
    var index = Math.floor(Math.random()*arr.length);
    return arr.splice(index,1)[0];
};

// ### Screen Scraping

// var titles = [];
// var h = $('.jknav a')
// $.each(h, function(index, value) { titles.push($("<div/>").html(value.innerHTML).text()); })

// We pass this function a category code (see `tweet` below). We grab the Google News
// topics page for that category and load the html into `cheerio`. We parse the page for
// text from the links in the left-hand bar, which becomes a list of topics.
// For example, if we passed it 'e' for Entertainment, we might get: Miley Cyrus, Oscars,
// Kanye West, and so on.
function getTopics() {
    console.log('inside of getTopics()');
    var topics = [];
    var dfd = new _.Deferred();
    request(baseUrl, function (error, response, body) {
	console.log('inside of request');
	if (!error && response.statusCode === 200) {
	    var $ = cheerio.load(body);
	    var heads = $('h1>a');
	    console.log('head count: ' + heads.length);

	    $('h1>a').each(function() {
		var title = $(this).text();
		// console.log(this);
		// console.log(title);
		var topic = {};
		// topic.name = this.text();
		topic.name = title;
		topic.url = baseUrl + this.attr('href');
		topics.push(topic);
	    });

	    dfd.resolve(topics);
	}
	else {
	    console.log('getTopics.else');
	    dfd.reject();
	}
    });
    // The function returns a promise, and the promise resolves to the array of topics.
    return dfd.promise();
}

// We pass this function a URL for a specific topic (for example:
// [Miley Cyrus](https://news.google.com/news/section?pz=1&cf=all&ned=us&hl=en&q=Miley%20Cyrus).
// We then get the page, feed the HTML to `cheerio`, and then pick a random headline
// from the page.
function getHeadline(url) {
    var dfd = new _.Deferred();
    request(url, function (error, response, body) {
	if (!error && response.statusCode === 200) {
	    var $ = cheerio.load(body);
	    var headlines = $('.jknav a');
	    // `pick()` doesn't work here because `headlines` isn't an array, so instead we use `cheerio`'s `eq` which
	    // give us a matched element at a given index, and pass it a random number.
	    var headline = headlines.eq(Math.floor(Math.random()*headlines.length)).text();
	    dfd.resolve(headline);
	}
	else {
	    dfd.reject();
	}
    });
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

// This won't work for BoingBoing, since there are no "Categories" where the category is in the headline
// hrm.
// just chop the two headlines into pieces?
// this will be... stupid.
function tweet() {

    getTopics().then(function(topics) {
	console.log('returned from getTopics');
	var h1 = pickRemove(topics);
	var h2 = pickRemove(topics);

	console.log(h1.name);
	console.log(h2.name);

	// so. doesn't always work, if we don't have a named entity.
	// fail: "Make you own geometrical papercraft mask"`
	var h1s = nlp.spot(h1.name);
	var h2s = nlp.spot(h2.name);

	console.log('nlp complete');

	console.log(h1s);
	console.log(h2s);

	var sent = "";
	sent = h1.name.replace(h1s[0].text, '') + " " + h2.name.replace(h2s[1].text, '');
	console.log('sentence: ' + sent);

	// so. this doesn't work. we will have to split apart using some other means.
	// OR - only use those sentences that DO have a named-entity in them
	// but I don't know if that will split well....
	// use the named-entity from one in the other sentence?
	// that could work.....

	// var topic = topics.pickRemove();

	// console.log(topic);
	// getTopics().then(function(headline) {
	//     if (headline.indexOf(topic.name) > -1) {
	// 	getTopics(categoryCodes.pickRemove()).then(function(topics) {
	// 	    var newTopic = topics.pick();
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
}, 1000 * 60 * 60);
