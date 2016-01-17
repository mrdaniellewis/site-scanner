/**
 *	Parses a html document and finds links
 */
'use strict';

// @todo Add picture element
// @todo Add srcset

var Stream = require('stream');
var URL = require('url');
var debug = require('debug')('site-scanner:HtmlParser');

var htmlparser = require("htmlparser2");

// This is implemented as a stream, however 
// due to fact a base tag may appear anywhere in a document
// we need to parse the whole thing before any links can be resolved

class LinkFinderHandler {

	constructor() {
		this.base = '';
		this.links = [];
	}

	onopentag( name, attributes ) {

		switch( name ) {

			case 'base':

				if (!this.base ) {
					this.base = attributes.href;
				}

			break;

			case 'a':
			case 'area':

				if ( 'href' in attributes ) {

					this.links.push( {
						url: attributes.href,
						nodeName: name
					} );

				}

			break;

			case 'img':

				this.links.push( {
					url: attributes.src,
					nodeName: 'img'
				});

			break;

			case 'link':

				this.links.push( {
					url: attributes.href,
					nodeName: 'link'
				});

			break;

			case 'script':

				if ( 'src' in attributes ) {
					this.links.push( {
						url: attributes.src,
						nodeName: 'link'
					});
				}

			break;

		}
	}

	onclosetag( name ) {

	}

}



module.exports = class extends Stream.Transform {

	constructor(options) {

		options = options || {};

		super( { readableObjectMode : true } );

		this.url = options.url;

		this._handler = new LinkFinderHandler();
		
		this._parser = new htmlparser.Parser( this._handler, { lowerCaseAttributeNames: true } );

	}

	_transform( chunk, encoding, callback ) {
		this._parser.write(chunk);
		callback();
	}

	_flush( callback ) {
		this._parser.done();

		// Resolve all the links against either the base path or original url
		this._handler.links
			.filter( link => link.url )
			.forEach( link => {
				link.url = URL.resolve( this._handler.base || this.url, link.url );
				this.push(link);
			} );

		callback();
	}

};
