import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail } from "../../../db/users";
import nodemailer from "nodemailer";

// 6 haneli kod oluştur
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// E-posta gönder (Gmail SMTP)
async function sendEmail(email: string, code: string): Promise<void> {
  // Gmail SMTP ayarları
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER, // Gmail adresiniz
      pass: process.env.GMAIL_APP_PASSWORD, // Gmail App Password
    },
  });

  const mailOptions = {
    from: process.env.GMAIL_USER,
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

    // Gmail ayarları kontrolü
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.error("Gmail SMTP ayarları eksik!");
      // Development modunda console'a yazdır
      const code = generateCode();
      console.log(`📧 E-posta Gönderiliyor (Development): ${email}`);
      console.log(`🔐 Şifre Sıfırlama Kodu: ${code}`);
      
      // Kod kaydet (10 dakika geçerli)
      resetCodes.set(email, {
        code,
        expiresAt: Date.now() + 10 * 60 * 1000,
        email: user.email,
      });

      return NextResponse.json({
        success: true,
        message: "E-posta adresinize şifre sıfırlama kodu gönderildi",
        // Development için kod göster
        ...(process.env.NODE_ENV === "development" && { code }),
      });
    }

    // Kod oluştur
    const code = generateCode();

    // Eski kodları temizle
    resetCodes.delete(email);

    // Yeni kodu kaydet (10 dakika geçerli)
    resetCodes.set(email, {
      code,
      expiresAt: Date.now() + 10 * 60 * 1000,
      email: user.email,
    });

    // E-postaya kod gönder
    try {
      await sendEmail(user.email, code);
    } catch (emailError) {
      console.error("E-posta gönderme hatası:", emailError);
      // Development modunda console'a yazdır
      console.log(`📧 E-posta Gönderilemedi (Development): ${email}`);
      console.log(`🔐 Şifre Sıfırlama Kodu: ${code}`);
      
      return NextResponse.json({
        success: true,
        message: "E-posta gönderilemedi, kod konsola yazdırıldı",
        // Development için kod göster
        ...(process.env.NODE_ENV === "development" && { code }),
      });
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

    // Kodu kontrol et
    const savedCode = resetCodes.get(email);
    if (!savedCode) {
      return NextResponse.json(
        { error: "Geçersiz veya süresi dolmuş kod" },
        { status: 400 }
      );
    }

    if (savedCode.code !== code) {
      return NextResponse.json(
        { error: "Kod hatalı" },
        { status: 400 }
      );
    }

    if (savedCode.expiresAt < Date.now()) {
      resetCodes.delete(email);
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
    resetCodes.delete(email);

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

