/**
 *  Sink for logging to the console
 */
'use strict';

const stream = require( 'stream' );

const debug = require( 'debug' )( 'site-scanner:sink' );

module.exports = function() {

    return new stream.Transform( {

        objectMode: true,

        transform( response, encoding, callback ) {

            response.contents
                .on( 'end', () => {

                    const finalData = Object.assign( response, { contents: undefined } );
                    debug( finalData );
                } );

            response.contents.resume();

            callback( null, response );

        },

    } );

};