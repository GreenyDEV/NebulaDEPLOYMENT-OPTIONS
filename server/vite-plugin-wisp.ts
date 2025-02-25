import { Socket } from "node:net";
import wisp from "wisp-server-node";
import { wispOptions } from "./serverFactory";

export const wispPlugin = {
    name: "vite-plugin-wisp",
    configureServer(server) {
        server.wisp = wisp;
        server.httpServer?.on("upgrade", (req, socket: Socket, head) =>
            req.url?.endsWith("/wisp/")
                ? wisp.routeRequest(req, socket, head, wispOptions)
                : undefined
        );
    }
};
