/* eslint-disable no-console */
import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import bcrypt from 'bcryptjs';
import sharp from 'sharp';
import { PrismaClient, type Condition } from '@prisma/client';
import { customAlphabet } from 'nanoid';

const prisma = new PrismaClient();
const refCode = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 7);
const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR ?? './uploads');
const EMOJI_DIR = path.join(__dirname, 'demo-emoji');

// slug, emoji, rəng, az, en, tr, ru
const CATEGORIES: [string, string, string, string, string, string, string][] = [
  ['phones', 'mobile_phone', '#E8334A', 'Telefonlar', 'Phones', 'Telefonlar', 'Телефоны'],
  ['computers', 'laptop', '#3B5BDB', 'Kompüter və noutbuklar', 'Computers & Laptops', 'Bilgisayar & Laptop', 'Компьютеры и ноутбуки'],
  ['gaming', 'video_game', '#7048E8', 'Oyun və konsollar', 'Gaming & Consoles', 'Oyun & Konsol', 'Игры и приставки'],
  ['electronics', 'headphone', '#1098AD', 'Audio və elektronika', 'Audio & Electronics', 'Ses & Elektronik', 'Аудио и электроника'],
  ['photo-tv', 'camera', '#495057', 'Foto, video və TV', 'Photo, Video & TV', 'Foto, Video & TV', 'Фото, видео и ТВ'],
  ['home', 'couch_and_lamp', '#E67700', 'Ev və mebel', 'Home & Furniture', 'Ev & Mobilya', 'Дом и мебель'],
  ['appliances', 'teapot', '#0CA678', 'Məişət texnikası', 'Home Appliances', 'Ev Aletleri', 'Бытовая техника'],
  ['fashion', 't-shirt', '#D6336C', 'Geyim və ayaqqabı', 'Clothing & Shoes', 'Giyim & Ayakkabı', 'Одежда и обувь'],
  ['accessories', 'watch', '#5C7CFA', 'Saat və aksesuarlar', 'Watches & Accessories', 'Saat & Aksesuar', 'Часы и аксессуары'],
  ['jewelry', 'ring', '#F59F00', 'Zərgərlik', 'Jewelry', 'Takı & Mücevher', 'Ювелирные изделия'],
  ['beauty', 'lipstick', '#F06595', 'Gözəllik və sağlamlıq', 'Beauty & Health', 'Güzellik & Sağlık', 'Красота и здоровье'],
  ['kids', 'teddy_bear', '#FAB005', 'Uşaq aləmi', 'Kids & Baby', 'Çocuk & Bebek', 'Детский мир'],
  ['sports', 'soccer_ball', '#2F9E44', 'İdman və istirahət', 'Sports & Outdoors', 'Spor & Outdoor', 'Спорт и отдых'],
  ['bikes', 'bicycle', '#12B886', 'Velosiped və skuter', 'Bikes & Scooters', 'Bisiklet & Scooter', 'Велосипеды и самокаты'],
  ['auto', 'automobile', '#C92A2A', 'Avto və ehtiyat hissələri', 'Auto & Parts', 'Oto & Yedek Parça', 'Авто и запчасти'],
  ['tools', 'hammer_and_wrench', '#868E96', 'Alətlər və təmir', 'Tools & DIY', 'Alet & Tadilat', 'Инструменты и ремонт'],
  ['books', 'books', '#A61E4D', 'Kitab və təhsil', 'Books & Education', 'Kitap & Eğitim', 'Книги и обучение'],
  ['music', 'guitar', '#E8590C', 'Musiqi alətləri', 'Musical Instruments', 'Müzik Aletleri', 'Музыкальные инструменты'],
  ['hobby', 'artist_palette', '#9C36B5', 'Hobbi və kolleksiya', 'Hobbies & Collectibles', 'Hobi & Koleksiyon', 'Хобби и коллекции'],
  ['pets', 'dog_face', '#B08968', 'Ev heyvanları üçün', 'Pet Supplies', 'Evcil Hayvan Ürünleri', 'Товары для животных'],
  ['garden', 'potted_plant', '#37B24D', 'Bitki və bağ', 'Plants & Garden', 'Bitki & Bahçe', 'Растения и сад'],
  ['services', 'handshake', '#1C7ED6', 'Xidmət və bacarıqlar', 'Services & Skills', 'Hizmet & Yetenek', 'Услуги и навыки'],
  ['other', 'wrapped_gift', '#FF6B6B', 'Digər', 'Other', 'Diğer', 'Другое'],
];

