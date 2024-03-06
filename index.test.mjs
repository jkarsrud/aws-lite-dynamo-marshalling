import { test } from "node:test";
import assert from "node:assert";
import sandbox from "@architect/sandbox";
import arc from "@architect/functions";

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

  try {
    await tables.data.put(event);
    assert.ok("Did not throw!");
  } catch (ex) {
    assert(
      /convertClassInstanceToMap=true/.test(ex),
      "Throws error about converting class instance to map"
    );
    assert.fail(ex);
  }

  try {
    await tables._client.PutItem({
      TableName: tableName,
      Item: event,
    });
    assert.ok("Did not throw!");
  } catch (ex) {
    assert(
      /convertClassInstanceToMap=true/.test(ex),
      "Throws error about converting class instance to map"
    );
    assert.fail(ex);
  }
});
