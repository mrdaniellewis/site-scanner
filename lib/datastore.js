'use strict';

module.exports = class {

    constructor( options ) {

        this.init( options );
        
    }

    init() {
        
        this.references = [];
        this.responses = new Map();

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

        const save = Object.assign( {}, result );
        this.responses.set( save.url, save );
        return Promise.resolve();

    }

};