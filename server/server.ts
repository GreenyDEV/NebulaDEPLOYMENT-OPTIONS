import { createWriteStream } from "node:fs";
import { constants, access, mkdir } from "node:fs/promises";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";
import fastifyCompress from "@fastify/compress";
import fastifyHelmet from "@fastify/helmet";
import fastifyMiddie from "@fastify/middie";
import fastifyMultipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import chalk from "chalk";
import Fastify, { FastifyReply, FastifyRequest } from "fastify";
import gradient from "gradient-string";
import { parsedDoc } from "./config.js";
import { setupDB } from "./dbSetup.js";
import { catalogAssets, marketplaceAPI } from "./marketplace.js";
import { serverFactory } from "./serverFactory.js";

const app = Fastify({
  logger: parsedDoc.server.server.logging,
  ignoreDuplicateSlashes: true,
  ignoreTrailingSlash: true,
  serverFactory: serverFactory
});

await app.register(fastifyCompress, {
  encodings: ["br", "gzip", "deflate"]
});

await app.register(fastifyMultipart, {
  limits: {
    fileSize: 25 * 1024 * 1024,
    parts: Infinity
  },
});

await app.register(fastifyHelmet, {
  xPoweredBy: false,
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  contentSecurityPolicy: false //Disabled because astro DOES NOT LIKE IT
});

await app.register(fastifyStatic, {
  root: fileURLToPath(new URL("../dist/client", import.meta.url))
});

//Our marketplace API. Not middleware as I don't want to deal with that LOL. Just a function that passes our app to it.
if (parsedDoc.marketplace.enabled) {
  await app.register(fastifyStatic, {
    root: fileURLToPath(new URL("../database_assets", import.meta.url)),
    prefix: "/packages/",
    decorateReply: false
  });
  marketplaceAPI(app);
}

await app.register(fastifyMiddie);
if (process.env.NODE_ENV === "production") {
  //@ts-ignore WHY would I want this typechecked AT ALL
  const { handler: ssrHandler } = await import("../dist/server/entry.mjs")
  app.use(ssrHandler);
}
const port: number =
  parseInt(process.env.PORT as string) || parsedDoc.server.server.port || parseInt("8080");
const titleText = `
 _   _      _           _         ____                  _
| \\ | | ___| |__  _   _| | __ _  / ___|  ___ _ ____   _(_) ___ ___  ___
|  \\| |/ _ \\ '_ \\| | | | |/ _' | \\___ \\ / _ \\ '__\\ \\ / / |/ __/ _ \\/ __|
| |\\  |  __/ |_) | |_| | | (_| |  ___) |  __/ |   \\ V /| | (_|  __/\\__ \\
|_| \\_|\\___|_.__/ \\__,_|_|\\__,_| |____/ \\___|_|    \\_/ |_|\\___\\___||___/
`;
const titleColors = {
  purple: "#7967dd",
  pink: "#eb6f92"
};

console.log(gradient(Object.values(titleColors)).multiline(titleText as string));
app.listen({ port: port, host: "0.0.0.0" }).then(async () => {
  console.log(
    chalk.hex("#7967dd")(
      `Server listening on ${chalk.hex("#eb6f92").bold("http://localhost:" + port + "/")}`
    )
  );
  console.log(
    chalk.hex("#7967dd")(
      `Server also listening on ${chalk.hex("#eb6f92").bold("http://0.0.0.0:" + port + "/")}`
    )
  );
  if (parsedDoc.marketplace.enabled) {
    await catalogAssets.sync();
    await setupDB(catalogAssets);
  }
});
