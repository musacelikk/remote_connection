import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail } from "../../db/users";

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

    // Kullanıcıyı bul
    const user = await getUserByEmail(email);

    if (!user || user.password !== password) {
      return NextResponse.json(
        { error: "E-posta veya şifre hatalı" },
        { status: 401 }
      );
    }

    // Başarılı giriş - token oluştur (gerçek projede JWT kullanılmalı)
    const token = Buffer.from(`${user.id}:${user.email}`).toString("base64");

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Sunucu hatası" },
      { status: 500 }
    );
  }
}

