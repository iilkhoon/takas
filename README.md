# dəyiş — Azərbaycanın takas platforması

> **Lazımsızını dəyiş, lazımlını tap!**

Dəyiş — insanların istifadə etmədikləri əşyaları bir-biri ilə **takas** etdiyi veb platformadır (mobil tətbiq növbəti mərhələdə). Tap.az və Lalafo alqı-satqı üçündür, Dəyiş isə **takasa fokuslanır**.

Sayt 4 dildədir: 🇦🇿 Azərbaycan (əsas), 🇬🇧 İngilis, 🇹🇷 Türk, 🇷🇺 Rus.

---

## ✨ Funksiyalar

### İstifadəçilər üçün
| Funksiya | Təsvir |
|---|---|
| **Qeydiyyat / giriş** | E-poçt və ya telefonla. Təhlükəsiz JWT + httpOnly cookie, sessiya rotasiyası |
| **Elan yerləşdirmə** | 10 şəkilə qədər (sürüşdürüb sıralamaq), kateqoriya, vəziyyət, təxmini dəyər, şəhər |
| **"Nə istəyirəm?"** | Hər elanda əvəzində istənilən kateqoriyalar + sərbəst mətn, "hər təklifə açığam", "pul fərqi olar", "çatdırılma mümkündür" |
| **Takas növləri** | Hər elanda takas növü göstərilir: **Başa baş** (pulsuz, yalnız əşya), **Üstünə pul istəyirəm** (məbləğlə), **Üstünə pul verirəm** (məbləğlə), **Pul fərqi olar**. Server təklifləri bu qaydaya görə yoxlayır |
| **Takas təklifi** | 1–5 əşya + pul fərqi (üstünə vermək və ya istəmək), mesajla. Pul seçimləri elanın takas növünə uyğun məhdudlaşır |
| **Mağazalar** | Biznes hesabı `/store` səhifəsindən mağaza açır: loqo, rəng, ünvan, iş saatları, Instagram, sayt. 50 aktiv elan limiti var. Bütün elanlarında **"MAĞAZA"** teqi görünür. Öz səhifəsi `/stores/<ad>` ünvanındadır, kataloqu `/stores`. Admin "təsdiqlənmiş" nişanı verir |
| **Ədalət göstəricisi** | Təklif zamanı dəyərlərin balansını canlı göstərir |
| **Əks-təklif** | Qarşı tərəf fərqli əşya və ya məbləğ təklif edə bilər, növbə sistemi ilə |
| **İki tərəfli təsdiq** | Takas yalnız hər iki tərəf "Takas baş tutdu" basanda tamamlanır |
| **Rəy və reytinq** | Tamamlanan takasdan sonra 1–5 ulduz |
| **Ağıllı uyğunlaşdırma** | "Sənin istədiyini verən və sənin verdiyini istəyən" insanları tapır (%-lə) |
| **Kəşf et (swipe)** | Tinder kimi: sağa — bəyən, sola — keç |
| **Daxili çat** | Hər elan üzrə söhbət, sürətli cavablar, təhlükəsiz görüş yerləri |
| **Bildirişlər** | Təklif, qəbul, mesaj, bonus və s. |
| **Səviyyələr** | Yeni üzv → Başlanğıc → Takasçı → Takas ustası → Əfsanə |
| **Təhlükəsizlik** | Telefon təsdiqi, şikayət sistemi, EXIF/GPS silinməsi, rate-limit |

### 💰 Gəlir modeli
| Mənbə | Qiymət (dəyişdirilə bilər) |
|---|---|
| **İrəli çək**: elan siyahının başına qalxır | 1.00 ₼ |
| **VIP**: 7 gün VIP blokda və axtarışda yuxarıda | 3.90 ₼ |
| **Dəyiş Plus**: 100 aktiv elan, hər ay 5 pulsuz irəli çəkmə, nişan | 9.90 ₼/ay |
| **Reklam bannerləri**: admin paneldən idarə olunur, göstərilmə və klik sayılır | birbaşa satış |
| **Google AdSense**: avtomatik, `ADSENSE_CLIENT` təyin edəndə | — |

