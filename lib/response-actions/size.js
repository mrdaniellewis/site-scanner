'use strict';

const stream = require( 'stream' );

module.exports = function() {

    return new stream.Transform( {

        objectMode: true,

        transform( response, encoding, callback ) {

            let size = 0;

            response.content
                .on( 'data', data => {
                    size += data.length;
                } )
                .on( 'end', () => {
                    response.data = size;
                } );

            callback( null, response );

        },

    } );

};