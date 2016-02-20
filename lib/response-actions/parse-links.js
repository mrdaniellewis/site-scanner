/**
 *  Parse the html for links and queue these
 */
'use strict';

const stream = require( 'stream' );

const debug = require( 'debug' )( 'site-scanner:parse-links' );
const HTMLParser = require( '../parsers/html-parser' );

module.exports = function( options ) {

    const linkManager = options.linkManager;
    const datastore = options.datastore || {
        addReference: () => Promise.resolve,
    };

    return new stream.Transform( {

        objectMode: true,

        transform( response, encoding, callback ) {

            debug( 'transform', response.formattedUrl, response.contentType );

            if ( response.statusCode !== 200 || response.contentType !== 'text/html' ) {

                debug( 'transform', 'no a valid type' );

                callback( null, response );
                return;
            }

            response.contents
                .pipe( new HTMLParser( { url: response.url } ) )
                .on( 'data', item => {
                    
                    datastore.addReference( {
                        target: item.url,
                        source: item.source,
                    } )
                        .then( () => {

                            // While we could transform and pipe to this
                            // all those pipe handlers
                            // create a memory leak.
                            linkManager.write( item.url );

                            callback();

                        } );
                    
                    
                } );

            this.push( response );
            
        },


    } );

};


