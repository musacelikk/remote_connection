import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail } from "../../../db/users";
import { loginCodes } from "../route";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code } = body;

    if (!email || !code) {
      return NextResponse.json(
        { error: "E-posta ve kod gereklidir" },
        { status: 400 }
      );
    }

    // Email'i normalize et (lowercase)
    const normalizedEmail = email.toLowerCase().trim();
    
    // Kodu normalize et (string olarak, trim, sadece rakamlar)
    const normalizedCode = code.toString().trim().replace(/\D/g, "");

    // Kodu kontrol et - önce normalize edilmiş email ile dene
    let savedCode = loginCodes.get(normalizedEmail);
    
    // Eğer bulunamazsa, tüm key'leri kontrol et (case-insensitive)
    if (!savedCode) {
      for (const [key, value] of loginCodes.entries()) {
        if (key.toLowerCase().trim() === normalizedEmail) {
          savedCode = value;
          // Key'i normalize edilmiş haliyle güncelle
          loginCodes.delete(key);
          loginCodes.set(normalizedEmail, value);
          break;
        }
      }
    }

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
      loginCodes.delete(normalizedEmail);
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
    loginCodes.delete(normalizedEmail);

    // Token oluştur (gerçek projede JWT kullanılmalı)
    const token = Buffer.from(`${user.id}:${user.email}`).toString("base64");

    return NextResponse.json({
      success: true,
      message: "Giriş başarılı",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
    });
  } catch (error) {
    console.error("Verify login code error:", error);
    return NextResponse.json(
      { error: "Sunucu hatası" },
      { status: 500 }
    );
  }
}

