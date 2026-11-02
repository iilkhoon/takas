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

Sarı kvadrat qalın qara konturla çəkilib, altında sərt qara "kölgə" var. İçində iki qara ox bir-birini təqib edir (takas), mərkəzdə moruq rəngli nöqtə durur. Sözlü loqoda "ə" hərfi moruq rəngindədir.

- Fayl: `apps/web/src/app/icon.svg` (favicon) və `apps/web/public/brand/mark.svg`
- Komponent: `apps/web/src/components/Logo.tsx`
- Saytda loqonun üzərinə gələndə oxlar fırlanır.

## 3. Rənglər: neobrutalizm palitrası

Rənglər parlaq və düzdür (qradiyent yoxdur). Hər element qalın qara konturla əhatələnir.

| Ad (kodda) | HEX | İstifadə |
|---|---|---|
| **Moruq** (`nar`) | `#FF2E63` | Əsas düymələr, CTA, aksent |
| **Nanə** (`xezer`) | `#1FD68D` | Uğur, "istəyir" blokları, "üstünə verir" |
| **Limon** (`zefran`) | `#FFDB1F` | Brend rəngi, VIP, bonuslar, "üstünə istəyir" |
| **Göy** (`lale`) | `#3D5AFE` | Plus, **Mağaza** teqi, "başa baş" |
| **Mürəkkəb** (`ink`) | `#0B0B0F` | Mətn, konturlar, kölgələr |
| **Krem** (`cream`) | `#FFF7E8` | Səhifə fonu |

## 4. Şriftlər
- **Geologica** (başlıqlar): enli və cəsarətli, neobrutalizmə uyğundur.
- **Onest** (mətn): oxunaqlıdır, Azərbaycan və kiril hərflərini tam dəstəkləyir.
- **JetBrains Mono** (qiymətlər, nişanlar, etiketlər): "texniki", poster ruhu.
- Şriftlər layihənin içindədir (`@fontsource-variable`), Google-a sorğu getmir.

## 5. Vizual dil: neobrutalizm
- **2.5px qara kontur** düymələrdə, kartlarda, inputlarda və nişanlarda.
- **Sərt kölgələr** bulanıqlıq olmadan çəkilir (`4px 4px 0 #0B0B0F`). Hover zamanı element qalxır, basanda kölgəyə "batır".
- Kiçik radiuslar, düz parlaq rəng blokları, fonda nöqtəli tor.
- **3D emojilər** (Fluent Emoji) əyləncəli ton saxlayır.
- **Takas növü nişanları**: hər növün öz rəngi və ikonu var. Başa baş — göy ⚖, üstünə istəyir — sarı ↙, üstünə verir — yaşıl ↗.
- Ton: dostcasına "sən" ilə müraciət, qısa cümlələr.

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
