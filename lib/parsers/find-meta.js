/**
 *  Parse the html
 */
'use strict';

const htmlparser = require( 'htmlparser2' );

class Handler {

    constructor() {
        this.meta = {};
        this.inTitle = false;
        this.foundTitle = false;
        this.buffer = '';
    }

    onopentag( name, attributes ) {

        switch ( name ) {

            case 'title':

                if ( !this.foundTitle ) {
                    this.inTitle = true;
                    this.buffer = '';
                }

                break;

            case 'meta':

                if ( attributes.name ) {
                    this.meta[attributes.name] = attributes.content;
                }

                break;

        }

    }

    onclosetag( name ) {

        switch ( name ) {

            case 'title':
                
                if ( this.inTitle ) {

                    this.inTitle = false;
                    this.foundTitle = true;
                    this.meta.title = this.buffer;
                }

                break;

        }

    }

    ontext( text ) {

        if ( this.inTitle ) {
            this.buffer += text;
        }

    }

}

module.exports = function( body ) {

    const handler = new Handler();
    const parser = new htmlparser.Parser( handler, {   
        lowerCaseAttributeNames: true, 
        decodeEntities: true,
    } );

    parser.write( body );

    return handler.meta;

};