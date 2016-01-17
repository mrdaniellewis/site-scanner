'use strict';

module.exports = function( requestOptions, response ) {

	response.on( 'end', function() {
		requestOptions.time = process.hrtime( response.timerStart );
	} );

};