'use strict';

const stream = require( 'stream' );

const debug = require( 'debug' )( 'site-scanner:timing' );

module.exports = function() {

    return new stream.Transform( {

        objectMode: true,

        transform( response, encoding, callback ) {

            debug( 'transform', response.formattedUrl );

            response.contents.on( 'end', () => {

                debug( 'end', response.contents.elapsedTime );

                response.time = response.contents.elapsedTime;
            } );

            callback( null, response );

        },

    } );

};