const USERS = [
  ['Elvin Məmmədov', 'elvin@demo.az', 'baku', 'Texnologiya həvəskarıyam. Köhnə cihazları yenisi ilə dəyişməyi sevirəm.'],
  ['Aysel Hüseynova', 'aysel@demo.az', 'baku', 'Ana, dizayner. Uşaq əşyalarını takas edirəm — həm qənaət, həm ekologiya 🌿'],
  ['Rəşad Quliyev', 'reshad@demo.az', 'sumgait', 'Avtomobil və alətlər. Hər şeyi danışmaq olar.'],
  ['Nigar Əliyeva', 'nigar@demo.az', 'ganja', 'Kitab qurdu 📚 Oxuduğum kitabları yenilərinə dəyişirəm.'],
  ['Tural Həsənov', 'tural@demo.az', 'baku', 'Gamer. PS5, Xbox, Switch — gəlin danışaq.'],
  ['Leyla Kərimova', 'leyla@demo.az', 'baku', 'Moda və gözəllik. Yalnız orijinal məhsullar.'],
  ['Orxan Babayev', 'orxan@demo.az', 'lankaran', 'Musiqiçi 🎸 Alət dəyişmək istəyənlər yazsın.'],
  ['Günay İsmayılova', 'gunay@demo.az', 'shaki', 'Əl işləri və bitkilər. Şəkidən sevgilərlə.'],
] as const;

