/**
 *  Manages links
 */
'use strict';

const stream = require( 'stream' );
const URL = require( 'url' );

module.exports = class extends stream.Transform {

    constructor() {

        super( { objectMode: true } );

        this._visited = new Set();

    }

    _transform( options, encoding, callback ) {

        this.push( this._formatUrl( options ) );
        callback();
    }

    setVisited( url ) {
        this._visited.add( url );
    }
 
    _formatUrl( options ) {

        const data = {
            source: null,
            url: null,
            originalUrl: null,
            error: null,
        };

        let url;

        if ( typeof options === 'string' ) {
            url = options;
        } else {
            url = options.url;
        }

        data.originalUrl = url;

        const parsedUrl = URL.parse( url );
        parsedUrl.hash = null;
        url = URL.format( parsedUrl );
        data.url = url;

        if ( /^https?:$/.test( parsedUrl.protocol ) ) {

            data.error = 'Incorrect protocol';

        } else if ( !this._visited.has( data.url ) ) {

            data.error = 'Visited';

        }

        return data;

    }

};