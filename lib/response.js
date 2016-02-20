/**
 *  An object holding a request
 *  It's the same idea as gulpjs/vinyl, but for a request
 *
 *  We're just going to deal with streams here so no need for
 *  isNull(), isBuffer() and all that Jazz.
 */
'use strict';

const contentType = require( 'content-type' );

module.exports = class {
    
    constructor( response ) {

        this.contents = response;

        this.statusCode = response.statusCode;
        this.statusMessage = response.statusMessage;
        this.url = response.request.uri;
        this.headers = response.headers;

        if ( response.headers['content-type'] ) {

            try {
                this.contentType = contentType.parse( response.headers['content-type'] ).type;
            } catch ( e ) {
                // Really don't care if it errors
            }
        }

    }

};