// [sahib indeksi, kateqoriya, emoji, başlıq, təsvir, vəziyyət, dəyər, istədiklərim (mətn), istənilən kateqoriyalar, nağd qəbul, hər şeyə açıq]
type Demo = [number, string, string, string, string, Condition, number, string, string[], boolean, boolean];
const LISTINGS: Demo[] = [
  [0, 'phones', 'mobile_phone', 'iPhone 13 Pro 256GB, Sierra Blue', 'Batareya 87%. Qutusu və adapteri var. Heç bir cızığı yoxdur, həmişə qabda istifadə olunub. Face ID işləyir.', 'LIKE_NEW', 1350, 'Noutbuk (MacBook Air M1/M2) və ya PS5', ['computers', 'gaming'], true, false],
  [0, 'electronics', 'headphone', 'Sony WH-1000XM4 qulaqlıq', 'Səs-küy izolyasiyası mükəmməl işləyir. Çantası, kabelləri var.', 'GOOD', 320, 'Smart saat və ya Bluetooth səsucaldan', ['accessories', 'electronics'], true, false],
  [4, 'gaming', 'video_game', 'PlayStation 5 + 2 pult + 4 disk', 'FIFA 24, GTA V, Spider-Man 2, God of War. Bütün avadanlıq işləkdir, zəmanət bitib.', 'GOOD', 1100, 'iPhone 13/14 və ya oyun noutbuku', ['phones', 'computers'], true, false],
  [4, 'gaming', 'joystick', 'Nintendo Switch OLED', 'Ağ rəng, 3 oyun (Zelda, Mario Kart, Pokémon). Ekran qoruyucusu var.', 'LIKE_NEW', 650, 'Velosiped və ya planşet', ['bikes', 'electronics'], true, false],
  [1, 'kids', 'teddy_bear', 'Uşaq oyuncaqları dəsti (30+ əşya)', 'LEGO Duplo, yumşaq oyuncaqlar, tapmacalar. Təmiz, yuyulub. 2-5 yaş üçün.', 'GOOD', 90, 'Uşaq velosipedi və ya kitablar', ['kids', 'books', 'bikes'], false, false],
  [1, 'kids', 'baby_bottle', 'Uşaq arabası Chicco + aksesuarlar', 'Qatlanan model, yağış örtüyü və çantası ilə. 1 il istifadə olunub.', 'GOOD', 280, 'Uşaq avtomobil oturacağı və ya uşaq mebeli', ['kids', 'home'], true, false],
  [2, 'auto', 'automobile', 'Prius 30 üçün 4 ədəd disk + təkər', 'R15, Bridgestone yay təkərləri, 70% protektor.', 'GOOD', 450, 'Qış təkərləri R16 və ya alət dəsti', ['auto', 'tools'], true, false],
  [2, 'tools', 'hammer_and_wrench', 'Bosch drel + 120 hissəli alət dəsti', 'Professional seriya, 2 batareya, çantada. Çox az işlənib.', 'LIKE_NEW', 260, 'Velosiped və ya avtomobil kamerası', ['bikes', 'auto', 'electronics'], true, false],
  [3, 'books', 'books', '25 kitab: Azərbaycan və dünya ədəbiyyatı', 'Sabahəddin Əli, Orxan Pamuk, Cəlil Məmmədquluzadə, Dostoyevski… Hamısı yaxşı vəziyyətdə.', 'GOOD', 120, 'Başqa kitablar, elektron kitab oxuyucu', ['books', 'electronics'], false, false],
  [3, 'books', 'graduation_cap', 'Abituriyent hazırlıq kitabları (DİM)', 'Riyaziyyat, fizika, ingilis dili test topluları. Son nəşrlər.', 'LIKE_NEW', 60, 'Kitablar və ya qulaqlıq', ['books', 'electronics'], false, false],
  [5, 'fashion', 'dress', 'Zara axşam paltarı (S ölçü)', 'Bir dəfə geyinilib. Tünd yaşıl rəng, etiketi saxlanılıb.', 'LIKE_NEW', 110, 'Çanta və ya kosmetika', ['accessories', 'beauty', 'fashion'], false, false],
  [5, 'beauty', 'lipstick', 'Orijinal kosmetika dəsti (MAC, Dior)', '5 pomada, 2 tual. Açılmayıb, hədiyyə gəlib.', 'NEW', 180, 'Saat və ya ətir', ['accessories', 'beauty'], true, false],
  [5, 'accessories', 'handbag', 'Michael Kors çanta, orijinal', 'Qəhvəyi dəri, sertifikatı var. Çox səliqəli saxlanılıb.', 'GOOD', 240, 'Smart saat və ya qulaqlıq', ['accessories', 'electronics'], true, false],
  [6, 'music', 'guitar', 'Yamaha F310 akustik gitara', 'Yeni simlər, çanta və kapo ilə. Başlayanlar üçün ideal.', 'GOOD', 220, 'Elektro gitara və ya səs kartı / mikrofon', ['music', 'electronics'], true, false],
  [6, 'music', 'studio_microphone', 'Studiya mikrofonu Rode NT1', 'Pop filtr və shock mount ilə. Ev studiyası üçün.', 'LIKE_NEW', 300, 'Gitara pedalı və ya MIDI klaviatura', ['music'], true, true],
  [7, 'garden', 'potted_plant', 'Otaq bitkiləri — 6 dibçək', 'Monstera, sansevieriya, aloe, kaktuslar. Şəkidə öz evimdə yetişdirilib.', 'GOOD', 70, 'Ev dekoru və ya əl işi materialları', ['home', 'hobby'], false, true],
  [7, 'hobby', 'artist_palette', 'Rəsm dəsti: yağlı boya + molbert', 'Winsor & Newton boyalar, 10 fırça, taxta molbert.', 'LIKE_NEW', 150, 'Bitkilər, kitablar və ya foto aparat', ['garden', 'books', 'photo-tv'], false, false],
  [0, 'computers', 'laptop', 'Lenovo ThinkPad T14, i5, 16GB RAM', 'Ofis və proqramlaşdırma üçün əla. SSD 512GB, batareya yaxşı saxlayır.', 'GOOD', 900, 'iPhone və ya oyun konsolu', ['phones', 'gaming'], true, false],
  [4, 'computers', 'desktop_computer', 'Oyun kompüteri RTX 3060, Ryzen 5', '16GB RAM, 1TB NVMe, RGB keys. Monitor daxil deyil.', 'GOOD', 1600, 'MacBook Pro və ya iPhone 15', ['computers', 'phones'], true, false],
  [2, 'bikes', 'bicycle', 'Dağ velosipedi Trek Marlin 5', 'Ölçü M, 29 düym təkər. Disk əyləc. Təzə servis olunub.', 'GOOD', 700, 'Noutbuk və ya elektrik skuter', ['computers', 'bikes'], true, false],
  [1, 'bikes', 'kick_scooter', 'Xiaomi elektrik skuter Pro 2', 'Bir şarjla 40 km. Yeni təkərlər. Baku küçələri üçün ideal.', 'GOOD', 550, 'Velosiped və ya telefon', ['bikes', 'phones'], true, false],
  [6, 'electronics', 'television', 'Samsung Smart TV 55" 4K', 'Divar asqısı və pultu ilə. Ekranda heç bir problem yoxdur.', 'GOOD', 600, 'PlayStation və ya soundbar', ['gaming', 'electronics'], true, false],
  [3, 'photo-tv', 'camera_with_flash', 'Canon EOS 250D + 18-55 obyektiv', 'Cəmi 8000 çəkiliş. Çanta, yaddaş kartı və əlavə batareya.', 'LIKE_NEW', 750, 'Noutbuk və ya iPad', ['computers', 'electronics'], true, false],
  [7, 'home', 'couch_and_lamp', 'Divan + döşəmə lampası', 'Boz rəngli 3 yerlik divan, açılır. Şəkidən götürmək lazımdır.', 'GOOD', 400, 'Məişət texnikası və ya mətbəx dəsti', ['appliances', 'home'], true, true],
  [1, 'appliances', 'teapot', 'Tefal çaydan + Philips blender', 'İkisi də işləkdir, az istifadə olunub.', 'GOOD', 80, 'Uşaq əşyaları və ya kitablar', ['kids', 'books'], false, true],
  [5, 'jewelry', 'ring', 'Gümüş üzük və sırğa dəsti (925)', 'Əl işi, firuzə daşlı. Bir dəfə taxılıb.', 'LIKE_NEW', 130, 'Kosmetika və ya çanta', ['beauty', 'accessories'], false, false],
  [0, 'accessories', 'watch', 'Apple Watch Series 7, 45mm', 'Batareya 91%. 3 ədəd qayış ilə.', 'GOOD', 420, 'AirPods Pro və ya iPad', ['electronics'], true, false],
  [2, 'sports', 'soccer_ball', 'İdman dəsti: hantel, ip, xalça', '2x10kg hantellər, yoga xalçası, tullanma ipi.', 'GOOD', 95, 'Velosiped aksesuarları və ya alətlər', ['bikes', 'tools'], true, true],
  [4, 'sports', 'basketball', 'Basketbol topu Spalding + səbət', 'Divara bərkidilən səbət, top yenidir.', 'LIKE_NEW', 85, 'Oyunlar (PS5 diski)', ['gaming'], false, false],
  [7, 'services', 'handshake', 'İngilis dili dərsləri (10 saat)', 'IELTS 8.0. Onlayn və ya Şəkidə əyani. Qarşılığında veb sayt və ya dizayn işi istəyirəm.', 'NEW', 200, 'Veb sayt, loqo dizaynı, foto çəkiliş', ['services'], false, false],
  [6, 'services', 'clapper_board', 'Video montaj və reels hazırlanması', '5 ədəd peşəkar reels / TikTok videosu. Portfolio mesajla.', 'NEW', 250, 'Musiqi aləti və ya mikrofon', ['music', 'electronics'], false, false],
  [3, 'pets', 'cat_face', 'Pişik üçün ev + cızma dirəyi', 'Böyük çoxmərtəbəli ev. Pişiyimiz sevmədi 😄', 'LIKE_NEW', 75, 'Kitablar və ya bitkilər', ['books', 'garden'], false, true],
  [5, 'fashion', 'running_shoe', 'Nike Air Force 1, 39 ölçü', 'Orijinal, 3 dəfə geyinilib, ağ rəng.', 'LIKE_NEW', 140, 'Çanta və ya digər ayaqqabı', ['fashion', 'accessories'], true, false],
  [2, 'auto', 'wrench', 'Avtomobil kompressoru və aküləri işə salma cihazı', 'Jump starter 20000mAh + 12V kompressor.', 'NEW', 160, 'Videoqeydiyyatçı və ya alətlər', ['auto', 'tools', 'electronics'], true, false],
  [1, 'kids', 'baby', 'Uşaq geyimləri 1-2 yaş (40+ ədəd)', 'Qız uşağı üçün. LC Waikiki, Zara Kids. Təmiz, ütülü.', 'GOOD', 100, 'Böyük ölçülü uşaq geyimləri və ya oyuncaqlar', ['kids', 'fashion'], false, false],
  [0, 'phones', 'mobile_phone', 'Samsung Galaxy S22 Ultra 256GB', 'S Pen ilə. Ekranda kiçik bir cızıq var. Qutusu var.', 'GOOD', 980, 'iPhone 14 (fərqi nağd verərəm) və ya kamera', ['phones', 'photo-tv'], true, false],
];

