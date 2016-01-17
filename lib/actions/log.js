'use strict';

var fs = require('fs');
var path = require('path');

module.exports = function(options) {

	options = options || {};

	var log = fs.createWriteStream( options.filePath, {encoding: 'utf8' } );

	return function( requestOptions, response ) {

		response
			.on( 'end', function() {
				log.write( JSON.stringify(requestOptions) + '\n' );
			} );

	};

};


