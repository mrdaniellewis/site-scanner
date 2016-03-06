'use strict';

const mock = require( 'mock-http' );

module.exports = function( _options ) {

    const options = _options || {};
    options.headers = options.headers || {};
    const response = new mock.Request( { buffer: options.buffer } );
    delete options.buffer;
    Object.assign( response, options );

    return response;

};