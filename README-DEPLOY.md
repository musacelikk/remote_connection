# Railway Deployment Rehberi

## 🚀 Railway'a Deploy Etme

### 1. Railway Hesabı Oluşturma
1. [Railway.app](https://railway.app) adresine gidin
2. GitHub hesabınızla giriş yapın
3. "New Project" butonuna tıklayın

### 2. Projeyi Bağlama
1. "Deploy from GitHub repo" seçeneğini seçin
2. Bu repository'yi seçin
3. Railway otomatik olarak Next.js'i algılayacak

### 3. Environment Variables (Gerekirse)
Railway dashboard'da "Variables" sekmesinden:
- `PORT` - Railway otomatik sağlar (gerekmez)
- `NODE_ENV=production` - Otomatik ayarlanır

### 4. Build ve Deploy
Railway otomatik olarak:
- `npm install` çalıştırır
- `npm run build` çalıştırır
- `npm start` ile uygulamayı başlatır

### 5. Domain Ayarlama
1. Railway dashboard'da "Settings" > "Networking"
2. "Generate Domain" ile otomatik domain alın
3. Veya kendi domain'inizi ekleyin

## 📝 Önemli Notlar

### Veritabanı
- Şu anda JSON dosyası kullanılıyor (`data/users.json`)
- **Railway'de dosya sistemi geçici olabilir!**
- Production için Railway PostgreSQL ekleyin:
  1. Railway dashboard'da "New" > "Database" > "PostgreSQL"
  2. `DATABASE_URL` environment variable otomatik eklenir
  3. Kodda PostgreSQL'e geçiş yapın

### Port Yapılandırması
Next.js otomatik olarak Railway'ın sağladığı PORT'u kullanır.
Ekstra yapılandırma gerekmez.

### Build Optimizasyonları
- Next.js production build otomatik optimize edilir
- Static dosyalar CDN'den servis edilir

## 🔧 Sorun Giderme

### Build Hatası
- Railway logs'u kontrol edin
- `package.json` script'lerinin doğru olduğundan emin olun

### Port Hatası
- Railway otomatik PORT sağlar
- Manuel PORT ayarı gerekmez

### Veritabanı Hatası
- JSON dosyası Railway'de geçici olabilir
- PostgreSQL kullanın (önerilir)

## 📚 Sonraki Adımlar

1. ✅ Railway'a deploy et
2. ⬜ PostgreSQL database ekle
3. ⬜ Environment variables ayarla
4. ⬜ Custom domain ekle
5. ⬜ SSL sertifikası (otomatik)

