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
var nlp = require('nlp_compromise');
var config = require('./config.js');
var Twit = require('twit');
var T = new Twit(config);
var shorturl = require('shorturl');
var iconv = require('iconv-lite');
var Buffer = require('buffer').Buffer;
var charset = require('charset');
var jschardet = require('jschardet');

var baseUrl = 'https://boingboing.net/blog/page/';

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


var getRandom = function(min,max) {
  return Math.floor(Math.random() * (max - min) + min);
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

// ### Screen Scraping
var headlinesFromPage = function(pageNbr) {
  // logger('inside of getHeadlines()');
  var dfd = new _.Deferred();
  var url = baseUrl + pageNbr;
  logger('getting from ' + url);
  try {
    // request({ url: url, encoding: null }, function (error, response, b) {
    request(url, function (error, response, b) {

      if (error) { console.log('error: ' + error); }
      if (response.statusCode !== 200) { console.log(response); }

      if (!error && response.statusCode === 200) {
        var headlines = [];

        // there were... encoding issues?
        // forcing this encoding seems to work
        // even though it is the DECLARED encoding
        // http://stackoverflow.com/questions/12326688/node-js-scrape-encoding
        // http://stackoverflow.com/questions/23805566/weird-characters-when-using-console-print-cheerio-nodejs
        var body; // = iconv.decode(b, 'utf-8');

        var enc = charset(response.headers, b);
        enc = enc || jschardet.detect(b).encoding.toLowerCase();
        if (enc != 'utf-8') {
          logger('NOT UTF-8: ' + enc);
          body = iconv.decode(new Buffer(b, 'binary'), 'utf-8');
        }

        var $ = cheerio.load(body);
        var heads = $('h1>a');
        logger('head count: ' + heads.length);

        $('h1>a').each(function() {
          var title = $(this).text();
          var hl = {};
          hl.name = clean(title);
          hl.url = this.attr('href');
          headlines.push(hl);
        });
        if (headlines.length == 0) {
          logger('NO HEADLINES FOUND FOR ' + url);
          // logger(b);
        }
        dfd.resolve(headlines);
      }
      else {
        logger('headlinesFromPage.else');
        dfd.reject();
      }
    });
  } catch (err) {
    console.log('ERROR ERROR ERROR');
    console.log(err.message);
  }
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
  //    { name: 'Who is Gamergate? Analysis of 316K tweets'

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


var woodSplitter = function(h1, h2) {

  var t1 = nlp.tokenize(h1)[0].tokens;
  var t2 = nlp.tokenize(h2)[0].tokens;

  var pos1 = t1[Math.floor(Math.random()*t1.length)].text;
  var pos2 = t2[Math.floor(Math.random()*t2.length)].text;

  var w1 = h1.search(new RegExp('\\b' + pos1 + '\\b'));
  var w2 = h2.search(new RegExp('\\b' + pos2 + '\\b'));

  var sent = h1.slice(0, w1).trim() + ' '  + h2.slice(w2).trim();

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


var hasPOS = function(h1, h2, pos) {

  var h1f = false;
  var h2f = false;

  for (var i = 0; i < h1.length; i++) {
    if (h1[i].pos == pos) {
      h1f = true;
      break;
    }
  }

  for (i = 0; i < h2.length; i++) {
    if (h2[i].pos == pos) {
      h2f = true;
      break;
    }
  }

  var found = h1f && h2f;

  if (pos == 'NN') console.log('found: ' + found);

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
  var ccs = hasPOS(hp1,hp2, 'CC');
  var colons = hasColons(h1, h2);
  var nns = hasPOS(hp1, hp2, 'NN');

  var strategy;

  if (colons && coinflip(0.75)) {
    strategy = splitterPunct;
  }
  else if(ccs && coinflip(0.75)) {
    strategy = splitterPos;
  } else if (nns && coinflip(0.8)) {
    strategy = (Math.random() > 0.5) ? replacer('NN', direction.forward) : replacer('NN', direction.reverse);
  } else {
    strategy = woodSplitter;
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

  var strategy = getStrategy(h1.name, h2.name);

  try {
    var newSentence = strategy(h1.name, h2.name);
    // capitalize first word
    // I tried inflection's "titleize" but that zapped acronyms like "SSN" and "NSA"
    newSentence = newSentence.slice(0,1).toUpperCase() + newSentence.slice(1);

    if (newSentence.length < 120 && headlines[0].url !== undefined) newSentence += ' ' + headlines[0].url;
    if (newSentence.length < 120 && headlines[1].url !== undefined) newSentence += ' ' + headlines[1].url;
    logger(newSentence);

    if(!newSentence) {
      logger('NOTHING NOTHING NOTHING');
    }
  } catch (err) {
    console.log('Error: ' + err.message);
  }

  if (newSentence.length === 0 || newSentence.length > 140) {
    tweet();
  } else {
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
  }

};

// headline: { name, url }
var shortenit = function(headline) {

  var dfd = new _.Deferred();
  logger('shortenit!');
  logger(headline);
  // using https://www.npmjs.org/package/shorturl
  shorturl(headline.url, function(result) {
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

  var chance = Math.random();
  var firstSet = 1;
  var secondSet = 2;
  var lastPage = 6900; // prolly a config var, so we could update more easily
  if (chance > 0.75) {
    secondSet = 2;
  } else if (chance > 0.5) {
    secondSet = getRandom(2,30);
  } else if (chance > 0.25) {
    secondSet = getRandom(31,lastPage);
  } else if (chance > 0.1) {
    secondSet = getRandom(3000,lastPage);
  } else {
    firstSet = getRandom(2,lastPage);
    secondSet = getRandom(3,lastPage);
  }

  _.when(
    getHeadlines(firstSet),
    getHeadlines(secondSet)
  ) .then(function() {
    var heads = _.flatten(arguments);
    // logger(heads);
    var hs1 = heads;
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

}

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
var getHeadlines = (config.static_lib ? require('./static.js').getHeadlines : headlinesFromPage);

// Tweets once on initialization.
tweet();
