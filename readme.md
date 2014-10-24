# HuffingBoingBoingBot

An automated method to combine two BoingBoing headlines.

As pioneered by fleshbots in [Huffing BoingBoing](http://bbs.boingboing.net/t/huffing-boing-boing/).

Gracelessly pillaged from Darius Kazemi's [@TwoHeadlinesBot](http://github.com/dariusk/twoheadlines).

## roadmap
* More strategies
* Initial capitalization
* Url shortener service
** https://www.npmjs.org/package/shorturl
** https://www.npmjs.org/package/google-url
* Hook up with Twitter
** (some bots never learn)
* notes on strategies
* a/an cleanup
* punctuation cleanup
* verb-tense cleanup


## Notes on strategies
The original twoheadlines bot had some advantages -- it retrieved headlines sorted by categories, and replaced the category text found in the headline with different category text.

BoingBoing has no categories, and only present about 15 headlines at a time, per page.
NB: instead of scraping a single page, maybe parse the RSS feed?

At any rate, we don't have a pre-made category-text to look for, so we have to come up with (an)other stragegy|ies.

### Strategy1 - noun replacement therapy
We replace the nouns in one headline with the nouns from another headline.
In order.

### Strategy1 - noun replacement therapy
We replace the nouns in one headline with the nouns from another headline.
In reverse order.

### Strategy2 - verbs
Replace the verbs.
This is more likely to be boring.

### split on some part of speech
Not all headlines will support this.
And we have a limited pool to pick from.

### Wood splitter
Split each headline in two at a random word, regardless of context.
Join the two together.
More likely to be ungrammatical than other methods.

## Documentation
See [the nice-looking explanation of index.js](http://tinysubversions.com/twoheadlines/docs/) in order to understand how the original bot works.

##Instructions

Requires [node](http://nodejs.org/) and [npm](http://npmjs.org/) (installing node installs npm too). You also need a Twitter App access token, consumer key, and associated secrets. [You can get those here](https://dev.twitter.com/apps/new). You'll probably also want a fresh twitter account for your bot, though you could have it post to one you already own, too!

Clone the repo, then in your project directory, install the dependencies:

`$ npm install`

Next, edit `config.js` to include your Twitter App access token, consumer key, and associated secrets. This is important! Without this you'll be unable to tweet.

Install/run `grunt` to lint your code and run `docco` to regenerate the documentation.

`$ npm install -g grunt-cli`
`$ grunt`

You can also run a watch in the background:

`$ grunt watch`

To actually run the bot, do:

`$ node index.js`

This will give you some output, including, after a bit, a bunch of text that is the tweet that's just been tweeted. You can check the twitter account to see if it's updated to verify that it actually works.

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## License
Copyright (c) 2014 Michael Paulukonsi
Licensed under the MIT license.
