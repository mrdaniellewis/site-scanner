# Site scanner

Crawls a website.  Base libraries for crawling and performing actions
on the results.

Very much a work in progress. 

## Todo

* figure out how to handle errors
* write all references in a single request

### Issues

* error handling
* normalise links in link-manager before using
* Do we need to create our own agent?
* datastore case

### Features

* support data uris
* error handling
* broken link requester
* max-redirects
* run redirects immediately
* Add referer
* replace content-type with something that doesn't error
* Probably don't make actual requests during the tests
* Add reference object type
* Add user-agent
* Move all saving into save

Stuff to save
* headers
* body
* size
* timing
* meta
* references
* url
* time
* css classes
* broken links