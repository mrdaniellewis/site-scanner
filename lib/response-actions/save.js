/**
 *	Handle redirects
 */
'use strict';

var fs = require('fs');
var path = require('path');
var stream = require('stream');
var URL = require('url');

var debug = require('debug')('site-scanner:save');
var mime = require('mime');
var mkdirp = require('mkdirp');

module.exports = function( options ) {

	var saveFolder = options.saveFolder;

	return function( requestOptions, response ) {

		if ( response.statusCode !== 200 ) {
			return;
		}
		var fileName = response.request.uri.path.slice(1);

		if ( fileName === '' ) {
			fileName = 'ROOT';
		}

		var savePath = path.resolve( saveFolder, fileName );
		var parts = path.parse(savePath);

		if ( !parts.ext ) {
			savePath += '.' + mime.extension( response.contentType);  
		}

		mkdirp( parts.dir, e => {

			if ( e ) {
				throw new Error(e);
				return;
			}

			var fileStream = fs.createWriteStream( savePath, {encoding: 'utf8' } );
			tempStream.pipe(fileStream);

		} );

		debug( 'save', savePath );

		var tempStream = new stream.PassThrough();
		response.pipe(tempStream);

	};


};