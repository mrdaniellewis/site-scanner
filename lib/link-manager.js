/**
 *  Managers links
 */
'use strict';

const stream = require( 'stream' );
const urlUtils = require( 'url' );

const debug = require( 'debug' )( 'site-scanner:link-manager' );

const Datastore = require( './datastores/datastore' );


class LinkManager extends stream.Transform {

    /**
     *  @param {Integer} [options.highWaterMark=5] The number of parallel requests to run
     */
    constructor( _options ) {
        
        super( { objectMode: true } );

        const options = _options || {};

        this.datastore = options.datastore || new Datastore();

        if ( options.filter ) {
            this.filter = options.filter;
        }
        
        if ( debug.enabled ) {
            this.on( 'link', data => {
                debug( 'link', data );
            } );
        }

    }

    /**
     *  Filter incoming links that we don't want to visit
     *  A link event will be emitted with the result of this operation
     *
     *  @returns {Boolean} Always returns true
     */
    _transform( chunk, encoding, callback ) {

        debug( 'transform', chunk );

        if ( !chunk ) {
            callback();
            return true;
        }

        let url;

        if ( typeof chunk === 'string' ) {
            url = urlUtils.parse( chunk );
        } else if ( chunk instanceof urlUtils.Url ) {
            url = chunk;
        } else {
            const error = new Error( 'not a valid url' );
            error.url = chunk;
            this.emit( 'error', error );
            return;
        }

        url.hash = null;

        this._filter( url )
            .then( state => {

                this.emit( 'link', {
                    url,
                    state,
                } );

                if ( state === LinkManager.LINK_OK ) {

                    return this.datastore.setQueued( urlUtils.format( url ) )
                        .then( () => {
                            callback( null, {
                                uri: url,
                            } );
                        } );
                }

                callback();

            } )
            .catch( e => {
                this.emit( 'error', e );
            } );

        return true;

    }

     /**
     *  Should a url be requested
     *  @param {Url} url A parsed url
     *  @returns {Promise<Boolean>|Boolean} If true request the url
     */
    filter() {
        return true;
    }

    /**
     *  Should a url be requested
     *  @param {Url} url A parsed url
     *  @returns {Promise} If true request the url
     */
    _filter( url ) {

        if ( !url.protocol || !/^https?:/i.test( url.protocol ) ) {
            return Promise.resolve( LinkManager.LINK_WRONG_PROTOCOL );
        }

        if ( !url.host && !url.hostname ) {
            return Promise.resolve( LinkManager.LINK_NO_DOMAIN );
        }

        return Promise.resolve( this.filter( url ) )
            .then( result => {

                if ( !result ) {
                    return LinkManager.LINK_FILTERED;
                }

                return this._visited( url );

            } );

    }

    /**
     *  Have we already visited the url
     *  @param {Url} url A parsed url
     *  @returns {Promise<String>} A link state
     */
    _visited( url ) {

        return this.datastore.isQueued( urlUtils.format( url ) )
            .then( result => {

                return result
                    ? LinkManager.LINK_VISITED
                    : LinkManager.LINK_OK;

            } );

    }

}

// Link states
LinkManager.LINK_WRONG_PROTOCOL = 'wrong protocol';
LinkManager.LINK_NO_DOMAIN = 'no domain';
LinkManager.LINK_FILTERED = 'filtered';
LinkManager.LINK_VISITED = 'visited';
LinkManager.LINK_OK = 'ok';

module.exports = LinkManager;

