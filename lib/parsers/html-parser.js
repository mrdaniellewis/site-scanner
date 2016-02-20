/**
 *  Parses a html document and finds links
 */
'use strict';

// @todo Add picture element
// @todo Add srcset

const stream = require( 'stream' );
const URL = require( 'url' );

const debug = require( 'debug' )( 'site-scanner:HtmlParser' );
const htmlparser = require( 'htmlparser2' );

// This is implemented as a stream, however 
// due to fact a base tag may appear anywhere in a document
// we need to parse the whole thing before any links can be resolved

class LinkFinderHandler {

    constructor() {
        
        this.base = undefined;
        this.links = [];
        
    }

    onopentag( name, attributes ) {

        switch ( name ) {

            case 'base':

                if ( !this.base ) {
                    this.base = attributes.href;
                }

                break;

            case 'a':
            case 'area':

                if ( 'href' in attributes ) {

                    this.links.push( {
                        url: attributes.href,
                        source: {
                            nodeName: name,
                            mimetype: attributes.type,
                            rel: attributes.rel,
                            download: attributes.download,
                            href: attributes.href,
                        },
                    } );

                }

                break;

            case 'img':

                this.links.push( {
                    url: attributes.src,
                    source: {
                        nodeName: 'img',
                        src: attributes.src,
                    },
                } );

                break;
  
            case 'link': {

                let type = attributes.type;

                if ( !type ) {

                    if ( /\bstylesheet\b/i.test( attributes.rel || '' ) ) {
                        type = 'text/css';
                    }
                }

                this.links.push( {
                    url: attributes.href,
                    source: {
                        nodeName: 'link',
                        type: type,
                        rel: attributes.rel,
                        href: attributes.href,
                    },
                } );

                break;

            }

            case 'script':

                if ( 'src' in attributes ) {
                    this.links.push( {
                        url: attributes.src,
                        source: {
                            nodeName: 'script',
                            type: attributes.type || 'text/javascript',
                            src: attributes.src,
                        },
                    } );
                }

                break;

            case 'iframe':

                if ( 'src' in attributes ) {
                    this.links.push( {
                        url: attributes.src,
                        source: {
                            nodeName: 'iframe',
                            src: attributes.src,
                        },
                    } );
                }

                break;

            /* case 'form':

                this.links.push( {
                    url: attributes.action || '',
                    source: {
                        nodeName: 'form',
                        action: attributes.action,
                        method: attributes.method,
                    },
                } );

                break;*/
        }
    }

}


module.exports = class extends stream.Transform {

    constructor( options ) {

        super( { readableObjectMode: true } );

        this.url = options.url;

        this._handler = new LinkFinderHandler();
        this._parser = new htmlparser.Parser( this._handler, { lowerCaseAttributeNames: true, decodeEntities: true } );

    }

    _transform( chunk, encoding, callback ) {
        this._parser.write( chunk );
        callback();
    }

    _flush( callback ) {
        this._parser.done();

        // Resolve all the links against either the base path or original url
        this._handler.links
            .filter( link => link.url )
            .forEach( link => {
                link.source.url = this.url;
                link.source.base = this._handler.base;
                link.url = URL.resolve( this._handler.base || this.url, link.url );
                this.push( link );
            } );

        callback();
    }

};
