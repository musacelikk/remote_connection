"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import TechBackground from "./TechBackground";

const TOPIC = "motor/control";

type MqttEventHandler = (...args: unknown[]) => void;

type MqttClient = {
  connected: boolean;
  publish: (topic: string, message: string) => void;
  subscribe: (topic: string) => void;
  on: (event: string, handler: MqttEventHandler) => void;
  end: () => void;
};

type MqttGlobal = Window &
  typeof globalThis & {
    mqtt?: {
      connect: (url: string, options: { username: string; password: string }) => MqttClient;
    };
  };

export default function MotorControl() {
  const { user, logout, changePassword } = useAuth();
  const clientRef = useRef<MqttClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("Bağlanıyor...");
  const [lastCommand, setLastCommand] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [settingsError, setSettingsError] = useState("");
  const [settingsSuccess, setSettingsSuccess] = useState("");

  useEffect(() => {
    // MQTT CDN scriptini ekle
    const script = document.createElement("script");
    script.src = "https://unpkg.com/mqtt/dist/mqtt.min.js";
    script.onload = () => {
      console.log("MQTT CDN yüklendi!");

      // --- 🔥 HiveMQ Cloud WEB SOCKET bağlantısı ---
      const mqttGlobal = window as MqttGlobal;
      const mqttLibrary = mqttGlobal.mqtt;
      if (!mqttLibrary) {
        console.error("MQTT kütüphanesi yüklenemedi!");
        setConnectionStatus("MQTT kütüphanesi yüklenemedi");
        return;
      }

      const client = mqttLibrary.connect("wss://5ea19a4f93b54b1a9b3944441bb6b45e.s1.eu.hivemq.cloud:8884/mqtt", {
        username: "musacelik",
        password: "132228071.Aa",
      });

      clientRef.current = client;

      client.on("connect", () => {
        console.log("MQTT: HiveMQ Cloud bağlantısı başarılı!");
        client.subscribe(TOPIC);
        console.log("Topic'e abone olundu:", TOPIC);
        setIsConnected(true);
        setConnectionStatus("Bağlı");
      });

      client.on("message", (topic: string, message: { toString: () => string }) => {
        console.log("MQTT Mesaj:", topic, "->", message.toString());
      });

      client.on("error", (err: unknown) => {
        console.error("MQTT Hatası:", err);
        setIsConnected(false);
        setConnectionStatus("Bağlantı Hatası");
      });

      client.on("close", () => {
        console.warn("MQTT bağlantısı kapandı");
        setIsConnected(false);
        setConnectionStatus("Bağlantı Kapandı");
      });
    };

    document.body.appendChild(script);

    return () => {
      clientRef.current?.end();
    };
  }, []);

  function sendCommand(cmd: string) {
    const client = clientRef.current;
    if (!client || !client.connected) {
      console.warn("MQTT bağlı değil, komut gönderilemedi:", cmd);
      alert("MQTT bağlantısı yok! Lütfen bağlantıyı kontrol edin.");
      return;
    }
    client.publish(TOPIC, cmd);
    console.log("Komut gönderildi:", cmd);
    setLastCommand(cmd);
    setTimeout(() => setLastCommand(null), 2000);
  }

  const getCommandLabel = (cmd: string) => {
    const labels: { [key: string]: string } = {
      forward: "İleri",
      backward: "Geri",
      stop: "Dur",
    };
    return labels[cmd] || cmd;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
    setSettingsError("");
    setSettingsSuccess("");
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsError("");
    setSettingsSuccess("");

    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setSettingsError("Tüm alanları doldurunuz!");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setSettingsError("Yeni şifre en az 6 karakter olmalıdır!");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setSettingsError("Yeni şifreler eşleşmiyor!");
      return;
    }

    try {
      await changePassword(passwordData.currentPassword, passwordData.newPassword);
      setSettingsSuccess("Şifre başarıyla değiştirildi!");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      
      setTimeout(() => {
        setSettingsSuccess("");
      }, 3000);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Şifre değiştirme başarısız!";
      setSettingsError(message);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        fontFamily: "Helvetica, Arial, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Sol Taraf - Bilgiler ve Durum (TechBackground burada) */}
      <div
        style={{
          flex: "0 0 60%",
          width: "60%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 112px",
          position: "relative",
          zIndex: 1,
          background: "#1a1a1a",
        }}
        className="control-left"
      >
        <TechBackground />
        <div style={{ position: "relative", zIndex: 2 }}>
          <h1
            style={{
              fontSize: "64px",
              fontWeight: "bold",
              background: "linear-gradient(135deg, #A6A6A6 0%, #0A0875 50%, #000000 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              margin: "0 0 16px 0",
              letterSpacing: "-1px",
            }}
          >
            KepenxIA
          </h1>
          <p
            style={{
              fontSize: "28px",
              color: "#e8e8e8",
              margin: "0 0 40px 0",
              lineHeight: "32px",
              maxWidth: "500px",
            }}
          >
            Motor Kontrol Paneli
          </p>

          {/* Kullanıcı Bilgileri */}
          <div
            style={{
              background: "rgba(45, 45, 45, 0.6)",
              backdropFilter: "blur(10px)",
              borderRadius: "8px",
              padding: "24px",
              marginBottom: "24px",
              border: "1px solid rgba(74, 144, 226, 0.2)",
            }}
          >
            <div style={{ marginBottom: "16px" }}>
              <p
                style={{
                  fontSize: "14px",
                  color: "#b0b0b0",
                  margin: "0 0 4px 0",
                }}
              >
                Kullanıcı
              </p>
              <p
                style={{
                  fontSize: "18px",
                  color: "#e8e8e8",
                  margin: 0,
                  fontWeight: "600",
                }}
              >
                {user?.email || "Kullanıcı"}
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  background: isConnected ? "#4caf50" : "#f44336",
                  animation: isConnected ? "pulse 2s infinite" : "none",
                  boxShadow: isConnected
                    ? "0 0 8px rgba(76, 175, 80, 0.6)"
                    : "none",
                }}
              />
              <span
                style={{
                  color: isConnected ? "#4caf50" : "#f44336",
                  fontSize: "16px",
                  fontWeight: "600",
                }}
              >
                {connectionStatus}
              </span>
            </div>
          </div>

          {lastCommand && (
            <div
              style={{
                background: "rgba(74, 144, 226, 0.2)",
                border: "1px solid rgba(74, 144, 226, 0.4)",
                borderRadius: "8px",
                padding: "16px",
                marginBottom: "24px",
              }}
            >
              <p
                style={{
                  fontSize: "14px",
                  color: "#b0b0b0",
                  margin: "0 0 8px 0",
                }}
              >
                Son Komut
              </p>
              <p
                style={{
                  fontSize: "20px",
                  color: "#4a90e2",
                  margin: 0,
                  fontWeight: "bold",
                }}
              >
                {getCommandLabel(lastCommand)}
              </p>
            </div>
          )}

          {/* Ayarlar Bölümü */}
          <div
            style={{
              background: "rgba(45, 45, 45, 0.6)",
              backdropFilter: "blur(10px)",
              borderRadius: "8px",
              padding: "24px",
              marginBottom: "24px",
              border: "1px solid rgba(74, 144, 226, 0.2)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
                cursor: "pointer",
              }}
              onClick={() => setShowSettings(!showSettings)}
            >
              <h3
                style={{
                  fontSize: "20px",
                  fontWeight: "bold",
                  color: "#4a90e2",
                  margin: 0,
                }}
              >
                ⚙️ Ayarlar
              </h3>
              <span
                style={{
                  color: "#b0b0b0",
                  fontSize: "20px",
                  transform: showSettings ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.3s",
                }}
              >
                ▼
              </span>
            </div>

            {showSettings && (
              <div style={{ marginTop: "20px" }}>
                <form onSubmit={handlePasswordSubmit}>
                  <h4
                    style={{
                      fontSize: "16px",
                      fontWeight: "600",
                      color: "#e8e8e8",
                      margin: "0 0 16px 0",
                    }}
                  >
                    Şifre Değiştir
                  </h4>

                  {settingsError && (
                    <div
                      style={{
                        background: "rgba(244, 67, 54, 0.2)",
                        border: "1px solid rgba(244, 67, 54, 0.4)",
                        color: "#f44336",
                        padding: "12px",
                        borderRadius: "6px",
                        marginBottom: "16px",
                        fontSize: "14px",
                      }}
                    >
                      {settingsError}
                    </div>
                  )}

                  {settingsSuccess && (
                    <div
                      style={{
                        background: "rgba(76, 175, 80, 0.2)",
                        border: "1px solid rgba(76, 175, 80, 0.4)",
                        color: "#4caf50",
                        padding: "12px",
                        borderRadius: "6px",
                        marginBottom: "16px",
                        fontSize: "14px",
                      }}
                    >
                      {settingsSuccess}
                    </div>
                  )}

                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    placeholder="Mevcut Şifre"
                    required
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      fontSize: "15px",
                      borderRadius: "6px",
                      border: "1px solid #404040",
                      background: "#1a1a1a",
                      color: "#e8e8e8",
                      marginBottom: "12px",
                      boxSizing: "border-box",
                      outline: "none",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#4a90e2";
                      e.target.style.background = "#252525";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#404040";
                      e.target.style.background = "#1a1a1a";
                    }}
                  />

                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="Yeni Şifre"
                    required
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      fontSize: "15px",
                      borderRadius: "6px",
                      border: "1px solid #404040",
                      background: "#1a1a1a",
                      color: "#e8e8e8",
                      marginBottom: "12px",
                      boxSizing: "border-box",
                      outline: "none",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#4a90e2";
                      e.target.style.background = "#252525";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#404040";
                      e.target.style.background = "#1a1a1a";
                    }}
                  />

                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="Yeni Şifre (Tekrar)"
                    required
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      fontSize: "15px",
                      borderRadius: "6px",
                      border: "1px solid #404040",
                      background: "#1a1a1a",
                      color: "#e8e8e8",
                      marginBottom: "16px",
                      boxSizing: "border-box",
                      outline: "none",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#4a90e2";
                      e.target.style.background = "#252525";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#404040";
                      e.target.style.background = "#1a1a1a";
                    }}
                  />

                  <button
                    type="submit"
                    style={{
                      width: "100%",
                      padding: "12px",
                      background: "#4a90e2",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "16px",
                      fontWeight: "600",
                      transition: "background 0.2s",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = "#3a7bc8";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = "#4a90e2";
                    }}
                  >
                    Şifreyi Değiştir
                  </button>
                </form>
              </div>
            )}
          </div>

          <button
            onClick={logout}
            style={{
              padding: "12px 24px",
              background: "rgba(244, 67, 54, 0.2)",
              color: "#f44336",
              border: "1px solid rgba(244, 67, 54, 0.4)",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "600",
              transition: "all 0.2s",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "rgba(244, 67, 54, 0.3)";
              e.currentTarget.style.borderColor = "rgba(244, 67, 54, 0.6)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "rgba(244, 67, 54, 0.2)";
              e.currentTarget.style.borderColor = "rgba(244, 67, 54, 0.4)";
            }}
          >
            Çıkış Yap
          </button>
        </div>
      </div>

      {/* Sağ Taraf - Kontrol Paneli (Siyah arka plan) */}
      <div
        style={{
          flex: "0 0 40%",
          width: "40%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
          position: "relative",
          zIndex: 1,
          background: "#000000",
        }}
        className="control-right"
      >
        <div
          style={{
            background: "rgba(45, 45, 45, 0.95)",
            backdropFilter: "blur(10px)",
            borderRadius: "8px",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1), 0 8px 16px rgba(0, 0, 0, 0.1)",
            padding: "32px",
            width: "100%",
            maxWidth: "400px",
          }}
        >
          <h2
            style={{
              fontSize: "28px",
              fontWeight: "bold",
              color: "#4a90e2",
              margin: "0 0 12px 0",
              textAlign: "center",
            }}
          >
            Motor Kontrolü
          </h2>
          <p
            style={{
              fontSize: "14px",
              color: "#b0b0b0",
              margin: "0 0 32px 0",
              textAlign: "center",
            }}
          >
            Butonlara bastığında ESP32 motor çalışacak
          </p>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <button
              onClick={() => sendCommand("forward")}
              disabled={!isConnected}
              style={{
                padding: "16px 24px",
                background: isConnected
                  ? "linear-gradient(135deg, #4caf50 0%, #45a049 100%)"
                  : "#404040",
                color: "white",
                borderRadius: "8px",
                border: "none",
                cursor: isConnected ? "pointer" : "not-allowed",
                fontSize: "18px",
                fontWeight: "600",
                transition: "all 0.2s",
                boxShadow: isConnected
                  ? "0 4px 12px rgba(76, 175, 80, 0.3)"
                  : "none",
              }}
              onMouseOver={(e) => {
                if (isConnected) {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 6px 16px rgba(76, 175, 80, 0.4)";
                }
              }}
              onMouseOut={(e) => {
                if (isConnected) {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(76, 175, 80, 0.3)";
                }
              }}
            >
              ⬆️ İleri
            </button>

            <button
              onClick={() => sendCommand("stop")}
              disabled={!isConnected}
              style={{
                padding: "16px 24px",
                background: isConnected
                  ? "linear-gradient(135deg, #ff9800 0%, #f57c00 100%)"
                  : "#404040",
                color: "white",
                borderRadius: "8px",
                border: "none",
                cursor: isConnected ? "pointer" : "not-allowed",
                fontSize: "18px",
                fontWeight: "600",
                transition: "all 0.2s",
                boxShadow: isConnected
                  ? "0 4px 12px rgba(255, 152, 0, 0.3)"
                  : "none",
              }}
              onMouseOver={(e) => {
                if (isConnected) {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 6px 16px rgba(255, 152, 0, 0.4)";
                }
              }}
              onMouseOut={(e) => {
                if (isConnected) {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(255, 152, 0, 0.3)";
                }
              }}
            >
              ⏹️ Dur
            </button>

            <button
              onClick={() => sendCommand("backward")}
              disabled={!isConnected}
              style={{
                padding: "16px 24px",
                background: isConnected
                  ? "linear-gradient(135deg, #f44336 0%, #d32f2f 100%)"
                  : "#404040",
                color: "white",
                borderRadius: "8px",
                border: "none",
                cursor: isConnected ? "pointer" : "not-allowed",
                fontSize: "18px",
                fontWeight: "600",
                transition: "all 0.2s",
                boxShadow: isConnected
                  ? "0 4px 12px rgba(244, 67, 54, 0.3)"
                  : "none",
              }}
              onMouseOver={(e) => {
                if (isConnected) {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 6px 16px rgba(244, 67, 54, 0.4)";
                }
              }}
              onMouseOut={(e) => {
                if (isConnected) {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(244, 67, 54, 0.3)";
                }
              }}
            >
              ⬇️ Geri
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}

