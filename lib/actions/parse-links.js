/**
 *	Parse the html for links and queue these
 */
'use strict';

var URL = require('url');

var debug = require('debug')( 'site-scanner:parse-links');
var HTMLParser = require( '../parsers/html-parser' );

module.exports = function( requestOptions, response ) {

	if ( response.contentType === 'text/html' ) {

		var requestUrl = URL.format(response.request.uri);
		debug( 'parse-links', response.contentType, requestUrl );

		var parser = new HTMLParser( {
			url: requestUrl 
		});
		parser.on( 'data', item => {
			
			debug( 'found', item );

			var url = item.url;
			var linkProperties = {
				mimeType: '',
				nodeName: item.nodeName
			};
			
			this.add( item, linkProperties );
		} );

		response.pipe(parser);

	}

};


