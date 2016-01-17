'use strict';

module.exports = function( requestOptions, response ) {

	var size = 0;

	response
		.on( 'data', function(data) {
			size += data.length;
		} )
		.on( 'end', function() {
			requestOptions.size = size;
		} );

};