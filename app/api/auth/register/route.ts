import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail, createUser } from "../../db/users";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email,
      password,
      name,
      companyName,
      taxNumber,
      companyPhone,
      companyEmail,
      companyAddress,
      firstName,
      lastName,
      gsm,
      tcNumber,
      username,
      enable2FA,
      phoneFor2FA,
    } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "E-posta ve şifre gereklidir" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Şifre en az 6 karakter olmalıdır" },
        { status: 400 }
      );
    }

    // E-posta kontrolü
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: "Bu e-posta adresi zaten kullanılıyor" },
        { status: 409 }
      );
    }

    // Yeni kullanıcı oluştur
    const newUser = await createUser({
      email,
      password, // Gerçek projede bcrypt ile hash'lenmeli
      name: name || `${firstName || ""} ${lastName || ""}`.trim() || undefined,
      companyName,
      taxNumber,
      companyPhone,
      companyEmail,
      companyAddress,
      firstName,
      lastName,
      gsm,
      tcNumber,
      username,
      enable2FA,
      phoneFor2FA,
    });

    // Token oluştur (gerçek projede JWT kullanılmalı)
    const token = Buffer.from(`${newUser.id}:${newUser.email}`).toString("base64");

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
      },
      token,
    });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Sunucu hatası" },
      { status: 500 }
    );
  }
}

