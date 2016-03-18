/**
 *  Parse the html
 */
'use strict';

const debug = require( 'debug' )( 'site-scanner:parse-html-links' );

const findMeta = require( '../parsers/find-meta' );

module.exports = function() {

    return function( response ) {

        if ( response.statusCode !== 200 || response.contentType !== 'text/html' ) {

            debug( 'not a valid status code or contentType', response.url, response.statusCode, response.contentType );

            return response;
        }

        response.onDownload( () => {
            response.meta = findMeta( response.body );
        } );

        return response;

    };

};