**Pulsuz planda** 5 aktiv elan limiti var, **mağazalarda** 50. Bu, Plus-a keçməyə stimul verir.

**Sadiqlik ("6-cı pulsuz")**: hər 5 uğurlu takasdan sonra 1 pulsuz irəli çəkmə verilir.
**Dəvət proqramı**: dostun sənin kodunla gəlib ilk elanını yerləşdirəndə hər ikiniz 2 pulsuz irəli çəkmə alırsınız.
**Xoş gəldin bonusu**: qeydiyyatda 1 pulsuz irəli çəkmə.

Bütün qiymətlər və limitlər bir yerdə saxlanılır: `apps/api/src/lib/config.ts` → `pricing`.

### 🛡 Admin panel (`/admin`)
Statistika (istifadəçilər, elanlar, takaslar, mağazalar, gəlir), şikayətlərə baxış, mağazaları təsdiqləmək və ya deaktiv etmək, elanları bloklamaq, istifadəçiləri bloklamaq və bonus vermək, reklam bannerlərini idarə etmək.

---

## 🏗 Texniki quruluş

```
takas/
├── apps/
│   ├── api/          # Backend: Node.js + Express 5 + Prisma + PostgreSQL
│   │   ├── prisma/   # Verilənlər bazası sxemi, miqrasiyalar, seed (demo məlumat)
│   │   └── src/
│   │       ├── routes/   # auth, listings, offers, conversations, users, wallet, admin
│   │       └── lib/      # config (qiymətlər), auth, payments (Epoint), upload (sharp)
│   └── web/          # Frontend: Next.js 15 + React 19 + Tailwind + next-intl + Framer Motion
│       ├── messages/ # az.json, en.json, tr.json, ru.json — bütün mətnlər
│       └── src/
├── deploy/Caddyfile  # Avtomatik HTTPS
└── docker-compose.yml
```

**Niyə ayrıca API?** Gələcək **mobil tətbiq** (React Native / Flutter) eyni REST API-dən istifadə edəcək (`Authorization: Bearer <token>` dəstəklənir). Sayt və tətbiq eyni bazanı paylaşır.

### API qısa xülasə (`/api/v1`)
| Metod | Yol | Nə edir |
|---|---|---|
| POST | `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout` | Hesab |
| GET | `/auth/me` | Mən + sayğaclar |
| GET | `/listings?q=&category=&city=&condition=&minValue=&maxValue=&wants=&swapType=&seller=store\|person&store=&sort=` | Axtarış |
| GET | `/listings/home`, `/listings/:id`, `/listings/mine`, `/listings/matches`, `/listings/discover` | |
| POST/PUT/DELETE | `/listings`, `/listings/:id` | Elan CRUD |
| POST | `/listings/:id/bump`, `/listings/:id/vip`, `/listings/:id/favorite`, `/listings/:id/swipe` | |
| POST | `/uploads/images` | Şəkil yüklə (WebP-yə çevrilir) |
| GET/POST | `/offers`, `/offers/:id/{accept,reject,counter,cancel,complete,review}` | Takas axını |
| GET/POST | `/conversations`, `/conversations/:id`, `/conversations/:id/messages` | Çat |
| GET/POST | `/wallet`, `/wallet/topup`, `/wallet/plus`, `/wallet/callback/:provider` | Ödəniş |
| GET | `/stores?q=&city=&category=`, `/stores/:slug` | Mağaza kataloqu və səhifəsi |
| GET/POST/PATCH/DELETE | `/stores/me/current`, `/stores`, `/stores/me`, `/stores/me/logo` | Öz mağazanı idarə et |
| GET | `/meta` | Kateqoriyalar, şəhərlər, qiymətlər |

---

## 💻 Lokal işə salmaq

Tələblər: **Node.js 22**, **pnpm 10**, **PostgreSQL 16**.

```bash
pnpm install
```

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

```bash
cd apps/api && npx prisma migrate dev && npx tsx prisma/seed.ts
```

İki terminalda:

```bash
pnpm dev:api
```

```bash
pnpm dev:web
```

