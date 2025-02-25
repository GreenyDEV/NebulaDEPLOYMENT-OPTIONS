import { createServer } from "node:http";
import { FastifyServerFactory, FastifyServerFactoryHandler, RawServerDefault } from "fastify";
import wisp from "wisp-server-node";
import { LOG_LEVEL, WispOptions } from "wisp-server-node/dist/Types.js";
import { parsedDoc } from "./config.js";

const wispOptions: WispOptions = {
    logLevel: parsedDoc.server.server.logging ? LOG_LEVEL.DEBUG : LOG_LEVEL.NONE,
    pingInterval: 30
};

const serverFactory: FastifyServerFactory = (
    handler: FastifyServerFactoryHandler
): RawServerDefault => {
    const httpServer = createServer();
    httpServer.on("request", (req, res) => {
        handler(req, res);
    });
    httpServer.on("upgrade", (req, socket, head) => {
        if (parsedDoc.server.server.wisp) {
            if (req.url?.endsWith("/wisp/")) {
                wisp.routeRequest(req, socket as any, head, wispOptions);
            }
        }
    });
    return httpServer;
};

export { serverFactory, wispOptions };
