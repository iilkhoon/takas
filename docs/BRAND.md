# Dəyiş — brend kitabçası və marketinq planı

## 1. Ad: **dəyiş**

- Azərbaycan dilində "dəyiş!" əmr formasıdır, yəni "dəyişdir!". Brendin özü artıq çağırışdır.
- Qısadır (5 hərf), asan yadda qalır, hər yaşda başa düşülür.
- **"ə" hərfi** brendin imzasıdır: o, yalnız Azərbaycan əlifbasındadır. Loqoda "ə" qırmızı rəngdədir.
- Latın variantı: `deyis` (domen, sosial şəbəkə, e-poçt üçün).

**Alternativ adlar** (domen və ya ticarət nişanı məşğul olarsa): *Dəyişək*, *Takasla.az*, *Alver*, *Əvəz*, *Trokka*.

> ⚠️ Domeni (`deyis.az`) və ticarət nişanını Əqli Mülkiyyət Agentliyində yoxlayın. Bunu mən yoxlaya bilmədim.

### Şüar
- **AZ:** Lazımsızını dəyiş, lazımlını tap!
- **TR:** İhtiyacın olmayanı takasla, ihtiyacın olanı bul!
- **RU:** Меняй ненужное на нужное!
- **EN:** Swap what you don't need for what you do!

## 2. Loqo

İki ox bir dairə boyunca bir-birini təqib edir (takas), mərkəzdə zəfəran rəngli nöqtə var (nar dənəsi). Hamısı nar qırmızısı fonda, yumru künclü kvadratın içindədir.

- Fayl: `apps/web/src/app/icon.svg` (favicon) və `apps/web/public/brand/mark.svg`
- Komponent: `apps/web/src/components/Logo.tsx`
- Saytda loqonun üzərinə gələndə oxlar 180° fırlanır.

## 3. Rənglər: Azərbaycandan ilhamla

| Ad | HEX | Mənası | İstifadə |
|---|---|---|---|
| **Nar** | `#E8334A` | Nar, Azərbaycanın simvolu | Əsas düymələr, loqo, qiymətlər |
| **Xəzər** | `#0E9E97` | Xəzər dənizi | Uğur, "istəyir" blokları, təsdiq |
| **Zəfəran** | `#FFB000` | Zəfəran, şərq ədviyyatı | VIP, bonuslar, diqqət |
| **Lalə** | `#7C4DFF` | Lalə | Plus abunəliyi, oyunlaşdırma |
| **Mürəkkəb** | `#14121F` | — | Mətn, tünd fonlar |
| **Krem** | `#FFF8F1` | — | Səhifə fonu (isti, mehriban) |

## 4. Şriftlər
- **Unbounded** (başlıqlar): enli, əyləncəli, cəsarətli.
- **Manrope** (mətn): oxunaqlı və müasir.
- Hər ikisi ə, ğ, ş, ı və kiril hərflərini dəstəkləyir. Şriftlər layihənin içindədir, Google-a sorğu getmir.

## 5. Vizual dil
- **3D emojilər** (Fluent Emoji). Xərcsiz, amma premium və əyləncəli görünür.
- **Oyunvari 3D düymələr**: altında kölgə olur, basanda "batır".
- Hər yerdə yumşaq animasiyalar: kartlar görünəndə qalxır, ürək partlayır, takas oxları fırlanır.
- Ton: dostcasına "sən" ilə müraciət, qısa cümlələr, emojilərdən ölçülü istifadə.

## 6. Bazar araşdırmasından nəticələr

- **Tap.az** Azərbaycanın ən populyar elan saytıdır, **Lalafo** isə ikincidir. Hər ikisi pulsuz elan + ödənişli irəli çəkmə/VIP modeli ilə qazanır. Bizim model də istifadəçilərin artıq öyrəşdiyi bu sistemə əsaslanır.
- Bu saytlarda "barter" sözü elanlarda tez-tez keçir, amma **takas üçün xüsusi alət yoxdur**: təklif, əks-təklif, ədalət göstəricisi, uyğunlaşdırma. Bizim əsas fərqimiz budur.
- Türkiyədə də takas tətbiqləri var (Takasla, Barty), lakin Azərbaycan bazarında bu boşluq açıqdır.
- Azərbaycanda e-ticarət sürətlə böyüyür: Mərkəzi Bankın məlumatına görə, 2025-də e-ticarət əməliyyatlarının sayı 43% artıb.
- Ən çox takas olunacaq kateqoriyalar: **telefonlar, oyun konsolları, uşaq əşyaları** (uşaqlar tez böyüyür), **kitablar və abituriyent vəsaitləri**, geyim, velosipedlər, avto ehtiyat hissələri.
- Ödəniş şlüzü üçün **Epoint** uyğundur: Mərkəzi Bankın lisenziyası var, Kapital Bank tərəfindən dəstəklənir və REST API-si var.

## 7. Marketinq planı (ilk 3 ay)

**Ay 1: Buraxılış**
- "İlk 1000 takasçı" kampaniyası: hər kəsə Plus 1 ay pulsuz. Bunu admin paneldən bonus verməklə etmək olar.
- Instagram və TikTok-da "Nəyi nəyə dəyişdim?" reels seriyası: köhnə telefon → velosiped kimi real hekayələr.
- Facebook-dakı "Bakı barter", "Uşaq əşyaları takas" qruplarında paylaşım.

**Ay 2: Böyümə**
- Universitetlərlə əməkdaşlıq: tələbələr arasında kitab takası həftəsi (ADA, BDU, UNEC).
- Mikro-influenserlər (5–50K izləyici). Ödəniş barter ilə də ola bilər.
- Dəvət proqramı: hər dəvətə 2 pulsuz irəli çəkmə (artıq işləyir).

**Ay 3: Monetizasiya**
- Mağazalara və servis mərkəzlərinə reklam banneri satışı.
- VIP və Plus-u aktiv təbliğ etmək.
- 10K aktiv istifadəçidən sonra AdSense.

**Reklam mesajları (nümunələr):**
- "Evində yatan PS4 sənə velosiped ola bilər. Dəyiş!"
- "Uşağın böyüdü? Oyuncaqlarını dəyiş, pul xərcləmə."
- "Kitabını oxudun? Dəyiş, yenisini oxu."
