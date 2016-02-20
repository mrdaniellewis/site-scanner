'use strict';

const stream = require( 'stream' );

const debug = require( 'debug' )( 'test' );

class Parallel extends stream.Transform {

    constructor() {

        super( { objectMode: true } );

        this.limiter = 5;
        this.count = 0;

    }

    _transform( ob, encoding, callback ) {

        debug( 'parallel', ob, this.count );

        const content = {
            value: ob,
            contents: new stream.PassThrough( { objectMode: true } ),
        };

        this.push( content );
        content.contents.write( ob );

        content.contents.on( 'end', () => {
            debug( 'parallel:end', ob, this.count );
            --this.count;

            if ( this.count < this.limiter ) {
                this.uncork();
            }

        } );

        ++this.count;

        if ( this.count > this.limiter ) {
            debug( 'parallel:cork', this.count, this.limiter );
            this.cork();
        }

        callback();

        /*setTimeout( () => {
            debug( 'parallel:callback', ob );
            callback();
        }, 1000 );*/
    }

}

const consumer = new stream.Transform( {

    objectMode: true,

    transform( ob, encoding, callback ) {

        debug( 'consumer', ob.value );
        this.push( ob );
        // callback();

        setTimeout( () => {
            debug( 'consumer:callback', ob.value );
            ob.contents.resume();
            callback();
        }, 500 );

    },

} );

const parallel = new Parallel();

parallel
    .pipe( consumer )
    .pipe( new stream.PassThrough( { objectMode: true } ) ) 
    .resume();

Array.apply( null, Array( 10 ) )
    .map( ( _, i ) => i )
    .forEach( ( item, i ) => { 
        parallel.write( i );
    } );

parallel.end();
