"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/routes/transaction.ts
var transaction_exports = {};
__export(transaction_exports, {
  transactionRoutes: () => transactionRoutes
});
module.exports = __toCommonJS(transaction_exports);
var import_node_crypto = require("crypto");
var import_zod2 = require("zod");

// src/database.ts
var import_knex = require("knex");

// src/env/index.ts
var import_dotenv = require("dotenv");
var import_zod = require("zod");
if (process.env.NODE_ENV === "test") {
  (0, import_dotenv.config)({ path: ".env.test" });
} else {
  (0, import_dotenv.config)();
}
var envSchema = import_zod.z.object({
  NODE_ENV: import_zod.z.enum(["development", "production", "test"]).default("production"),
  DATABASE_URL: import_zod.z.string(),
  PORT: import_zod.z.number().default(3332)
});
var _env = envSchema.safeParse(process.env);
if (_env.success === false) {
  console.error("Invalid environment variable.", _env.error.format());
  throw Error("Invalid environment variable.");
}
var env = _env.data;

// src/database.ts
var config2 = {
  client: "sqlite3",
  connection: {
    filename: env.DATABASE_URL
  },
  useNullAsDefault: true,
  // sqlite não suporta valores padroes e precisamos passar que os valores por padrao, será nulo
  migrations: {
    extension: "ts",
    directory: "./db/migrations"
  }
};
var knex = (0, import_knex.knex)(config2);

// src/middlewares/check-session-id-exists.ts
async function checkSessionIdExists(req, reply) {
  const sessionId = req.cookies.sessionId;
  if (!sessionId) {
    return reply.status(401).send({ error: "Unauthorized" });
  }
}

// src/routes/transaction.ts
async function transactionRoutes(app) {
  app.addHook("preHandler", async (req, reply) => {
    console.log("Transaction");
  });
  app.get(
    "/",
    {
      preHandler: [checkSessionIdExists]
    },
    async (req, reply) => {
      const sessionId = req.cookies.sessionId;
      const transaction = await knex("transactions").where("session_id", sessionId).select();
      return { transaction };
    }
  );
  app.get(
    "/:id",
    {
      preHandler: [checkSessionIdExists]
    },
    async (req) => {
      const sessionId = req.cookies.sessionId;
      const getTrasactionParamsSchema = import_zod2.z.object({
        id: import_zod2.z.string().uuid()
      });
      const { id } = getTrasactionParamsSchema.parse(req.params);
      const transaction = await knex("transactions").where({
        id,
        session_id: sessionId
      }).first();
      return { transaction };
    }
  );
  app.get(
    "/summary",
    {
      preHandler: [checkSessionIdExists]
    },
    async (req) => {
      const sessionId = req.cookies.sessionId;
      const summary = await knex("transactions").where("session_id", sessionId).sum("amount", { as: "amount" }).first();
      return { summary };
    }
  );
  app.post("/", async (req, reply) => {
    const createTransactionBodySchema = import_zod2.z.object({
      title: import_zod2.z.string(),
      amount: import_zod2.z.number(),
      type: import_zod2.z.enum(["credit", "debit"])
    });
    const { amount, title, type } = createTransactionBodySchema.parse(req.body);
    let sessionId = req.cookies.sessionId;
    if (!sessionId) {
      sessionId = (0, import_node_crypto.randomUUID)();
      reply.cookie("sessionId", sessionId, {
        path: "/",
        maxAge: 1e3 * 60 * 60 * 24 * 7
        // 7 days
      });
    }
    await knex("transactions").insert({
      id: (0, import_node_crypto.randomUUID)(),
      title,
      amount: type === "credit" ? amount : amount * -1,
      session_id: sessionId
    });
    return reply.status(201).send();
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  transactionRoutes
});
