// ### Libraries and globals

// This bot works by inspecting the front page of Google News. So we need
// to use `request` to make HTTP requests, `cheerio` to parse the page using
// a jQuery-like API, `underscore.deferred` for [promises](http://otaqui.com/blog/1637/introducing-javascript-promises-aka-futures-in-google-chrome-canary/),
// and `twit` as our Twitter API library.
var request = require('request');
var cheerio = require('cheerio');
var _ = require('underscore.deferred');
var nlp = require('nlp_compromise');

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

console.log(nlp.spot("What are you doing in Chicago?"));
