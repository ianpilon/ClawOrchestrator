import { Server } from "http";
import WebSocket, { WebSocketServer } from "ws";
import { log } from "./index";

const XAI_API_KEY = process.env.XAI_API_KEY;
const XAI_REALTIME_URL = "wss://api.x.ai/v1/realtime";

export function setupVoiceWebSocket(httpServer: Server) {
  const wss = new WebSocketServer({ server: httpServer, path: "/voice" });

  wss.on("connection", (clientWs) => {
    log("Voice client connected", "voice");

    if (!XAI_API_KEY) {
      log("XAI_API_KEY not configured", "voice");
      clientWs.close(1008, "XAI_API_KEY not configured");
      return;
    }

    let xaiWs: WebSocket | null = null;

    try {
      xaiWs = new WebSocket(XAI_REALTIME_URL, {
        headers: {
          Authorization: `Bearer ${XAI_API_KEY}`,
          "X-Api-Version": "2024-10-01",
        },
      });
    } catch (err) {
      log(`Failed to connect to xAI: ${err}`, "voice");
      clientWs.close(1011, "Failed to connect to xAI");
      return;
    }

    xaiWs.on("open", () => {
      log("Connected to xAI Realtime API", "voice");

      xaiWs!.send(
        JSON.stringify({
          type: "session.update",
          session: {
            voice: "Ara",
            instructions:
              "You are a helpful assistant integrated into a talent reconnaissance system called SentriX. When users ask about people or request to see profiles, provide brief helpful responses. Keep responses concise and professional.",
            audio: {
              input: {
                format: {
                  type: "audio/pcm",
                  rate: 24000,
                },
              },
              output: {
                format: {
                  type: "audio/pcm",
                  rate: 24000,
                },
              },
            },
          },
        })
      );

      clientWs.send(JSON.stringify({ type: "session.ready" }));
    });

    clientWs.on("message", (data) => {
      if (xaiWs?.readyState === WebSocket.OPEN) {
        if (data instanceof Buffer) {
          xaiWs.send(
            JSON.stringify({
              type: "audio.append",
              audio: data.toString("base64"),
            })
          );
        } else {
          try {
            const message = JSON.parse(data.toString());
            xaiWs.send(JSON.stringify(message));
          } catch {
            log("Failed to parse client message", "voice");
          }
        }
      }
    });

    xaiWs.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString());
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(JSON.stringify(message));
        }
      } catch {
        log("Failed to parse xAI message", "voice");
      }
    });

    xaiWs.on("error", (err) => {
      log(`xAI WebSocket error: ${err.message}`, "voice");
      clientWs.close(1011, "xAI connection error");
    });

    xaiWs.on("close", () => {
      log("xAI connection closed", "voice");
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.close();
      }
    });

    clientWs.on("close", () => {
      log("Voice client disconnected", "voice");
      if (xaiWs?.readyState === WebSocket.OPEN) {
        xaiWs.close();
      }
    });

    clientWs.on("error", (err) => {
      log(`Client WebSocket error: ${err.message}`, "voice");
      if (xaiWs?.readyState === WebSocket.OPEN) {
        xaiWs.close();
      }
    });
  });

  log("Voice WebSocket server initialized on /voice", "voice");
  return wss;
}
