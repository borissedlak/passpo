# README

## Paradigms
1. Always test the API and in case of errors those must always be sent back to the requestor, ideally with correct HTTP status code. See [Status Codes]("https://de.wikipedia.org/wiki/HTTP-Statuscode") for a list of all HTTP status codes.


## POST flag data
When posting flag data it is important, besides the facebook token authentication, to use the correct flag data structure (see below). The owner represents the object id from the user db, therefore it must be present in the other collection, otherwise it will throw an error. 

```json
{
    "flag": {
        "pos": {
        	"origin":{
        		"lat": 123,
        		"long": 456
        	},
        	"destination":{
        		"lat": 123,
        		"long": 456
        	},
        	"current":{
        		"lat": 123,
        		"long": 456
        	}
        },
        "owner":"59ef3b0052b4ff151fd896d8"
    }
}
```