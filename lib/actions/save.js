/**
 *  Save the response to the database
 *
 *  This acts as a sink
 */
'use strict';

module.exports = function( options ) {

    const dataStore = options && options.dataStore || {
        addResponse() {
            return Promise.resolve();
        },
    };

    return function( response ) {

        response.onEnd( () => {
            return dataStore.addResponse( response );
        } );

        return response;

    };

};