import { test } from "node:test";
import assert from "node:assert";
import sandbox from "@architect/sandbox";
import arc from "@architect/functions";
import { marshall } from "@aws-sdk/util-dynamodb";

class Metadata {
  constructor(metadata) {
    if (metadata.timestamp == null)
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

test("passing Model with metadata: new Metadata", async (ctx) => {
  ctx.after(async () => {
    await sandbox.end();
  });

  await sandbox.start({ quiet: true });

  const event = new Event(
    {
      id: "1234",
      name: "Axol",
    },
    {
      timestamp: Date.now(),
    }
  );

  const tables = await arc.tables();
  const tableName = tables.name("data");

  await ctx.test("_doc", () => {
    tables._doc.put(
      {
        TableName: tableName,
        Item: event,
      },
      (err) => {
        assert(
          /convertClassInstanceToMap=true/.test(err),
          "Throws error about class instances"
        );
      }
    );
  });

  await ctx.test("marshall without options throws", () => {
    assert.throws(() => {
      marshall(event);
    }, /Pass options.convertClassInstanceToMap=true/);
  });

  await ctx.test("marshall with options does not throw", () => {
    assert.doesNotThrow(() => {
      marshall(event, {
        convertClassInstanceToMap: true,
      });
    }, /Pass options.convertClassInstanceToMap=true/);
  });

  await ctx.test(
    "putting marshalled object with options is a-okay",
    (_, done) => {
      tables._db.putItem(
        {
          TableName: tableName,
          Item: marshall(event, {
            convertClassInstanceToMap: true,
          }),
        },
        async () => {
          const { PK, SK } = event;
          const item = await tables.data.get({ PK, SK });
          console.log(item);
          done();
        }
      );
    }
  );
});
