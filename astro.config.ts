import { fileURLToPath } from "node:url";
import node from "@astrojs/node";
import svelte from "@astrojs/svelte";
import tailwind from "@astrojs/tailwind";
import { baremuxPath } from "@mercuryworkshop/bare-mux/node";
import { epoxyPath } from "@mercuryworkshop/epoxy-transport";
import { libcurlPath } from "@mercuryworkshop/libcurl-transport";
import { scramjetPath } from "@mercuryworkshop/scramjet";
import playformCompress from "@playform/compress";
import { uvPath } from "@titaniumnetwork-dev/ultraviolet";
import icon from "astro-icon";
import { defineConfig, envField } from "astro/config";
import { viteStaticCopy } from "vite-plugin-static-copy";
import { version } from "./package.json";
import { parsedDoc } from "./server/config.js";
import { wispPlugin } from "./server/vite-plugin-wisp";
const workerwarePath = fileURLToPath(new URL("./workerware/src", import.meta.url));

export default defineConfig({
    site: parsedDoc.seo.enabled
        ? parsedDoc.seo.domain || process.env.SITE
        : "http://localhost:4321",
    env: {
        schema: {
            VERSION: envField.string({
                context: "client",
                access: "public",
                optional: true,
                default: version
            }),
            MARKETPLACE_ENABLED: envField.boolean({
                context: "client",
                access: "public",
                optional: true,
                default: parsedDoc.marketplace.enabled
            }),
            SEO: envField.string({
                context: "client",
                access: "public",
                optional: true,
                default: JSON.stringify({
                    enabled: parsedDoc.seo.enabled,
                    domain: new URL(parsedDoc.seo.domain).host
                })
            })
        }
    },
    integrations: [
        tailwind(),
        //sitemap(),
        icon(),
        svelte(),
        playformCompress({
            CSS: false,
            HTML: true,
            Image: true,
            JavaScript: true,
            SVG: true
        })
    ],
    vite: {
        plugins: [
            viteStaticCopy({
                targets: [
                    {
                        src: `${uvPath}/**/*`.replace(/\\/g, "/"),
                        dest: "uv",
                        overwrite: false
                    },
                    {
                        src: `${epoxyPath}/**/*`.replace(/\\/g, "/"),
                        dest: "epoxy",
                        overwrite: false
                    },
                    {
                        src: `${libcurlPath}/**/*`.replace(/\\/g, "/"),
                        dest: "libcurl",
                        overwrite: false
                    },
                    {
                        src: `${scramjetPath}/**/*`.replace(/\\/g, "/"),
                        dest: "scram",
                        overwrite: false
                    },
                    {
                        src: `${baremuxPath}/**/*`.replace(/\\/g, "/"),
                        dest: "baremux",
                        overwrite: false
                    },
                    {
                        src: `${workerwarePath}/**/*`.replace(/\\/g, "/"),
                        dest: "workerware",
                        overwrite: false
                    }
                ]
            }),
            wispPlugin
        ],
        server: {
            proxy: {
                "/api/catalog-stats": {
                    target: "http://localhost:8080/api/catalog-stats",
                    changeOrigin: true,
                    rewrite: (path) => path.replace(/^\/api\/catalog-stats/, "")
                },
                "/api/catalog-assets": {
                    target: "http://localhost:8080/api/catalog-assets",
                    changeOrigin: true,
                    rewrite: (path) => path.replace(/^\/api\/catalog-assets/, "")
                },
                "/api/packages": {
                    target: "http://localhost:8080/api/packages",
                    changeOrigin: true,
                    rewrite: (path) => path.replace(/^\/api\/packages/, "")
                },
                "/packages": {
                    target: "http://localhost:8080",
                    changeOrigin: true
                },
                "/styles": {
                    target: "http://localhost:8080",
                    changeOrigin: true
                }
            }
        }
    },
    output: "server",
    adapter: node({
        mode: "middleware"
    })
});
