import { Server } from "socket.io";
import type { Server as HTTPServer } from "http";

export function initializeSocket(httpServer: HTTPServer) {
  const io = new Server(httpServer, {
    cors: { origin: "*" },
  });

  io.on("connection", (socket) => {
    console.log(`[Socket] User connected: ${socket.id}`);

    socket.on("sale:created", (data) => {
      io.emit("sale:notification", {
        type: "sale_created",
        message: `Nova venda registrada: ${data.property}`,
        timestamp: new Date(),
      });
    });

    socket.on("commission:updated", (data) => {
      io.emit("commission:notification", {
        type: "commission_updated",
        message: `Comissão atualizada: R$ ${data.amount}`,
        timestamp: new Date(),
      });
    });

    socket.on("disconnect", () => {
      console.log(`[Socket] User disconnected: ${socket.id}`);
    });
  });

  return io;
}
