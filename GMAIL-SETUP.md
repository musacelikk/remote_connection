# Gmail SMTP Kurulum Rehberi

## 📧 Gmail ile E-posta Gönderme Ayarları

### Adım 1: Google Hesabınızda 2FA'yı Aktif Edin

1. [Google Hesabım](https://myaccount.google.com) sayfasına gidin
2. Sol menüden **"Güvenlik"** sekmesine tıklayın
3. **"2 Adımlı Doğrulama"** bölümünü bulun
4. **"2 Adımlı Doğrulamayı Aç"** butonuna tıklayın
5. Telefon numaranızı doğrulayın

### Adım 2: App Password (Uygulama Şifresi) Oluşturun

1. [App Passwords](https://myaccount.google.com/apppasswords) sayfasına gidin
   - Veya: Google Hesabım > Güvenlik > 2 Adımlı Doğrulama > Uygulama şifreleri

2. **"Uygulama seçin"** dropdown'ından **"E-posta"** seçin

3. **"Cihaz seçin"** dropdown'ından **"Diğer (Özel ad)"** seçin

4. Özel ad olarak **"KepenxIA"** yazın (veya istediğiniz bir isim)

5. **"Oluştur"** butonuna tıklayın

6. **16 haneli şifre** görünecek (örnek: `abcd efgh ijkl mnop`)
   - ⚠️ **ÖNEMLİ:** Bu şifreyi hemen kopyalayın, bir daha gösterilmeyecek!

### Adım 3: .env Dosyası Oluşturun

Proje kök dizininde (package.json'un olduğu yerde) `.env` dosyası oluşturun:

```env
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=abcdefghijklmnop
```

**Örnek:**
```env
GMAIL_USER=musacelik@gmail.com
GMAIL_APP_PASSWORD=abcd efgh ijkl mnop
```

⚠️ **NOT:** App Password'deki boşlukları kaldırabilirsiniz:
```env
GMAIL_APP_PASSWORD=abcdefghijklmnop
```

### Adım 4: Sunucuyu Yeniden Başlatın

`.env` dosyasını oluşturduktan sonra:

```bash
# Development için
npm run dev

# Production için
npm run build
npm start
```

## ✅ Test Etme

1. Login sayfasında **"Şifreni mi Unuttun?"** linkine tıklayın
2. E-posta adresinizi girin
3. **"Kod Gönder"** butonuna tıklayın
4. E-postanızı kontrol edin (Gelen Kutusu ve Spam klasörü)
5. Gelen 6 haneli kodu girin

## 🔧 Sorun Giderme

### E-posta gelmiyor?
- ✅ Gmail App Password doğru mu?
- ✅ `.env` dosyası proje kök dizininde mi?
- ✅ Sunucuyu yeniden başlattınız mı?
- ✅ Spam klasörünü kontrol ettiniz
- ✅ Console'da hata var mı? (F12 > Console)

### "Invalid login" hatası?
- ✅ Gmail App Password'ü doğru kopyaladınız mı?
- ✅ Boşlukları kaldırdınız mı?
- ✅ 2FA aktif mi?

### Development modunda test?
- Eğer `.env` dosyası yoksa veya hatalıysa, kodlar console'a yazdırılır
- Tarayıcı console'unu açın (F12) ve kodu görün

## 📝 Railway Deployment

Railway'a deploy ederken:

1. Railway Dashboard'a gidin
2. Projenizi seçin
3. **"Variables"** sekmesine tıklayın
4. Şu değişkenleri ekleyin:
   - `GMAIL_USER` = your-email@gmail.com
   - `GMAIL_APP_PASSWORD` = your-16-digit-app-password
5. Deploy'u yeniden başlatın

## 🔒 Güvenlik Notları

- ⚠️ `.env` dosyasını **ASLA** Git'e commit etmeyin
- ⚠️ App Password'ü kimseyle paylaşmayın
- ⚠️ Production'da environment variables kullanın
- ✅ `.gitignore` dosyasında `.env` olduğundan emin olun


