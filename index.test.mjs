import { test } from "node:test";
import assert from "node:assert";
import sandbox from "@architect/sandbox";
import arc from "@architect/functions";
import { marshall } from "@aws-sdk/util-dynamodb";

class ModelMeta {
  constructor(metadata) {
    Object.assign(this, metadata);
  }
}

class Model {
  constructor(data, metadata) {
    this.PK = data.id;
    this.SK = "A";

    this.data = data;
    this.metadata = new ModelMeta(metadata);
  }
}

test("passing Model with metadata: new Metadata", async (ctx) => {
  ctx.after(async () => {
    await sandbox.end();
  });

  ctx.mock.timers.enable({ apis: ["Date"] });

  await sandbox.start({ quiet: true });

  const model = new Model(
    {
      id: "1234",
      name: "Axol",
    },
    {
      time: Date.now(),
    }
  );

  const tables = await arc.tables();
  const tableName = tables.name("data");

  await ctx.test("_doc", () => {
    tables._doc.put(
      {
        TableName: tableName,
        Item: model,
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
      marshall(model);
    }, /Pass options.convertClassInstanceToMap=true/);
  });

  await ctx.test("marshall with options does not throw", () => {
    assert.doesNotThrow(() => {
      marshall(model, {
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
          Item: marshall(model, {
            convertClassInstanceToMap: true,
          }),
        },
        done
      );
    }
  );
});
