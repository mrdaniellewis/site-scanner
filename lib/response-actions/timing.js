'use strict';

const stream = require( 'stream' );

module.exports = function() {

    return new stream.Transform( {

        objectMode: true,

        transform( response, encoding, callback ) {

            response.content.on( 'end', () => {
                response.data.time = response.content.elapsedTime;
            } );

            callback( null, response );

        },

    } );

};