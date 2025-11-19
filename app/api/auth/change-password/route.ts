import { NextRequest, NextResponse } from "next/server";
import { getUserById, updateUser } from "../../db/users";

// Token'dan kullanıcı ID'sini al (basit implementasyon)
function getUserIdFromToken(token: string | null): string | null {
  if (!token) return null;
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const [userId] = decoded.split(":");
    return userId;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { currentPassword, newPassword } = body;

    // Token'dan kullanıcı ID'sini al
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "") || null;
    const userId = getUserIdFromToken(token);

    if (!userId) {
      return NextResponse.json(
        { error: "Yetkilendirme hatası" },
        { status: 401 }
      );
    }

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Mevcut şifre ve yeni şifre gereklidir" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Yeni şifre en az 6 karakter olmalıdır" },
        { status: 400 }
      );
    }

    // Kullanıcıyı bul
    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json(
        { error: "Kullanıcı bulunamadı" },
        { status: 404 }
      );
    }

    // Mevcut şifreyi kontrol et
    if (user.password !== currentPassword) {
      return NextResponse.json(
        { error: "Mevcut şifre hatalı" },
        { status: 401 }
      );
    }

    // Şifreyi güncelle (gerçek projede hash'lenmeli)
    await updateUser(userId, { password: newPassword });

    return NextResponse.json({
      success: true,
      message: "Şifre başarıyla değiştirildi",
    });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json(
      { error: "Sunucu hatası" },
      { status: 500 }
    );
  }
}

