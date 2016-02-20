'use strict';

const debug = require( 'debug' )( 'site-scanner:datastore' );

module.exports = class {

    constructor() {

        this.init();
        
    }

    init() {
        
        this.references = [];
        this.responses = new Map();
        this.queued = new Set();

    }

    setQueued( url ) {
        
        this.queued.add( url );
        return Promise.resolve();

    }

    isQueued( url ) {
    
        return Promise.resolve( this.queued.has( url ) );

    }

    /**
     *  Add a reference to the database
     */
    addReference( reference ) {

        this.references.push( reference );
        return Promise.resolve();
       
    }

    /**
     *  Add a result to the database
     */
    addResponse( result ) {

        this.responses.set( result.url, result );
        return Promise.resolve();

    }

};