Sayt: http://localhost:3000. API: http://localhost:4000.

**Demo hesablar** (seed-dən): `elvin@demo.az`, `tural@demo.az`, `aysel@demo.az` … şifrə `Demo12345!`. Mağaza hesabı: `texnobazar@demo.az` (eyni şifrə).
**Admin**: `admin@deyis.az` / `Admin12345!` (`.env`-də dəyişin)

Test rejimində (`PAYMENT_PROVIDER=mock`) balans artırma dərhal uğurlu olur, SMS kodu həmişə `111111`-dir.

---

## 🚀 VPS/VDS serverə köçürmək

Tövsiyə olunan minimum server: **2 vCPU, 4 GB RAM, 40 GB SSD**, Ubuntu 22.04/24.04.

1. Domen alın (məs. `deyis.az`) və DNS-də `A` qeydini serverin IP-sinə yönləndirin (`@` və `www`).
2. Serverdə Docker qurun:
   ```bash
   curl -fsSL https://get.docker.com | sh
   ```
3. Layihəni klonlayın və tənzimləyin:
   ```bash
   git clone https://github.com/iilkhoon/takas.git && cd takas
   ```
   ```bash
   cp .env.production.example .env && nano .env
   ```
   Şifrələri `openssl rand -hex 32` ilə yaradın.
4. İşə salın (SSL sertifikatı avtomatik alınır):
   ```bash
   docker compose up -d --build
   ```
5. Kateqoriyaları və admin hesabını yaradın (demo məlumat olmadan):
   ```bash
   docker compose exec api npx tsx prisma/seed.ts --no-demo
   ```

**Yeniləmə:** `git pull && docker compose up -d --build`
**Ehtiyat nüsxə:** `docker compose exec db pg_dump -U deyis deyis > backup.sql` (cron ilə gündəlik edin). Şəkillər `uploads` volume-undadır.

---

## ✅ Canlıya çıxmazdan əvvəl edilməli olanlar

- [ ] **Domen**: `deyis.az` boşdursa, qeydiyyatdan keçirin. Məşğuldursa: `deyis.app`, `deyisek.az`, `dəyiş.az` (IDN).
- [ ] **Ödəniş**: [Epoint](https://epoint.az) (və ya Kapital Bank / Payriff) ilə müqavilə bağlayın. Açarları `.env`-ə yazın, `PAYMENT_PROVIDER=epoint` qoyun. Callback ünvanı: `https://DOMAIN/api/v1/wallet/callback/epoint`. İnteqrasiyanı Epoint-in son sənədləri ilə yoxlayın.
- [ ] **SMS**: telefon təsdiqi üçün yerli SMS provayderi qoşun (`apps/api/src/routes/auth.ts` → `send-code`).
- [ ] **Hüquqi**: VÖEN / fərdi sahibkar qeydiyyatı. İstifadə şərtləri və məxfilik mətnlərini hüquqşünasa yoxlatdırın.
- [ ] **AdSense**: sayt trafik qazandıqdan sonra müraciət edin.
- [ ] Sosial şəbəkə linklərini (`apps/web/src/components/Footer.tsx`) öz hesablarınızla əvəz edin.

## 🗺 Növbəti mərhələlər
1. **Mobil tətbiq** (React Native + Expo) — eyni API ilə.
2. Real vaxt çat (Socket.IO). İndi hər 4 saniyədə yenilənir.
3. Push bildirişlər (FCM), e-poçt bildirişləri.
4. Şəkillər üçün S3 / Cloudflare R2 + CDN (`apps/api/src/lib/upload.ts`).
5. Tam mətn axtarışı (PostgreSQL `pg_trgm` və ya Meilisearch).
6. "Biznes profili": mağazalar üçün ödənişli hesablar.
7. Çoxtərəfli takas zənciri (A→B→C→A).

---

Brend, loqo, rənglər və marketinq planı: [`docs/BRAND.md`](docs/BRAND.md).

3D ikonlar: [Microsoft Fluent Emoji](https://github.com/microsoft/fluentui-emoji) (MIT lisenziyası).