async function makeDemoImage(emoji: string, color: string, variant: number) {
  const now = new Date();
  const sub = `listings/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`;
  const dir = path.join(UPLOAD_DIR, sub);
  await fs.mkdir(dir, { recursive: true });
  const id = `demo_${emoji}_${variant}_${Math.random().toString(36).slice(2, 8)}`;
  const angle = [135, 160, 110][variant % 3];
  const bg = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900">
      <defs>
        <linearGradient id="g" gradientTransform="rotate(${angle - 90} .5 .5)">
          <stop offset="0" stop-color="${color}" stop-opacity="0.16"/>
          <stop offset="1" stop-color="${color}" stop-opacity="0.42"/>
        </linearGradient>
        <radialGradient id="s" cx=".5" cy=".5" r=".5">
          <stop offset="0" stop-color="#14121F" stop-opacity=".28"/>
          <stop offset="1" stop-color="#14121F" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="1200" height="900" fill="#FFF8F1"/>
      <rect width="1200" height="900" fill="url(#g)"/>
      <circle cx="${variant % 2 ? 980 : 220}" cy="${variant % 2 ? 160 : 760}" r="230" fill="${color}" fill-opacity=".14"/>
      <circle cx="600" cy="450" r="300" fill="#FFFFFF" fill-opacity=".55"/>
      <ellipse cx="600" cy="745" rx="230" ry="34" fill="url(#s)"/>
    </svg>`);
  const emojiBuf = await sharp(path.join(EMOJI_DIR, `${emoji}.png`))
    .resize(520, 520, { kernel: 'lanczos3' })
    .rotate(variant === 1 ? -8 : variant === 2 ? 8 : 0, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  const meta = await sharp(emojiBuf).metadata();
  const full = await sharp(bg)
    .composite([{ input: emojiBuf, left: Math.round(600 - (meta.width ?? 520) / 2), top: Math.round(440 - (meta.height ?? 520) / 2) }])
    .webp({ quality: 84 })
    .toBuffer();
  await fs.writeFile(path.join(dir, `${id}.webp`), full);
  await sharp(full).resize(480, 480, { fit: 'cover' }).webp({ quality: 78 }).toFile(path.join(dir, `${id}_t.webp`));
  return { url: `/uploads/${sub}/${id}.webp`, thumbUrl: `/uploads/${sub}/${id}_t.webp` };
}

async function main() {
  console.log('Kateqoriyalar…');
  for (const [i, [slug, icon, color, az, en, tr, ru]] of CATEGORIES.entries()) {
    await prisma.category.upsert({
      where: { slug },
      create: { slug, icon, color, sortOrder: i, nameAz: az, nameEn: en, nameTr: tr, nameRu: ru },
      update: { icon, color, sortOrder: i, nameAz: az, nameEn: en, nameTr: tr, nameRu: ru },
    });
  }

  const adminEmail = (process.env.ADMIN_EMAIL ?? 'admin@deyis.az').toLowerCase();
  const adminPass = process.env.ADMIN_PASSWORD ?? 'Admin12345!';
  await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      email: adminEmail,
      name: 'Dəyiş Admin',
      passwordHash: await bcrypt.hash(adminPass, 11),
      role: 'ADMIN',
      referralCode: refCode(),
      emailVerified: true,
    },
    update: { role: 'ADMIN' },
  });
  console.log(`Admin: ${adminEmail}`);

  if (process.argv.includes('--no-demo') || process.env.SEED_DEMO === '0') {
    console.log('Demo məlumatlar ötürüldü.');
    return;
  }
  const existingDemo = await prisma.user.count({ where: { email: { endsWith: '@demo.az' } } });
  if (existingDemo) {
    console.log('Demo məlumatlar artıq var.');
    return;
  }

  console.log('Demo istifadəçilər və elanlar…');
  const hash = await bcrypt.hash('Demo12345!', 11);
  const users = [];
  for (const [idx, [name, email, city, bio]] of USERS.entries()) {
    users.push(
      await prisma.user.create({
        data: {
          name,
          email,
          city,
          bio,
          passwordHash: hash,
          referralCode: refCode(),
          phoneVerified: idx % 2 === 0,
          completedTrades: [7, 4, 12, 3, 21, 6, 2, 9][idx],
          ratingSum: [34, 19, 58, 15, 101, 28, 10, 45][idx],
          ratingCount: [7, 4, 12, 3, 21, 6, 2, 9][idx],
          boostCredits: 2,
          balance: 1000,
          plan: idx === 4 ? 'PLUS' : 'FREE',
          planUntil: idx === 4 ? new Date(Date.now() + 30 * 864e5) : null,
        },
      }),
    );
  }
  const cats = new Map((await prisma.category.findMany()).map((c) => [c.slug, c]));
  for (const [i, l] of LISTINGS.entries()) {
    const [owner, catSlug, emoji, title, description, condition, value, wantedText, wantedCategories, acceptsCash, openToAnything] = l;
    const cat = cats.get(catSlug)!;
    const images = [];
    for (let v = 0; v < 3; v++) images.push(await makeDemoImage(emoji, cat.color, v));
    const ownerUser = users[owner];
    await prisma.listing.create({
      data: {
        ownerId: ownerUser.id,
        title,
        description,
        categoryId: cat.id,
        condition,
        estimatedValue: value,
        city: ownerUser.city,
        wantedText,
        wantedCategories,
        acceptsCash,
        openToAnything,
        canShip: i % 3 === 0,
        views: 20 + ((i * 37) % 400),
        vipUntil: [0, 2, 10, 13, 19, 22].includes(i) ? new Date(Date.now() + 5 * 864e5) : null,
        bumpedAt: new Date(Date.now() - i * 47 * 60 * 1000),
        createdAt: new Date(Date.now() - i * 3 * 3600 * 1000),
        images: { create: images.map((im, k) => ({ ...im, sortOrder: k })) },
      },
    });
    process.stdout.write('.');
  }
  console.log('\nHazırdır! Demo giriş: elvin@demo.az / Demo12345!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
