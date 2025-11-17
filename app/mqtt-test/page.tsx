"use client";

import { useEffect, useRef } from "react";

const TOPIC = "motor/control";

export default function MqttTestPage() {
  const clientRef = useRef<any>(null);

  useEffect(() => {
    // MQTT CDN scriptini ekle
    const script = document.createElement("script");
    script.src = "https://unpkg.com/mqtt/dist/mqtt.min.js";
    script.onload = () => {
      console.log("MQTT CDN yüklendi!");

      // --- 🔥 HiveMQ Cloud WEB SOCKET bağlantısı ---
      const client = (window as any).mqtt.connect(
        "wss://5ea19a4f93b54b1a9b3944441bb6b45e.s1.eu.hivemq.cloud:8884/mqtt",
        {
          username: "musacelik",
          password: "132228071.Aa",
        }
      );

      clientRef.current = client;

      client.on("connect", () => {
        console.log("MQTT: HiveMQ Cloud bağlantısı başarılı!");
        client.subscribe(TOPIC);
        console.log("Topic'e abone olundu:", TOPIC);
      });

      client.on("message", (topic: string, message: any) => {
        console.log("MQTT Mesaj:", topic, "->", message.toString());
      });

      client.on("error", (err: any) => {
        console.error("MQTT Hatası:", err);
      });

      client.on("close", () => {
        console.warn("MQTT bağlantısı kapandı");
      });
    };

    document.body.appendChild(script);

    return () => {
      if (clientRef.current) clientRef.current.end();
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
        fontFamily: "Arial",
      }}
    >
      <h1>MQTT Motor Kontrol</h1>
      <p>Butonlara bastığında ESP32 motor çalışacak.</p>

      <div style={{ display: "flex", gap: "20px" }}>
        <button
          style={{
            padding: "15px 30px",
            background: "#4caf50",
            color: "#fff",
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
          }}
          onClick={() => sendCommand("forward")}
        >
          İleri
        </button>

        <button
          style={{
            padding: "15px 30px",
            background: "#555",
            color: "#fff",
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
          }}
          onClick={() => sendCommand("stop")}
        >
          Dur
        </button>

        <button
          style={{
            padding: "15px 30px",
            background: "#f44336",
            color: "#fff",
            borderRadius: 8,
            border: "none",
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
