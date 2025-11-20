import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail } from "../../../db/users";
import nodemailer from "nodemailer";

// 6 haneli kod oluştur
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// E-posta gönder (Gmail SMTP)
async function sendEmail(email: string, code: string): Promise<void> {
  if (!process.env.MAIL_HOST || !process.env.MAIL_USER || !process.env.MAIL_PASSWORD) {
    throw new Error("E-posta ayarları eksik!");
  }

  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: parseInt(process.env.MAIL_PORT || "587"),
    secure: false, // 587 için false
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false, // Gmail için gerekli olabilir
    },
  });

  const mailOptions = {
    from: process.env.MAIL_FROM || process.env.MAIL_USER,
    to: email,
    subject: "KepenxIA - Şifre Sıfırlama Kodu",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #1a1a1a; color: #e8e8e8;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #4a90e2; margin: 0;">KepenxIA</h1>
        </div>
        <div style="background: rgba(45, 45, 45, 0.6); padding: 30px; border-radius: 8px; border: 1px solid rgba(74, 144, 226, 0.2);">
          <h2 style="color: #4a90e2; margin-top: 0;">Şifre Sıfırlama Kodu</h2>
          <p style="color: #b0b0b0; line-height: 1.6;">
            Şifrenizi sıfırlamak için aşağıdaki doğrulama kodunu kullanın:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <div style="display: inline-block; background: rgba(74, 144, 226, 0.2); padding: 20px 40px; border-radius: 8px; border: 2px solid #4a90e2;">
              <span style="font-size: 32px; font-weight: bold; color: #4a90e2; letter-spacing: 8px; font-family: monospace;">
                ${code}
              </span>
            </div>
          </div>
          <p style="color: #b0b0b0; font-size: 12px; margin-top: 20px;">
            Bu kod 10 dakika geçerlidir. Eğer bu işlemi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.
          </p>
        </div>
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(74, 144, 226, 0.2);">
          <p style="color: #666; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} KepenxIA. Tüm hakları saklıdır.
          </p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

// Kodları saklamak için basit bir yapı (gerçek projede Redis veya veritabanı kullanılmalı)
const resetCodes = new Map<string, { code: string; expiresAt: number; email: string }>();

// Eski kodları temizle (her 5 dakikada bir)
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of resetCodes.entries()) {
    if (value.expiresAt < now) {
      resetCodes.delete(key);
    }
  }
}, 5 * 60 * 1000);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "E-posta adresi gereklidir" },
        { status: 400 }
      );
    }

    // Kullanıcıyı kontrol et
    const user = await getUserByEmail(email);
    if (!user) {
      // Güvenlik için kullanıcı yoksa da başarılı mesaj döndür
      return NextResponse.json({
        success: true,
        message: "E-posta adresinize şifre sıfırlama kodu gönderildi",
      });
    }

    // E-posta ayarları kontrolü (mail göndermeden önce)
    if (!process.env.MAIL_HOST || !process.env.MAIL_USER || !process.env.MAIL_PASSWORD) {
      console.error("E-posta SMTP ayarları eksik! Lütfen .env dosyasını kontrol edin.");
      return NextResponse.json(
        { error: "E-posta servisi yapılandırılmamış. Lütfen sistem yöneticisine başvurun." },
        { status: 500 }
      );
    }

    // Kod oluştur
    const code = generateCode();

    // Email'i normalize et
    const normalizedEmail = email.toLowerCase().trim();

    // Eski kodları temizle
    resetCodes.delete(normalizedEmail);

    // ÖNCE kodu kaydet (10 dakika geçerli) - STRING olarak kaydet
    resetCodes.set(normalizedEmail, {
      code: code.toString(),
      expiresAt: Date.now() + 10 * 60 * 1000,
      email: user.email,
    });

    // SONRA mail gönder - AYNI KOD ile
    try {
      await sendEmail(user.email, code.toString());
    } catch (emailError) {
      // Mail gönderme başarısız olursa kodu sil
      resetCodes.delete(normalizedEmail);
      console.error("E-posta gönderme hatası:", emailError);
      const errorMessage = emailError instanceof Error ? emailError.message : "Bilinmeyen hata";
      console.error("Hata detayı:", {
        message: errorMessage,
        mailHost: process.env.MAIL_HOST,
        mailUser: process.env.MAIL_USER ? "Ayarlı" : "Eksik",
        mailPassword: process.env.MAIL_PASSWORD ? "Ayarlı" : "Eksik",
      });
      return NextResponse.json(
        { 
          error: "E-posta gönderilemedi. Lütfen .env dosyasındaki MAIL ayarlarını kontrol edin.",
          details: process.env.NODE_ENV === "development" ? errorMessage : undefined
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "E-posta adresinize şifre sıfırlama kodu gönderildi",
    });
  } catch (error) {
    console.error("Send reset code error:", error);
    return NextResponse.json(
      { error: "Sunucu hatası" },
      { status: 500 }
    );
  }
}

// Kod doğrulama ve otomatik giriş
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code } = body;

    if (!email || !code) {
      return NextResponse.json(
        { error: "E-posta ve kod gereklidir" },
        { status: 400 }
      );
    }

    // Email'i normalize et
    const normalizedEmail = email.toLowerCase().trim();
    
    // Kodu normalize et (string olarak, trim, sadece rakamlar)
    const normalizedCode = code.toString().trim().replace(/\D/g, "");

    // Kodu kontrol et
    const savedCode = resetCodes.get(normalizedEmail);
    if (!savedCode) {
      return NextResponse.json(
        { error: "Geçersiz veya süresi dolmuş kod" },
        { status: 400 }
      );
    }

    // Kod karşılaştırması - STRING olarak karşılaştır
    const savedCodeString = savedCode.code.toString().trim();
    if (savedCodeString !== normalizedCode) {
      return NextResponse.json(
        { error: "Kod hatalı" },
        { status: 400 }
      );
    }

    if (savedCode.expiresAt < Date.now()) {
      resetCodes.delete(normalizedEmail);
      return NextResponse.json(
        { error: "Kod süresi dolmuş" },
        { status: 400 }
      );
    }

    // Kullanıcıyı bul
    const user = await getUserByEmail(savedCode.email);
    if (!user) {
      return NextResponse.json(
        { error: "Kullanıcı bulunamadı" },
        { status: 404 }
      );
    }

    // Kodu sil (tek kullanımlık)
    resetCodes.delete(normalizedEmail);

    // Token oluştur (otomatik giriş için)
    const token = Buffer.from(`${user.id}:${user.email}`).toString("base64");

    return NextResponse.json({
      success: true,
      message: "Kod doğrulandı",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("Verify reset code error:", error);
    return NextResponse.json(
      { error: "Sunucu hatası" },
      { status: 500 }
    );
  }
}

