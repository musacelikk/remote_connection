"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import TechBackground from "./TechBackground";

interface RegisterData {
  // Şirket Bilgileri
  companyName: string;
  taxNumber: string;
  companyPhone: string;
  companyEmail: string;
  companyAddress: string;
  // Kişisel Bilgiler
  firstName: string;
  lastName: string;
  gsm: string;
  tcNumber: string;
  // Hesap Bilgileri
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  enable2FA: boolean;
  phoneFor2FA: string;
  // Yasal Onaylar
  kvkkApproved: boolean;
  serviceAgreementApproved: boolean;
}

export default function RegisterForm({
  onClose,
}: {
  onClose: () => void;
}) {
  const { register } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingRegistration, setIsProcessingRegistration] = useState(false);
  const [registerFadeIn, setRegisterFadeIn] = useState(false);
  const [registerFadeOut, setRegisterFadeOut] = useState(false);
  const [error, setError] = useState("");
  const totalSteps = 4;

  const [formData, setFormData] = useState<RegisterData>({
    companyName: "",
    taxNumber: "",
    companyPhone: "",
    companyEmail: "",
    companyAddress: "",
    firstName: "",
    lastName: "",
    gsm: "",
    tcNumber: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    enable2FA: false,
    phoneFor2FA: "",
    kvkkApproved: false,
    serviceAgreementApproved: false,
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
    setError("");
  };

  const validateStep = (step: number): boolean => {
    setError("");

    switch (step) {
      case 1:
        if (!formData.companyName.trim()) {
          setError("Şirket adı gereklidir!");
          return false;
        }
        if (!formData.taxNumber.trim()) {
          setError("Vergi numarası gereklidir!");
          return false;
        }
        if (!formData.companyPhone.trim()) {
          setError("Şirket telefonu gereklidir!");
          return false;
        }
        if (!formData.companyEmail.trim() || !formData.companyEmail.includes("@")) {
          setError("Geçerli bir şirket e-posta adresi giriniz!");
          return false;
        }
        if (!formData.companyAddress.trim()) {
          setError("Şirket adresi gereklidir!");
          return false;
        }
        return true;

      case 2:
        if (!formData.firstName.trim()) {
          setError("Ad gereklidir!");
          return false;
        }
        if (!formData.lastName.trim()) {
          setError("Soyad gereklidir!");
          return false;
        }
        if (!formData.gsm.trim()) {
          setError("GSM numarası gereklidir!");
          return false;
        }
        if (!formData.tcNumber.trim() || formData.tcNumber.length !== 11) {
          setError("Geçerli bir TC Kimlik Numarası giriniz (11 haneli)!");
          return false;
        }
        return true;

      case 3:
        if (!formData.username.trim()) {
          setError("Kullanıcı adı gereklidir!");
          return false;
        }
        if (!formData.email.trim() || !formData.email.includes("@")) {
          setError("Geçerli bir e-posta adresi giriniz!");
          return false;
        }
        if (!formData.password || formData.password.length < 6) {
          setError("Şifre en az 6 karakter olmalıdır!");
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          setError("Şifreler eşleşmiyor!");
          return false;
        }
        if (formData.enable2FA && !formData.phoneFor2FA.trim()) {
          setError("2FA için telefon numarası gereklidir!");
          return false;
        }
        return true;

      case 4:
        if (!formData.kvkkApproved) {
          setError("KVKK Aydınlatma Metni'ni onaylamanız gerekmektedir!");
          return false;
        }
        if (!formData.serviceAgreementApproved) {
          setError("Hizmet Sözleşmesi'ni onaylamanız gerekmektedir!");
          return false;
        }
        return true;

      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(4)) return;

    setIsSubmitting(true);
    setError("");

    try {
      await register({
        email: formData.email,
        password: formData.password,
        name: `${formData.firstName} ${formData.lastName}`,
        companyName: formData.companyName,
        taxNumber: formData.taxNumber,
        companyPhone: formData.companyPhone,
        companyEmail: formData.companyEmail,
        companyAddress: formData.companyAddress,
        firstName: formData.firstName,
        lastName: formData.lastName,
        gsm: formData.gsm,
        tcNumber: formData.tcNumber,
        username: formData.username,
        enable2FA: formData.enable2FA,
        phoneFor2FA: formData.phoneFor2FA,
      });
      // Başarılı kayıt sonrası yükleme ekranını göster
      setIsSubmitting(false);
      setIsProcessingRegistration(true);
      
      // Yumuşak geçiş için fade in
      setTimeout(() => {
        setRegisterFadeIn(true);
      }, 50);
      
      // 2 saniye sonra fade out başlat
      setTimeout(() => {
        setRegisterFadeOut(true);
      }, 2000);
      
      // 2.5 saniye sonra panele yönlendir
      setTimeout(() => {
        onClose();
      }, 2500);
    } catch (err: any) {
      setError(err.message || "Kayıt işlemi başarısız!");
      setIsSubmitting(false);
    }
  };

  const stepTitles = [
    "Şirket Bilgileri",
    "Kişisel Bilgiler",
    "Hesap Bilgileri",
    "Yasal Onaylar",
  ];

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Component mount olduğunda animasyonu başlat
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  // Yükleme ekranı göster
  if (isProcessingRegistration) {
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
          opacity: registerFadeOut ? 0 : registerFadeIn ? 1 : 0,
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
            Kayıt Alınıyor...
          </h2>
          <p
            style={{
              fontSize: "16px",
              color: "#b0b0b0",
              margin: 0,
            }}
          >
            Hesabınız oluşturuluyor, lütfen bekleyiniz.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#1a1a1a",
        fontFamily: "Helvetica, Arial, sans-serif",
        padding: "20px",
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(20px)",
        transition: "opacity 0.4s ease-in-out, transform 0.4s ease-in-out",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <TechBackground />
      <div
        style={{
          background: "rgba(45, 45, 45, 0.95)",
          backdropFilter: "blur(10px)",
          padding: "24px",
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1), 0 8px 16px rgba(0, 0, 0, 0.1)",
          width: "100%",
          maxWidth: "600px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: "24px", textAlign: "center" }}>
          <h1
            style={{
              fontSize: "32px",
              fontWeight: "bold",
              color: "#4a90e2",
              margin: "0 0 8px 0",
            }}
          >
            KepenxIA
          </h1>
          <p style={{ fontSize: "15px", color: "#b0b0b0", margin: "0 0 20px 0" }}>
            Hızlı ve kolay kayıt olun
          </p>
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: "24px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "8px",
            }}
          >
            {stepTitles.map((title, index) => (
              <div
                key={index}
                style={{
                  flex: 1,
                  textAlign: "center",
                  fontSize: "11px",
                  color: currentStep > index + 1 ? "#4a90e2" : currentStep === index + 1 ? "#e8e8e8" : "#707070",
                  fontWeight: currentStep === index + 1 ? "600" : "normal",
                }}
              >
                {index + 1}. {title}
              </div>
            ))}
          </div>
          <div
            style={{
              height: "3px",
              background: "#404040",
              borderRadius: "2px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${(currentStep / totalSteps) * 100}%`,
                background: "#2c3e50",
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>

        <h2
          style={{
            textAlign: "center",
            marginBottom: "20px",
                    color: "#e8e8e8",
            fontSize: "24px",
            fontWeight: "600",
          }}
        >
          {stepTitles[currentStep - 1]}
        </h2>

        {error && (
          <div
            style={{
              background: "#fee",
              color: "#c33",
              padding: "12px",
              borderRadius: "6px",
              marginBottom: "16px",
              fontSize: "15px",
              border: "1px solid #fcc",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={currentStep === 4 ? handleSubmit : (e) => e.preventDefault()}>
          {/* Step 1: Şirket Bilgileri */}
          {currentStep === 1 && (
            <div>
              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    color: "#e8e8e8",
                    fontSize: "15px",
                    fontWeight: "600",
                  }}
                >
                  Şirket Adı <span style={{ color: "red" }}>*</span>
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: "100%",
                    padding: "11px",
                    borderRadius: "6px",
                    border: "1px solid #404040",
                    background: "#1a1a1a",
                    color: "#e8e8e8",
                    fontSize: "15px",
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
                  placeholder="Şirket Adı"
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    color: "#e8e8e8",
                    fontSize: "15px",
                    fontWeight: "600",
                  }}
                >
                  Vergi Numarası <span style={{ color: "red" }}>*</span>
                </label>
                <input
                  type="text"
                  name="taxNumber"
                  value={formData.taxNumber}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: "100%",
                    padding: "11px",
                    borderRadius: "6px",
                    border: "1px solid #404040",
                    background: "#1a1a1a",
                    color: "#e8e8e8",
                    fontSize: "15px",
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
                  placeholder="Vergi Numarası"
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    color: "#e8e8e8",
                    fontSize: "15px",
                    fontWeight: "600",
                  }}
                >
                  Şirket Telefonu <span style={{ color: "red" }}>*</span>
                </label>
                <input
                  type="tel"
                  name="companyPhone"
                  value={formData.companyPhone}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: "100%",
                    padding: "11px",
                    borderRadius: "6px",
                    border: "1px solid #404040",
                    background: "#1a1a1a",
                    color: "#e8e8e8",
                    fontSize: "15px",
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
                  placeholder="0XXX XXX XX XX"
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    color: "#e8e8e8",
                    fontSize: "15px",
                    fontWeight: "600",
                  }}
                >
                  Şirket E-posta <span style={{ color: "red" }}>*</span>
                </label>
                <input
                  type="email"
                  name="companyEmail"
                  value={formData.companyEmail}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: "100%",
                    padding: "11px",
                    borderRadius: "6px",
                    border: "1px solid #404040",
                    background: "#1a1a1a",
                    color: "#e8e8e8",
                    fontSize: "15px",
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
                  placeholder="sirket@email.com"
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    color: "#e8e8e8",
                    fontSize: "15px",
                    fontWeight: "600",
                  }}
                >
                  Şirket Adresi <span style={{ color: "red" }}>*</span>
                </label>
                <textarea
                  name="companyAddress"
                  value={formData.companyAddress}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "11px",
                    borderRadius: "6px",
                    border: "1px solid #404040",
                    background: "#1a1a1a",
                    color: "#e8e8e8",
                    fontSize: "15px",
                    boxSizing: "border-box",
                    resize: "vertical",
                    outline: "none",
                    fontFamily: "inherit",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#4a90e2";
                    e.target.style.background = "#252525";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#404040";
                    e.target.style.background = "#1a1a1a";
                  }}
                  placeholder="Tam adres bilgisi"
                />
              </div>
            </div>
          )}

          {/* Step 2: Kişisel Bilgiler */}
          {currentStep === 2 && (
            <div>
              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    color: "#e8e8e8",
                    fontSize: "15px",
                    fontWeight: "600",
                  }}
                >
                  Ad <span style={{ color: "red" }}>*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: "100%",
                    padding: "11px",
                    borderRadius: "6px",
                    border: "1px solid #404040",
                    background: "#1a1a1a",
                    color: "#e8e8e8",
                    fontSize: "15px",
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
                  placeholder="Adınız"
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    color: "#e8e8e8",
                    fontSize: "15px",
                    fontWeight: "600",
                  }}
                >
                  Soyad <span style={{ color: "red" }}>*</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: "100%",
                    padding: "11px",
                    borderRadius: "6px",
                    border: "1px solid #404040",
                    background: "#1a1a1a",
                    color: "#e8e8e8",
                    fontSize: "15px",
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
                  placeholder="Soyadınız"
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    color: "#e8e8e8",
                    fontSize: "15px",
                    fontWeight: "600",
                  }}
                >
                  GSM <span style={{ color: "red" }}>*</span>
                </label>
                <input
                  type="tel"
                  name="gsm"
                  value={formData.gsm}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: "100%",
                    padding: "11px",
                    borderRadius: "6px",
                    border: "1px solid #404040",
                    background: "#1a1a1a",
                    color: "#e8e8e8",
                    fontSize: "15px",
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
                  placeholder="05XX XXX XX XX"
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    color: "#e8e8e8",
                    fontSize: "15px",
                    fontWeight: "600",
                  }}
                >
                  TC Kimlik Numarası <span style={{ color: "red" }}>*</span>
                </label>
                <input
                  type="text"
                  name="tcNumber"
                  value={formData.tcNumber}
                  onChange={handleInputChange}
                  required
                  maxLength={11}
                  style={{
                    width: "100%",
                    padding: "11px",
                    borderRadius: "6px",
                    border: "1px solid #404040",
                    background: "#1a1a1a",
                    color: "#e8e8e8",
                    fontSize: "15px",
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
                  placeholder="11 haneli TC Kimlik No"
                />
              </div>
            </div>
          )}

          {/* Step 3: Hesap Bilgileri */}
          {currentStep === 3 && (
            <div>
              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    color: "#e8e8e8",
                    fontSize: "15px",
                    fontWeight: "600",
                  }}
                >
                  Kullanıcı Adı / E-mail <span style={{ color: "red" }}>*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: "100%",
                    padding: "11px",
                    borderRadius: "6px",
                    border: "1px solid #404040",
                    background: "#1a1a1a",
                    color: "#e8e8e8",
                    fontSize: "15px",
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
                  placeholder="kullanici@email.com"
                />
                <p style={{ fontSize: "12px", color: "#b0b0b0", marginTop: "5px" }}>
                  Bu e-posta adresi giriş için kullanılacaktır
                </p>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    color: "#e8e8e8",
                    fontSize: "15px",
                    fontWeight: "600",
                  }}
                >
                  Kullanıcı Adı <span style={{ color: "red" }}>*</span>
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: "100%",
                    padding: "11px",
                    borderRadius: "6px",
                    border: "1px solid #404040",
                    background: "#1a1a1a",
                    color: "#e8e8e8",
                    fontSize: "15px",
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
                  placeholder="Kullanıcı adı"
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    color: "#e8e8e8",
                    fontSize: "15px",
                    fontWeight: "600",
                  }}
                >
                  Şifre <span style={{ color: "red" }}>*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: "100%",
                    padding: "11px",
                    borderRadius: "6px",
                    border: "1px solid #404040",
                    background: "#1a1a1a",
                    color: "#e8e8e8",
                    fontSize: "15px",
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
                  placeholder="En az 6 karakter"
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    color: "#e8e8e8",
                    fontSize: "15px",
                    fontWeight: "600",
                  }}
                >
                  Şifre Tekrar <span style={{ color: "red" }}>*</span>
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: "100%",
                    padding: "11px",
                    borderRadius: "6px",
                    border: "1px solid #404040",
                    background: "#1a1a1a",
                    color: "#e8e8e8",
                    fontSize: "15px",
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
                  placeholder="Şifrenizi tekrar giriniz"
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    color: "#e8e8e8",
                    fontSize: "15px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    name="enable2FA"
                    checked={formData.enable2FA}
                    onChange={handleInputChange}
                    style={{ width: "18px", height: "18px", cursor: "pointer" }}
                  />
                  <span>2FA / SMS Doğrulama Aktif Et (Opsiyonel)</span>
                </label>
              </div>

              {formData.enable2FA && (
                <div style={{ marginBottom: "20px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      color: "#e8e8e8",
                      fontSize: "14px",
                      fontWeight: "500",
                    }}
                  >
                    SMS Doğrulama Telefon Numarası <span style={{ color: "red" }}>*</span>
                  </label>
                  <input
                    type="tel"
                    name="phoneFor2FA"
                    value={formData.phoneFor2FA}
                    onChange={handleInputChange}
                    required={formData.enable2FA}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "8px",
                      border: "1px solid #ddd",
                      fontSize: "16px",
                      boxSizing: "border-box",
                    }}
                    placeholder="05XX XXX XX XX"
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 4: Yasal Onaylar */}
          {currentStep === 4 && (
            <div>
              <div
                style={{
                  background: "#252525",
                  padding: "16px",
                  borderRadius: "6px",
                  marginBottom: "20px",
                  maxHeight: "300px",
                  overflowY: "auto",
                }}
              >
                <h3 style={{ marginBottom: "10px", color: "#333" }}>
                  KVKK Aydınlatma Metni
                </h3>
                <p style={{ fontSize: "14px", color: "#b0b0b0", lineHeight: "1.6" }}>
                  Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında, kişisel
                  verileriniz işbu aydınlatma metninde belirtilen amaçlar
                  doğrultusunda işlenecektir. Verileriniz güvenli bir şekilde
                  saklanacak ve üçüncü kişilerle paylaşılmayacaktır. Detaylı
                  bilgi için{" "}
                  <a href="#" style={{ color: "#1877f2", textDecoration: "none" }}>
                    KVKK Politikamız
                  </a>{" "}
                  sayfasını inceleyebilirsiniz.
                </p>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    color: "#e8e8e8",
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    name="kvkkApproved"
                    checked={formData.kvkkApproved}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: "18px",
                      height: "18px",
                      cursor: "pointer",
                      marginTop: "3px",
                      flexShrink: 0,
                    }}
                  />
                  <span>
                    KVKK Aydınlatma Metni'ni okudum, anladım ve onaylıyorum.{" "}
                    <span style={{ color: "red" }}>*</span>
                  </span>
                </label>
              </div>

              <div
                style={{
                  background: "#252525",
                  padding: "16px",
                  borderRadius: "6px",
                  marginBottom: "20px",
                  maxHeight: "300px",
                  overflowY: "auto",
                }}
              >
                <h3 style={{ marginBottom: "10px", color: "#333" }}>
                  Hizmet Sözleşmesi
                </h3>
                <p style={{ fontSize: "14px", color: "#b0b0b0", lineHeight: "1.6" }}>
                  Hizmet sözleşmesi kapsamında, platformu kullanırken belirlenen
                  kurallara uymayı kabul ediyorsunuz. Sözleşme şartları platform
                  kullanımı, kullanıcı sorumlulukları ve hizmet kapsamını
                  içermektedir. Detaylı bilgi için{" "}
                  <a href="#" style={{ color: "#1877f2", textDecoration: "none" }}>
                    Hizmet Sözleşmesi
                  </a>{" "}
                  sayfasını inceleyebilirsiniz.
                </p>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    color: "#e8e8e8",
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    name="serviceAgreementApproved"
                    checked={formData.serviceAgreementApproved}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: "18px",
                      height: "18px",
                      cursor: "pointer",
                      marginTop: "3px",
                      flexShrink: 0,
                    }}
                  />
                  <span>
                    Hizmet Sözleşmesi'ni okudum, anladım ve onaylıyorum.{" "}
                    <span style={{ color: "red" }}>*</span>
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "10px",
              marginTop: "30px",
            }}
          >
            <div>
              {currentStep > 1 && (
                  <button
                  type="button"
                  onClick={handleBack}
                  style={{
                    padding: "10px 20px",
                    background: "#404040",
                    color: "#e8e8e8",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "17px",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "background 0.2s",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = "#505050";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = "#404040";
                  }}
                >
                  ← Geri
                </button>
              )}
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              {currentStep < totalSteps ? (
                  <button
                  type="button"
                  onClick={handleNext}
                  style={{
                    padding: "10px 20px",
                    background: "#2c3e50",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "17px",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "background 0.2s",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = "#166fe5";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = "#1877f2";
                  }}
                >
                  İleri →
                </button>
              ) : (
                  <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: "10px 20px",
                    background: isSubmitting ? "#3a5a7a" : "#2c3e50",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "17px",
                    fontWeight: "600",
                    cursor: isSubmitting ? "not-allowed" : "pointer",
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
                  {isSubmitting ? "Kaydediliyor..." : "Kayıt Ol"}
                </button>
              )}
            </div>
          </div>
        </form>

        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#4a90e2",
              cursor: "pointer",
              fontSize: "14px",
              textDecoration: "none",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.textDecoration = "underline";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.textDecoration = "none";
            }}
          >
            Giriş sayfasına dön
          </button>
        </div>
      </div>
    </div>
  );
}

