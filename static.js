// for testing
// TODO: move to external file
var getHeadlines = function() {

    var _ = require('underscore');
    _.mixin(require('underscore.deferred'));
    var dfd = new _.Deferred();

    var headlines = [
	// { name: 'Ministry\'s "(Everyday Is) Halloween"',
	//   url: '' },
	// { name: 'The most terrifying non-horror movies',
	//   url: '' },
        { name: 'Why are we drawn to storytelling?',
          url: 'http://blahblah.com' },
        { name: 'Alien: The Archive art and photo book',
          url: 'http://www.google.com' }
	// ,{ name: 'Music video: John Cale\'s new song for Lou Reed',
	//   url: 'http://boingboing.net/2014/10/28/music-video-john-cales-new.html' },
	// { name: 'Who is Gamergate? Analysis of 316K tweets',
	//   url: 'http://boingboing.net/2014/10/28/who-is-gamergate-analysis-of.html' },
	// { name: 'Thousands of Americans got sub-broadband ISP service, thanks to telcoms shenanigans',
	//   url: 'http://boingboing.net/2014/10/28/thousands-of-americans-got-sub.html' },
	// { name: 'Ridley Scott to produce miniseries on rocket scientist, occultist Jack Parsons',
	//   url: 'http://boingboing.net/2014/10/28/ridley-scott-to-produce-minise.html' },
	// { name: 'Krs-One was a Teenage Drug Courier',
	//   url: 'http://boingboing.net/2014/10/28/krs-one-was-a-teenage-drug-cou.html' },
	// { name: 'Circling the globe with the mid-20th century\'s most brilliant matchbox art',
	//   url: 'http://boingboing.net/2014/10/28/circling-the-globe-with-the-mi.html' },
	// { name: 'Video: Dock Ellis who pitched a no-hitter while on LSD',
	//   url: 'http://boingboing.net/2014/10/28/video-dock-ellis-who-pitched.html' },
	// { name: 'The story of Venice\'s "gentleman thief" and an amazing art heist',
	//   url: 'http://boingboing.net/2014/10/28/the-story-of-venices-gentl.html' },
	// { name: 'Putting your foot in your mouth',
	//   url: 'http://boingboing.net/2014/10/28/putting-your-foot-in-your-mout.html' },
	// { name: 'Furniture from old Apple G5 towers',
	//   url: 'http://boingboing.net/2014/10/28/furniture-from-old-apple-g5-to.html' },
	// { name: 'Why we love man versus nature struggles',
	//   url: 'http://boingboing.net/2014/10/28/themartian.html' },
	// { name: 'The Peripheral: William Gibson vs William Gibson',
	//   url: 'http://boingboing.net/2014/10/28/the-peripheral-william-gibson.html' },
	// { name: 'Our Magic, a documentary about magic by magicians',
	//   url: 'http://boingboing.net/2014/10/28/our-magic-a-documentary-about.html' },
	// { name: 'Oh joy! Oh Joy Sex Toy is a book!',
	//   url: 'http://boingboing.net/2014/10/27/oh-joy-oh-joy-sex-toy-is-a-bo.html' },
	// { name: 'Suitsy: The business suit onesie',
	//   url: 'http://boingboing.net/2014/10/27/suitsy-the-business-suit-ones.html' },
	// { name: 'The rise and fall of American Hallowe\'en costumes',
	//   url: 'http://boingboing.net/2014/10/29/the-rise-and-fall-of-american.html' },
	// { name: 'Eight year old\'s incredible prize-winning scorpion photo',
	//   url: 'http://boingboing.net/2014/10/29/eight-year-olds-incredible-p.html' },
	// { name: 'Verizon\'s new big budget tech-news site prohibits reporting on NSA spying or net neutrality',
	//   url: 'http://boingboing.net/2014/10/29/verizons-new-big-budget-tech.html' },
	// { name: 'J. Mascis covers Mazzy Star',
	//   url: 'http://boingboing.net/2014/10/29/j-mascis-covers-mazzy-star.html' },
	// { name: 'Painting with fire',
	//   url: 'http://boingboing.net/2014/10/29/painting-with-fire.html' },
	// { name: 'Star Wars Costumes: The Original Trilogy',
	//   url: 'http://boingboing.net/2014/10/29/star-wars-costumes-the-origin.html' },
	// { name: 'TOM THE DANCING BUG: Ernest Hemingway\'s New Typewriter',
	//   url: 'http://boingboing.net/2014/10/29/tom-the-dancing-bug-ernest-he.html' },
	// { name: 'Pope: God "is not a magician" and Big Bang and evolution are A-ok',
	//   url: 'http://boingboing.net/2014/10/29/pope-god-is-not-a-magician.html' },
	// { name: 'Why Are Witches Green?',
	//   url: 'http://boingboing.net/2014/10/29/why-are-witches-green.html' },
	// { name: 'Obamacare: what it is, what it\'s not',
	//   url: 'http://boingboing.net/2014/10/29/obamacare-what-it-is-what-it.html' },
	// { name: 'Hallowe\'en Makie mischief: Barbie freakout!',
	//   url: 'http://boingboing.net/2014/10/28/halloween-makie-mischief-ba.html' },
	// { name: 'Every artist\'s "how I made it" talk, ever',
	//   url: 'http://boingboing.net/2014/10/28/every-artists-how-i-made-i.html' },
	// { name: 'The Terrible Sea Lion: a social media parable',
	//   url: 'http://boingboing.net/2014/10/28/the-terrible-sea-lion-a-socia.html' },
	// { name: 'Which online services will stick up for you when the copyright bullies knock?',
	//   url: 'http://boingboing.net/2014/10/28/which-online-services-will-sti.html' },
	// { name: 'Political mailer includes opponent\'s SSN and driver\'s license number',
	//   url: 'http://boingboing.net/2014/10/28/political-mailer-includes-oppo.html' }
    ];

    dfd.resolve(headlines);
    // The function returns a promise, and the promise resolves to the array of headlines.
    return dfd.promise();
};


module.exports = { getHeadlines: getHeadlines };
