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

      // MQTT bağlantısını başlat
      const client = (window as any).mqtt.connect("wss://broker.hivemq.com:8884/mqtt");
      clientRef.current = client;

      client.on("connect", () => {
        console.log("MQTT: Bağlantı başarılı!");
        client.subscribe(TOPIC);
        console.log("Topic'e abone olundu:", TOPIC);
      });

      client.on("message", (topic: string, message: any) => {
        console.log("MQTT Mesaj:", topic, "->", message.toString());
      });

      client.on("error", (err: any) => {
        console.error("MQTT Hatası:", err);
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
      console.warn("MQTT bağlı değil:", cmd);
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
      <p>Butonlara basınca ESP32 motor hareket etmeli.</p>

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
