# Site scanner

Crawls a website.  Base libraries for crawling and performing actions
on the results.

Very much a work in progress. 

## Todo

### Issues

* fifo - version that doesn't return promises
* fifo - database yielder
* coroutine - cache fn
* Queue warnings
* add some logging, particularly of link queuing
* error handling
* normalise links in link-manager before using
* merge queue into promise-util
  * Make it easier to resolve a defer
  * Should coroutine return a reusable function?
* Do we need to create our own agent?
* datastore case

### Features

* support data uris
* extra meta data
* error handling
* elastic search datastore
* broken link requester
* css inline styles
* max-redirects
* Add referer
* Other types of links
  * srcset
  * picture
  * alternative action on forms
* replace content-type with something that doesn't error
* Other http headers that can return a link
* Meta tags that can contain links
* Probably don't make actual requests during the tests

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