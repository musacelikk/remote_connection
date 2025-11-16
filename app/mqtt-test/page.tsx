"use client";

import { useEffect, useRef } from "react";
import mqtt, { MqttClient } from "mqtt";

const TOPIC = "motor/control";

export default function MqttTestPage() {
  const clientRef = useRef<MqttClient | null>(null);

  useEffect(() => {
    // HiveMQ WebSocket broker
    const client = mqtt.connect("wss://broker.hivemq.com:8884/mqtt");
    clientRef.current = client;

    client.on("connect", () => {
      console.log("MQTT: Bağlantı başarılı!");
      client.subscribe(TOPIC);
      console.log("Topic'e abone olundu:", TOPIC);
    });

    client.on("message", (topic, message) => {
      console.log("MQTT Mesaj:", topic, "->", message.toString());
    });

    client.on("error", (err) => {
      console.error("MQTT Hatası:", err);
    });

    return () => {
      client.end();
    };
  }, []);

  function sendCommand(cmd: string) {
    const client = clientRef.current;
    if (!client || !client.connected) {
      console.warn("MQTT bağlı değil, komut gönderilemedi:", cmd);
      return;
    }
    client.publish(TOPIC, cmd);
    console.log("Komut gönderildi:", cmd);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1>MQTT Motor Kontrol Test</h1>
      <p>Konsolu aç (F12 → Console) ve log'ları izle.</p>

      <div style={{ display: "flex", gap: "20px" }}>
        <button
          style={{
            padding: "15px 30px",
            fontSize: "18px",
            background: "#4CAF50",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
          onClick={() => sendCommand("forward")}
        >
          İleri
        </button>

        <button
          style={{
            padding: "15px 30px",
            fontSize: "18px",
            background: "#555",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
          onClick={() => sendCommand("stop")}
        >
          Dur
        </button>

        <button
          style={{
            padding: "15px 30px",
            fontSize: "18px",
            background: "#f44336",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
          onClick={() => sendCommand("backward")}
        >
          Geri
        </button>
      </div>
    </main>
  );
}
