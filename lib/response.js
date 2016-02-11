/**
 *  Represents a request
 *  Pretty much the same as gulpjs/vinyl, but for a request
 */
'use strict';

const contentType = require( 'content-type' );

module.exports = class {
    
    constructor( options ) {

        const content = options.content;

        this.data = {};
        this.body = content || null;
        this.statusCode = content.statusCode;
        this.url = options.url;

        if ( content.headers['content-type'] ) {

            try {
                this.contentType = contentType.parse( content.headers['content-type'] );
            } catch ( e ) {
                // Really don't care if it errors
            }
        }

    }

    isNull() {

        return this.body === null;

    }

    pipe( stream, options ) {

        let end = true;

        if ( options && options.end === false ) {
            end = false;
        }

        if ( this.isNull() ) {

            if ( !end ) {
                stream.end();
            }

            return stream;
        }

        return this.contents.pipe( stream, { end } );

    }

};