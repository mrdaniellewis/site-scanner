'use strict';

var path = require('path');

var RequestQueue = require('./lib/request-queue');
var Controller = require('./lib/Controller');
var redirect = require('./lib/actions/redirect');
var parseLinks = require('./lib/actions/parse-links');
var timing = require('./lib/actions/timing');
var size = require('./lib/actions/size');
var save = require('./lib/actions/save');
var log = require('./lib/actions/log');

var requestQueue = new RequestQueue( {
	parallel: 5
} );

var controller = new Controller( {
	requestQueue: requestQueue,
	actions: [
		redirect(20),
		timing,
		size,
		parseLinks,
		save( { saveFolder: path.resolve( __dirname, './save' ) } ),
		log( { filePath: path.resolve( __dirname, './log.log' ) } )
	],
	filter: function(url) {
		
		if ( url.indexOf( 'https://www.citizensadvice.org.uk/' ) !== 0 ) {
			return false;
		}

		return true;
	}
} );

controller.done
	.then( function() {
		console.log( controller.visited );
	} );

controller.add('https://www.citizensadvice.org.uk/');










