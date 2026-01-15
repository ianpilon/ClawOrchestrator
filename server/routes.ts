import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupVoiceWebSocket } from "./voice";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup voice WebSocket for xAI Realtime API
  setupVoiceWebSocket(httpServer);

  return httpServer;
}
