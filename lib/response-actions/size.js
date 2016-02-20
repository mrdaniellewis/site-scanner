'use strict';

const stream = require( 'stream' );

const debug = require( 'debug' )( 'site-scanner:size' );

module.exports = function() {

    return new stream.Transform( {

        objectMode: true,

        transform( response, encoding, callback ) {

            debug( 'transform', response.formattedUrl );

            let size = 0;

            response.contents
                .on( 'data', data => {

                    debug( 'data', size );

                    size += data.length;
                } )
                .on( 'end', () => {
                    
                    debug( 'end', size );

                    response.size = size;
                } );

            callback( null, response );

        },

    } );

};