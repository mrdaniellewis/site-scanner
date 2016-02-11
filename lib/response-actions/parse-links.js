/**
 *  Parse the html for links and queue these
 */
'use strict';

const stream = require( 'stream' );

const debug = require( 'debug' )( 'site-scanner:parse-links' );
const HTMLParser = require( '../parsers/html-parser' );

module.exports = function( options ) {

    return new stream.Transform( {

        objectMode: true,

        transform( response, encoding, callback ) {

            if ( response.statusCode !== 200 || response.contentType !== 'text/html' ) {
                callback( null, response );
                return;
            }

            response.content
                .pipe( new HTMLParser( { url: response.url } ) )
                .pipe( options.linkManager );

            callback();
            
        },


    } );

};


