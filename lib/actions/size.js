/**
 *  Count the size of the content
 */
'use strict';

const debug = require( 'debug' )( 'site-scanner:size' );

module.exports = function( response ) {

    let size = 0;

    response.stream
        .on( 'data', data => {

            size += data.length;
            
            debug( 'data', size );

        } )
        .on( 'end', () => {
            
            debug( 'end', size );

            response.size = size;
        } );

    return response;
    
};