import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail } from "../../db/users";
import nodemailer from "nodemailer";

// 6 haneli kod oluştur
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// E-posta gönder (Gmail SMTP) - Login için
async function sendLoginCodeEmail(email: string, code: string): Promise<void> {
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
    subject: "KepenxIA - Giriş Doğrulama Kodu",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #1a1a1a; color: #e8e8e8;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #4a90e2; margin: 0;">KepenxIA</h1>
        </div>
        <div style="background: rgba(45, 45, 45, 0.6); padding: 30px; border-radius: 8px; border: 1px solid rgba(74, 144, 226, 0.2);">
          <h2 style="color: #4a90e2; margin-top: 0;">Giriş Doğrulama Kodu</h2>
          <p style="color: #b0b0b0; line-height: 1.6;">
            Hesabınıza giriş yapmak için aşağıdaki doğrulama kodunu kullanın:
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

// Login kodlarını saklamak için (gerçek projede Redis veya veritabanı kullanılmalı)
export const loginCodes = new Map<string, { code: string; expiresAt: number; email: string; userId: string }>();

// Eski kodları temizle (her 5 dakikada bir)
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of loginCodes.entries()) {
    if (value.expiresAt < now) {
      loginCodes.delete(key);
    }
  }
}, 5 * 60 * 1000);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "E-posta ve şifre gereklidir" },
        { status: 400 }
      );
    }

    // Kullanıcıyı bul ve şifreyi kontrol et
    const user = await getUserByEmail(email);

    if (!user || user.password !== password) {
      return NextResponse.json(
        { error: "E-posta veya şifre hatalı" },
        { status: 401 }
      );
    }

    // E-posta ayarları kontrolü (mail göndermeden önce)
    if (!process.env.MAIL_HOST || !process.env.MAIL_USER || !process.env.MAIL_PASSWORD) {
      console.error("E-posta SMTP ayarları eksik! Lütfen .env dosyasını kontrol edin.");
      return NextResponse.json(
        { error: "E-posta servisi yapılandırılmamış. Lütfen .env dosyasını kontrol edin." },
        { status: 500 }
      );
    }

    // Placeholder değer kontrolü
    if (
      process.env.MAIL_USER === "seningmailadresin@gmail.com" ||
      process.env.MAIL_PASSWORD === "uygulama_sifresi" ||
      !process.env.MAIL_USER.includes("@") ||
      process.env.MAIL_PASSWORD.length < 10
    ) {
      console.error("E-posta ayarları placeholder değerler içeriyor! Gerçek değerlerle doldurun.");
      return NextResponse.json(
        { error: "E-posta ayarları placeholder değerler içeriyor. Lütfen .env dosyasını gerçek Gmail bilgilerinizle doldurun." },
        { status: 500 }
      );
    }

    // Kod oluştur
    const code = generateCode();

    // Email'i normalize et (lowercase)
    const normalizedEmail = user.email.toLowerCase().trim();

    // Eski kodları temizle (hem form email hem de user email ile)
    loginCodes.delete(email.toLowerCase().trim());
    loginCodes.delete(normalizedEmail);

    // ÖNCE kodu kaydet (10 dakika geçerli)
    loginCodes.set(normalizedEmail, {
      code: code.toString(),
      expiresAt: Date.now() + 10 * 60 * 1000,
      email: user.email,
      userId: user.id,
    });

    // SONRA mail gönder - AYNI KOD ile
    try {
      await sendLoginCodeEmail(user.email, code.toString());
    } catch (emailError) {
      // Mail gönderme başarısız olursa kodu sil
      loginCodes.delete(normalizedEmail);
      console.error("E-posta gönderme hatası:", emailError);
      return NextResponse.json(
        { 
          error: "E-posta gönderilemedi. Lütfen .env dosyasındaki MAIL ayarlarını kontrol edin."
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "E-posta adresinize giriş doğrulama kodu gönderildi",
      // Frontend'in doğru email ile kod doğrulaması yapabilmesi için
      email: normalizedEmail,
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Sunucu hatası" },
      { status: 500 }
    );
  }
}

