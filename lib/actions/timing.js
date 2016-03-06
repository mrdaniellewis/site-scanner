/**
 *  At the end of the response save the timing of how long it took to download
 */
'use strict';

const debug = require( 'debug' )( 'site-scanner:timing' );

module.exports = function( response ) {

    response.stream.on( 'end', () => {
        
        debug( 'end', response.stream.elapsedTime );
        response.time = response.stream.elapsedTime;

    } );

    return response;

};