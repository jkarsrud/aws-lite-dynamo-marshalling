# Reproduction for aws-lite marshalling errors

This repo has two branches; main uses @architect/functions v7 and the @aws-sdk/*-dynamodb packages.
[arc-fns-8](https://github.com/jkarsrud/aws-lite-dynamo-marshalling/tree/arc-fns-8) uses @architect/function v8 and @aws-lite.

`index.test.mjs` has tests that should give enough information, and in `arc-fns-8` the tests are failing, but should be okay if a fix is made (somehow)

## The issue:

When passing an object where a field is a class instance, DynamoDB requires that class instance property to be converted into a Map.
DynamoDB suggests doing this by passing `options.convertClassInstanceToMap=true`, but aws-lite and/or @architect/functions v8 has no way of passing this option.

The result of course is that write operations will fail.

An example of this type of object could be something like this

``` js
class Metadata {
  constructor(metadata) {
    if (!metadata.timestamp)
      throw TypeError("Missing required field 'timestamp'");

    Object.assign(this, metadata);
  }
}

class Event {
  constructor(data, metadata) {
    this.PK = data.id;
    this.SK = "A";

    this.data = data;
    this.metadata = new Metadata(metadata);
  }
}

const event = new Event(
  {
    id: "1234",
    name: "Axol",
  },
  {
    timestamp: Date.now(),
  }
);
```

The code above yields the following:

```
Event {
  PK: '1234',
  SK: 'A',
  data: { id: '1234', name: 'Axol' },
  metadata: Metadata { timestamp: 1709764321372 }
}
```

Dynamo has no issue with the object being passed to an operation being a class instance as long as the fields on that instance are supported.


