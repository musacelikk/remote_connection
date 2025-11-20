"use client";

import { useState } from "react";
import { useAuth } from "./context/AuthContext";
import MotorControl from "./components/MotorControl";
import RegisterForm from "./components/RegisterForm";
import TechBackground from "./components/TechBackground";
import GlobeSplash from "./components/GlobeSplash";

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [isProcessingLogin, setIsProcessingLogin] = useState(false);
  const [loginFadeIn, setLoginFadeIn] = useState(false);
  const [loginFadeOut, setLoginFadeOut] = useState(false);
  const [error, setError] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  // Login 2FA için state'ler
  const [showLoginCode, setShowLoginCode] = useState(false);
  const [loginCode, setLoginCode] = useState("");
  const [isVerifyingLoginCode, setIsVerifyingLoginCode] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSplashComplete = () => {
    setShowSplash(false);
    setTimeout(() => {
      setShowLogin(true);
    }, 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      // Email/password kontrolü ve kod gönderme
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: formData.email, password: formData.password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "E-posta veya şifre hatalı");
        setIsSubmitting(false);
        return;
      }

      // Kod gönderildi - kod giriş ekranını göster
      setIsSubmitting(false);
      // API'den dönen email'i kullan (normalize edilmiş) - MUTLAKA API'den gelen email'i kullan
      // API her zaman email döndürmeli, ama yine de fallback ekliyoruz
      if (!data.email) {
        console.error("API'den email dönmedi! Response:", data);
        setError("Sunucu hatası: Email bilgisi alınamadı");
        setIsSubmitting(false);
        return;
      }
      setLoginEmail(data.email);
      setShowLoginCode(true);
      setError(data.message || "E-postanıza giriş doğrulama kodu gönderildi");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Giriş başarısız! Lütfen bilgilerinizi kontrol edin.";
      setError(message);
      setIsSubmitting(false);
    }
  };

  // Login kodunu doğrula
  const handleVerifyLoginCode = async () => {
    // Kodu normalize et (trim, sadece rakamlar, string olarak)
    const normalizedCode = loginCode.trim().replace(/\D/g, "");
    
    if (!normalizedCode || normalizedCode.length !== 6) {
      setError("6 haneli kodu giriniz");
      return;
    }

    setIsVerifyingLoginCode(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login/verify-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          email: loginEmail.toLowerCase().trim(), // Normalize et
          code: normalizedCode // String olarak gönder
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Kod doğrulanamadı");
        setIsVerifyingLoginCode(false);
        return;
      }

      // Başarılı - token ve kullanıcı bilgisini kaydet
      if (data.token) {
        localStorage.setItem("token", data.token);
      }
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      // Yükleme ekranını göster
      setIsVerifyingLoginCode(false);
      setIsProcessingLogin(true);
      setShowLoginCode(false);
      
      setTimeout(() => {
        setLoginFadeIn(true);
      }, 50);
      
      setTimeout(() => {
        setLoginFadeOut(true);
      }, 1800);
      
      setTimeout(() => {
        setIsProcessingLogin(false);
        setLoginFadeIn(false);
        setLoginFadeOut(false);
        setLoginCode("");
        setLoginEmail("");
        window.location.reload(); // AuthContext'i güncellemek için
      }, 2300);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Kod doğrulanırken hata oluştu";
      setError(message);
      setIsVerifyingLoginCode(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  // Şifre sıfırlama kodu gönder
  const handleSendResetCode = async () => {
    if (!forgotPasswordEmail) {
      setError("E-posta adresi giriniz");
      return;
    }

    setIsSendingCode(true);
    setError("");

    try {
      const response = await fetch("/api/auth/forgot-password/send-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: forgotPasswordEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Kod gönderilemedi");
        setIsSendingCode(false);
        return;
      }

      setCodeSent(true);
      setError(data.message || "E-postanıza kod gönderildi");
      setIsSendingCode(false);
    } catch {
      setError("Kod gönderilirken hata oluştu");
      setIsSendingCode(false);
    }
  };

  // Kod doğrula ve otomatik giriş yap
  const handleVerifyResetCode = async () => {
    if (!resetCode || resetCode.length !== 6) {
      setError("6 haneli kodu giriniz");
      return;
    }

    setIsVerifyingCode(true);
    setError("");

    try {
      const response = await fetch("/api/auth/forgot-password/send-code", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: forgotPasswordEmail, code: resetCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Kod doğrulanamadı");
        setIsVerifyingCode(false);
        return;
      }

      // Başarılı - token ve kullanıcı bilgisini kaydet
      if (data.token) {
        localStorage.setItem("token", data.token);
      }
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      // Yükleme ekranını göster
      setIsVerifyingCode(false);
      setIsProcessingLogin(true);
      
      setTimeout(() => {
        setLoginFadeIn(true);
      }, 50);
      
      setTimeout(() => {
        setLoginFadeOut(true);
      }, 1800);
      
      setTimeout(() => {
        setIsProcessingLogin(false);
        setLoginFadeIn(false);
        setLoginFadeOut(false);
        setShowForgotPassword(false);
        setForgotPasswordEmail("");
        setResetCode("");
        setCodeSent(false);
        window.location.reload(); // AuthContext'i güncellemek için
      }, 2300);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Kod doğrulanırken hata oluştu";
      setError(message);
      setIsVerifyingCode(false);
    }
  };

  if (showRegisterForm) {
    return (
      <div
        style={{
          opacity: 1,
          animation: "fadeIn 0.4s ease-in-out",
        }}
      >
        <RegisterForm
          onClose={() => {
            setShowRegisterForm(false);
            setFormData({ email: "", password: "" });
          }}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1a1a1a",
          fontFamily: "Helvetica, Arial, sans-serif",
        }}
      >
        <div style={{ color: "#4a90e2", fontSize: "20px", fontWeight: "600" }}>
          Yükleniyor...
        </div>
      </div>
    );
  }

  // Giriş işlemi yükleniyor ekranı
  if (isProcessingLogin) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#1a1a1a",
          fontFamily: "Helvetica, Arial, sans-serif",
          position: "relative",
          overflow: "hidden",
          opacity: loginFadeOut ? 0 : loginFadeIn ? 1 : 0,
          transition: "opacity 0.5s ease-in-out",
        }}
      >
        <TechBackground />
        <div
          style={{
            position: "relative",
            zIndex: 2,
            textAlign: "center",
            color: "#e8e8e8",
          }}
        >
          <div
            className="loading-spinner"
            style={{
              width: "60px",
              height: "60px",
              border: "4px solid rgba(74, 144, 226, 0.3)",
              borderTop: "4px solid #4a90e2",
              borderRadius: "50%",
              margin: "0 auto 24px",
              animation: "spin 1s linear infinite",
            }}
          />
          <h2
            style={{
              fontSize: "28px",
              fontWeight: "bold",
              color: "#4a90e2",
              margin: "0 0 12px 0",
            }}
          >
            Giriş Yapılıyor...
          </h2>
          <p
            style={{
              fontSize: "16px",
              color: "#b0b0b0",
              margin: 0,
            }}
          >
            Hesabınıza bağlanılıyor, lütfen bekleyiniz.
          </p>
        </div>
      </div>
    );
  }

  // Eğer giriş yapıldıysa motor kontrol sayfasını göster
  if (isAuthenticated && !isProcessingLogin) {
    return (
      <div
        style={{
          opacity: 0,
          animation: "fadeIn 0.6s ease-in forwards",
        }}
      >
        <MotorControl />
      </div>
    );
  }

  // Splash screen göster
  if (showSplash) {
    return <GlobeSplash onComplete={handleSplashComplete} />;
  }

  // Giriş/Kayıt ekranı - Instagram benzeri tasarım
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        fontFamily: "Helvetica, Arial, sans-serif",
        position: "relative",
        overflow: "hidden",
        opacity: showLogin ? 1 : 0,
        transition: "opacity 0.6s ease-in",
      }}
    >
      {/* Sol Taraf - Logo ve Açıklama (TechBackground burada) */}
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
        className="login-left"
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
              margin: 0,
              lineHeight: "32px",
              maxWidth: "500px",
            }}
          >
            KepenxIA, IoT cihazlarınızı yönetmenizi ve hayatınızı kolaylaştırmanızı sağlar.
          </p>
        </div>
      </div>

      {/* Sağ Taraf - Login Form (Siyah arka plan) */}
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
        className="login-right"
      >
        <div
          style={{
            background: "rgba(45, 45, 45, 0.95)",
            backdropFilter: "blur(10px)",
            borderRadius: "8px",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1), 0 8px 16px rgba(0, 0, 0, 0.1)",
            padding: "20px",
            width: "100%",
            maxWidth: "396px",
          }}
        >
          {error && (
            <div
              style={{
                background: error.includes("gönderildi")
                  ? "rgba(76, 175, 80, 0.2)"
                  : "#fee",
                color: error.includes("gönderildi")
                  ? "#4caf50"
                  : "#c33",
                padding: "12px",
                borderRadius: "6px",
                marginBottom: "16px",
                fontSize: "14px",
                border: `1px solid ${
                  error.includes("gönderildi")
                    ? "rgba(76, 175, 80, 0.4)"
                    : "#fcc"
                }`,
              }}
            >
              {error}
            </div>
          )}

          {!showLoginCode ? (
            <form onSubmit={handleSubmit}>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              placeholder="E-posta veya Telefon Numarası"
              style={{
                width: "100%",
                padding: "14px 16px",
                fontSize: "17px",
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
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              placeholder="Şifre"
              style={{
                width: "100%",
                padding: "14px 16px",
                fontSize: "17px",
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
              disabled={isSubmitting}
              style={{
                width: "100%",
                padding: "12px",
                fontSize: "20px",
                fontWeight: "bold",
                color: "#fff",
                background: isSubmitting ? "#3a5a7a" : "#2c3e50",
                border: "none",
                borderRadius: "6px",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                marginBottom: "16px",
                transition: "background 0.2s",
              }}
              onMouseOver={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.background = "#34495e";
                }
              }}
              onMouseOut={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.background = "#2c3e50";
                }
              }}
            >
              {isSubmitting ? "Giriş yapılıyor..." : "Giriş Yap"}
            </button>
          </form>
          ) : (
            <div>
              <div
                style={{
                  background: "rgba(74, 144, 226, 0.2)",
                  border: "1px solid rgba(74, 144, 226, 0.4)",
                  borderRadius: "6px",
                  padding: "12px",
                  marginBottom: "16px",
                }}
              >
                <p
                  style={{
                    color: "#4a90e2",
                    fontSize: "14px",
                    fontWeight: "600",
                    margin: "0 0 8px 0",
                  }}
                >
                  ✉️ Kod Gönderildi
                </p>
                <p
                  style={{
                    color: "#b0b0b0",
                    fontSize: "12px",
                    margin: 0,
                  }}
                >
                  {loginEmail} adresine gönderilen 6 haneli kodu girin
                </p>
              </div>
              <input
                type="text"
                value={loginCode}
                onChange={(e) => {
                  // Sadece rakamları al, trim yap, max 6 karakter
                  const cleaned = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setLoginCode(cleaned);
                }}
                placeholder="000000"
                maxLength={6}
                inputMode="numeric"
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  fontSize: "24px",
                  borderRadius: "6px",
                  border: "1px solid #404040",
                  background: "#1a1a1a",
                  color: "#e8e8e8",
                  marginBottom: "16px",
                  boxSizing: "border-box",
                  outline: "none",
                  textAlign: "center",
                  letterSpacing: "8px",
                  fontFamily: "monospace",
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
                type="button"
                onClick={handleVerifyLoginCode}
                disabled={isVerifyingLoginCode || loginCode.length !== 6}
                style={{
                  width: "100%",
                  padding: "12px",
                  fontSize: "17px",
                  fontWeight: "bold",
                  color: "#fff",
                  background: isVerifyingLoginCode || loginCode.length !== 6 ? "#3a5a7a" : "#4a90e2",
                  border: "none",
                  borderRadius: "6px",
                  cursor: isVerifyingLoginCode || loginCode.length !== 6 ? "not-allowed" : "pointer",
                  marginBottom: "12px",
                  transition: "background 0.2s",
                }}
              >
                {isVerifyingLoginCode ? "Doğrulanıyor..." : "Giriş Yap"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLoginCode(false);
                  setLoginCode("");
                  setError("");
                }}
                style={{
                  width: "100%",
                  padding: "8px",
                  background: "transparent",
                  color: "#b0b0b0",
                  border: "1px solid #404040",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                Geri Dön
              </button>
            </div>
          )}

          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setShowForgotPassword(true);
                setError("");
                setCodeSent(false);
                setResetCode("");
              }}
              style={{
                color: "#4a90e2",
                fontSize: "14px",
                textDecoration: "none",
                cursor: "pointer",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.textDecoration = "underline";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.textDecoration = "none";
              }}
            >
              Şifreni mi Unuttun?
            </a>
          </div>

          <div
            style={{
              borderTop: "1px solid #404040",
              margin: "20px 0",
            }}
          />

          <button
            onClick={() => {
              setShowRegisterForm(true);
              setError("");
              setFormData({
                email: "",
                password: "",
              });
            }}
            style={{
              width: "100%",
              padding: "12px",
              fontSize: "17px",
              fontWeight: "bold",
              color: "#fff",
              background: "#27ae60",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              transition: "background 0.2s",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "#229954";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "#27ae60";
            }}
          >
            Yeni hesap oluştur
          </button>

          <div
            style={{
              marginTop: "28px",
              textAlign: "center",
              fontSize: "14px",
              color: "#b0b0b0",
            }}
          >
            <p style={{ margin: 0 }}>
              <strong>Bu bir, MCTech</strong> Kuruluşudur.
            </p>
          </div>
        </div>
      </div>

      {/* Şifremi Unuttum Modal */}
      {showForgotPassword && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            animation: "fadeIn 0.3s ease-in-out",
          }}
          onClick={() => {
            setShowForgotPassword(false);
            setForgotPasswordEmail("");
            setResetCode("");
            setCodeSent(false);
            setError("");
          }}
        >
          <div
            style={{
              background: "rgba(45, 45, 45, 0.95)",
              backdropFilter: "blur(10px)",
              borderRadius: "8px",
              padding: "30px",
              width: "90%",
              maxWidth: "400px",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              style={{
                color: "#4a90e2",
                fontSize: "24px",
                fontWeight: "bold",
                margin: "0 0 20px 0",
                textAlign: "center",
              }}
            >
              Şifremi Unuttum
            </h2>

            {error && (
              <div
                style={{
                  background: error.includes("Development") || error.includes("gönderildi")
                    ? "rgba(76, 175, 80, 0.2)"
                    : "#fee",
                  color: error.includes("Development") || error.includes("gönderildi")
                    ? "#4caf50"
                    : "#c33",
                  padding: "12px",
                  borderRadius: "6px",
                  marginBottom: "16px",
                  fontSize: "14px",
                  border: `1px solid ${
                    error.includes("Development") || error.includes("gönderildi")
                      ? "rgba(76, 175, 80, 0.4)"
                      : "#fcc"
                  }`,
                }}
              >
                {error}
              </div>
            )}

            {!codeSent ? (
              <div>
                <p
                  style={{
                    color: "#b0b0b0",
                    fontSize: "14px",
                    marginBottom: "20px",
                    textAlign: "center",
                  }}
                >
                  E-posta adresinize şifre sıfırlama kodu göndereceğiz
                </p>
                <input
                  type="email"
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  placeholder="E-posta Adresi"
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    fontSize: "17px",
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
                  type="button"
                  onClick={handleSendResetCode}
                  disabled={isSendingCode}
                  style={{
                    width: "100%",
                    padding: "12px",
                    fontSize: "17px",
                    fontWeight: "bold",
                    color: "#fff",
                    background: isSendingCode ? "#3a5a7a" : "#4a90e2",
                    border: "none",
                    borderRadius: "6px",
                    cursor: isSendingCode ? "not-allowed" : "pointer",
                    marginBottom: "12px",
                    transition: "background 0.2s",
                  }}
                >
                  {isSendingCode ? "Gönderiliyor..." : "Kod Gönder"}
                </button>
              </div>
            ) : (
              <div>
                <div
                  style={{
                    background: "rgba(74, 144, 226, 0.2)",
                    border: "1px solid rgba(74, 144, 226, 0.4)",
                    borderRadius: "6px",
                    padding: "12px",
                    marginBottom: "16px",
                  }}
                >
                  <p
                    style={{
                      color: "#4a90e2",
                      fontSize: "14px",
                      fontWeight: "600",
                      margin: "0 0 8px 0",
                    }}
                  >
                    ✉️ Kod Gönderildi
                  </p>
                  <p
                    style={{
                      color: "#b0b0b0",
                      fontSize: "12px",
                      margin: 0,
                    }}
                  >
                    {forgotPasswordEmail} adresine gönderilen 6 haneli kodu girin
                  </p>
                </div>
                <input
                  type="text"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    fontSize: "24px",
                    borderRadius: "6px",
                    border: "1px solid #404040",
                    background: "#1a1a1a",
                    color: "#e8e8e8",
                    marginBottom: "16px",
                    boxSizing: "border-box",
                    outline: "none",
                    textAlign: "center",
                    letterSpacing: "8px",
                    fontFamily: "monospace",
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
                  type="button"
                  onClick={handleVerifyResetCode}
                  disabled={isVerifyingCode || resetCode.length !== 6}
                  style={{
                    width: "100%",
                    padding: "12px",
                    fontSize: "17px",
                    fontWeight: "bold",
                    color: "#fff",
                    background: isVerifyingCode || resetCode.length !== 6 ? "#3a5a7a" : "#4a90e2",
                    border: "none",
                    borderRadius: "6px",
                    cursor: isVerifyingCode || resetCode.length !== 6 ? "not-allowed" : "pointer",
                    marginBottom: "12px",
                    transition: "background 0.2s",
                  }}
                >
                  {isVerifyingCode ? "Doğrulanıyor..." : "Giriş Yap"}
                </button>
                <button
                  type="button"
                  onClick={handleSendResetCode}
                  disabled={isSendingCode}
                  style={{
                    width: "100%",
                    padding: "8px",
                    background: "rgba(74, 144, 226, 0.2)",
                    color: "#4a90e2",
                    border: "1px solid rgba(74, 144, 226, 0.4)",
                    borderRadius: "6px",
                    cursor: isSendingCode ? "not-allowed" : "pointer",
                    fontSize: "13px",
                    fontWeight: "600",
                    transition: "all 0.2s",
                  }}
                >
                  🔄 Yeni Kod Gönder
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setShowForgotPassword(false);
                setForgotPasswordEmail("");
                setResetCode("");
                setCodeSent(false);
                setError("");
              }}
              style={{
                width: "100%",
                padding: "8px",
                background: "transparent",
                color: "#b0b0b0",
                border: "1px solid #404040",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                marginTop: "12px",
              }}
            >
              İptal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
