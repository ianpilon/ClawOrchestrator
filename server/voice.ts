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
              "You are Ara, a voice assistant integrated into the xAI Talent Grid - a global situational awareness and tactical talent reconnaissance system. The xAI Talent Grid visualizes professional networks of top AI talent across major organizations including xAI, OpenAI, Anthropic, DeepMind, Meta AI, Microsoft, Google, and Tesla. IMPORTANT: When users ask to find, show, or switch to any person's profile, you MUST respond with exactly 'Displaying [full name]' to trigger the profile display. For example: 'Displaying John Smith' or 'Displaying Sarah Johnson'. Always use the exact phrase 'Displaying [name]' when switching or showing any profile. Keep responses brief and tactical.",
            modalities: ["text", "audio"],
            input_audio_format: "pcm16",
            output_audio_format: "pcm16",
            turn_detection: {
              type: "server_vad",
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 800,
            },
          },
        })
      );

      clientWs.send(JSON.stringify({ type: "session.ready" }));
    });

    let audioChunkCount = 0;
    clientWs.on("message", (data) => {
      if (xaiWs?.readyState === WebSocket.OPEN) {
        if (data instanceof Buffer) {
          audioChunkCount++;
          if (audioChunkCount % 50 === 1) {
            log(`Audio chunk #${audioChunkCount}, size: ${data.length} bytes`, "voice");
          }
          xaiWs.send(
            JSON.stringify({
              type: "input_audio_buffer.append",
              audio: data.toString("base64"),
            })
          );
        } else {
          try {
            const message = JSON.parse(data.toString());
            log(`Client command: ${message.type}`, "voice");
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
        log(`xAI event: ${message.type}`, "voice");
        
        // Respond to ping to keep connection alive
        if (message.type === "ping") {
          xaiWs!.send(JSON.stringify({ type: "pong" }));
          return;
        }
        
        // Log session.updated details to verify VAD config
        if (message.type === "session.updated") {
          log(`Session updated - turn_detection: ${JSON.stringify(message.session?.turn_detection || 'none')}`, "voice");
        }
        
        // Log any errors
        if (message.type === "error") {
          log(`xAI ERROR: ${JSON.stringify(message.error)}`, "voice");
        }
        
        // When speech starts, log it
        if (message.type === "input_audio_buffer.speech_started") {
          log("Speech started - waiting for speech to stop", "voice");
        }
        
        // When speech stops, commit buffer and request response
        if (message.type === "input_audio_buffer.speech_stopped") {
          log("Speech stopped, committing buffer and requesting response", "voice");
          xaiWs!.send(JSON.stringify({ type: "input_audio_buffer.commit" }));
          xaiWs!.send(JSON.stringify({ type: "response.create" }));
        }
        
        // Log any response events
        if (message.type?.startsWith("response.")) {
          log(`Response event: ${message.type}`, "voice");
        }
        
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
