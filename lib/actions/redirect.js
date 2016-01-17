/**
 *	Handle redirects
 */
'use strict';

var URL = require('url');

var redirectStatusCodes = [ 300, 301, 302, 303, 307, 308 ];

module.exports = function( options ) {

	options = options || {};

	var maxRedirects = options.maxRedirects || 20;

	return function( requestOptions, response ) {

		if ( redirectStatusCodes.indexOf(response.statusCode) === -1 ) {
			return;
		}

		if ( !response.headers.location && response.statusCode !== 300 ) {
			throw new Error( 'Location field missing' );
		}

		var url = URL.resolve( requestOptions.url, response.headers.location );

		this.add(url);

		return false;

	};


};