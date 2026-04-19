/**
 * SMGH Database Setup Script
 * Run: node setup-db.js
 * No npx or prisma CLI needed — uses raw mysql2 to create tables and seed data.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// ── MySQL connection from .env ──
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found at:', envPath);
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const dbUrlMatch = envContent.match(/DATABASE_URL=(.+)/);
if (!dbUrlMatch) {
  console.error('❌ DATABASE_URL not found in .env');
  process.exit(1);
}

const dbUrl = dbUrlMatch[1].trim();
const url = new URL(dbUrl);
const dbConfig = {
  host: url.hostname,
  port: parseInt(url.port) || 3306,
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: decodeURIComponent(url.pathname.slice(1)),
  multipleStatements: true,
  charset: 'utf8mb4',
};

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  SMGH Database Setup');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Host:', dbConfig.host);
console.log('Database:', dbConfig.database);
console.log('User:', dbConfig.user);
console.log('');

const uid = () => crypto.randomUUID();

async function main() {
  let mysql;
  try {
    mysql = await import('mysql2/promise');
  } catch (e) {
    console.error('❌ mysql2 not installed. Run: npm install mysql2');
    process.exit(1);
  }

  const mysqlLib = mysql.default || mysql;

  console.log('Connecting to MySQL...');
  const conn = await mysqlLib.createConnection(dbConfig);
  console.log('✅ Connected!');
  console.log('');

  // ── Step 1: Create all tables ──
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Step 1: Creating tables...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const CREATE_SQL = `
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS OrderItem, ProductVariant, Product, EventRSVP, GalleryItem,
  EventTestimonial, EventGuest, EventArtist, Beneficiary, CustomPage, \`Order\`,
  FoundationRecord, TeamMember, MediaFile, AdminUser, SiteSetting,
  NewsletterSubscriber, ContactMessage, Donation, Artist, Event;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE Event (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  title VARCHAR(191) NOT NULL,
  slug VARCHAR(191) NOT NULL,
  date DATETIME(3) NOT NULL,
  time VARCHAR(191) NULL,
  venue VARCHAR(191) NOT NULL,
  city VARCHAR(191) NOT NULL,
  address VARCHAR(191) NULL,
  description TEXT NULL,
  bannerImage VARCHAR(191) NULL,
  status VARCHAR(191) NOT NULL DEFAULT 'upcoming',
  tags TEXT NULL,
  youtubeUrls TEXT NULL,
  attendanceCount INT NOT NULL DEFAULT 0,
  ticketPrice DOUBLE NULL,
  ticketCurrency VARCHAR(191) NOT NULL DEFAULT 'GHS',
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3) NOT NULL,
  UNIQUE INDEX Event_slug_key (slug)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE Artist (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  name VARCHAR(191) NOT NULL,
  location VARCHAR(191) NULL,
  bio TEXT NULL,
  image VARCHAR(191) NULL,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3) NOT NULL
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE Donation (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  name VARCHAR(191) NOT NULL,
  email VARCHAR(191) NULL,
  phone VARCHAR(191) NULL,
  address VARCHAR(191) NULL,
  amount DOUBLE NOT NULL,
  currency VARCHAR(191) NOT NULL DEFAULT 'GHS',
  paymentMethod VARCHAR(191) NOT NULL DEFAULT 'manual',
  paymentProvider VARCHAR(191) NULL,
  status VARCHAR(191) NOT NULL DEFAULT 'pending',
  reference VARCHAR(191) NULL,
  message TEXT NULL,
  donorType VARCHAR(191) NOT NULL DEFAULT 'individual',
  donationFrequency VARCHAR(191) NULL,
  organization VARCHAR(191) NULL,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE ContactMessage (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  name VARCHAR(191) NOT NULL,
  phone VARCHAR(191) NOT NULL,
  email VARCHAR(191) NULL,
  message TEXT NOT NULL,
  \`read\` BOOLEAN NOT NULL DEFAULT FALSE,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE NewsletterSubscriber (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  email VARCHAR(191) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX NewsletterSubscriber_email_key (email)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE SiteSetting (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  \`key\` VARCHAR(191) NOT NULL,
  value TEXT NOT NULL,
  UNIQUE INDEX SiteSetting_key_key (\`key\`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE AdminUser (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  username VARCHAR(191) NOT NULL,
  password VARCHAR(191) NOT NULL,
  name VARCHAR(191) NOT NULL,
  role VARCHAR(191) NOT NULL DEFAULT 'editor',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3) NOT NULL,
  UNIQUE INDEX AdminUser_username_key (username)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE MediaFile (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  filename VARCHAR(191) NOT NULL,
  url VARCHAR(191) NOT NULL,
  mimeType VARCHAR(191) NOT NULL,
  size INT NOT NULL,
  alt VARCHAR(191) NULL,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE TeamMember (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  name VARCHAR(191) NOT NULL,
  role VARCHAR(191) NOT NULL,
  photo VARCHAR(191) NULL,
  bio TEXT NULL,
  email VARCHAR(191) NULL,
  phone VARCHAR(191) NULL,
  socialLinks TEXT NULL,
  category VARCHAR(191) NOT NULL DEFAULT 'leadership',
  sortOrder INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3) NOT NULL
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE FoundationRecord (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  \`year\` INT NOT NULL,
  description TEXT NOT NULL,
  amountRaised DOUBLE NULL,
  amountSpent DOUBLE NULL,
  beneficiariesCount INT NULL,
  locations TEXT NULL,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3) NOT NULL
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE CustomPage (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  slug VARCHAR(191) NOT NULL,
  title VARCHAR(191) NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  bannerImage VARCHAR(191) NULL,
  status VARCHAR(191) NOT NULL DEFAULT 'draft',
  sortOrder INT NOT NULL DEFAULT 0,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3) NOT NULL,
  UNIQUE INDEX CustomPage_slug_key (slug)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE Beneficiary (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  name VARCHAR(191) NOT NULL,
  story TEXT NULL,
  photo VARCHAR(191) NULL,
  category VARCHAR(191) NULL,
  location VARCHAR(191) NULL,
  yearHelped INT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE \`Order\` (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  orderNumber VARCHAR(191) NOT NULL,
  customerName VARCHAR(191) NOT NULL,
  customerEmail VARCHAR(191) NULL,
  customerPhone VARCHAR(191) NOT NULL,
  deliveryAddress VARCHAR(191) NULL,
  deliveryCity VARCHAR(191) NULL,
  deliveryRegion VARCHAR(191) NULL,
  status VARCHAR(191) NOT NULL DEFAULT 'pending',
  paymentProvider VARCHAR(191) NULL,
  paymentStatus VARCHAR(191) NOT NULL DEFAULT 'pending',
  paymentRef VARCHAR(191) NULL,
  totalAmount DOUBLE NOT NULL,
  currency VARCHAR(191) NOT NULL DEFAULT 'GHS',
  trackingNumber VARCHAR(191) NULL,
  notes TEXT NULL,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3) NOT NULL,
  UNIQUE INDEX Order_orderNumber_key (orderNumber)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE EventArtist (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  eventId VARCHAR(191) NOT NULL,
  artistId VARCHAR(191) NOT NULL,
  sortOrder INT NOT NULL DEFAULT 0,
  UNIQUE INDEX EventArtist_eventId_artistId_key (eventId, artistId),
  INDEX EventArtist_artistId_idx (artistId),
  FOREIGN KEY (eventId) REFERENCES Event(id) ON DELETE CASCADE,
  FOREIGN KEY (artistId) REFERENCES Artist(id) ON DELETE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE EventGuest (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  eventId VARCHAR(191) NOT NULL,
  name VARCHAR(191) NOT NULL,
  title VARCHAR(191) NULL,
  photo VARCHAR(191) NULL,
  description VARCHAR(191) NULL,
  sortOrder INT NOT NULL DEFAULT 0,
  INDEX EventGuest_eventId_idx (eventId),
  FOREIGN KEY (eventId) REFERENCES Event(id) ON DELETE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE EventTestimonial (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  eventId VARCHAR(191) NOT NULL,
  quote TEXT NOT NULL,
  author VARCHAR(191) NOT NULL,
  photo VARCHAR(191) NULL,
  INDEX EventTestimonial_eventId_idx (eventId),
  FOREIGN KEY (eventId) REFERENCES Event(id) ON DELETE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE GalleryItem (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  title VARCHAR(191) NULL,
  description VARCHAR(191) NULL,
  type VARCHAR(191) NOT NULL DEFAULT 'image',
  url VARCHAR(191) NOT NULL,
  thumbnail VARCHAR(191) NULL,
  eventId VARCHAR(191) NULL,
  foundationRecordId VARCHAR(191) NULL,
  \`year\` INT NULL,
  category VARCHAR(191) NULL,
  sortOrder INT NOT NULL DEFAULT 0,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX GalleryItem_eventId_idx (eventId),
  INDEX GalleryItem_foundationRecordId_idx (foundationRecordId),
  FOREIGN KEY (eventId) REFERENCES Event(id) ON DELETE SET NULL,
  FOREIGN KEY (foundationRecordId) REFERENCES FoundationRecord(id) ON DELETE SET NULL
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE EventRSVP (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  eventId VARCHAR(191) NOT NULL,
  name VARCHAR(191) NOT NULL,
  email VARCHAR(191) NULL,
  phone VARCHAR(191) NULL,
  guests INT NOT NULL DEFAULT 1,
  message TEXT NULL,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX EventRSVP_eventId_idx (eventId),
  FOREIGN KEY (eventId) REFERENCES Event(id) ON DELETE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE Product (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  name VARCHAR(191) NOT NULL,
  slug VARCHAR(191) NOT NULL,
  description TEXT NULL,
  basePrice DOUBLE NOT NULL,
  currency VARCHAR(191) NOT NULL DEFAULT 'GHS',
  category VARCHAR(191) NOT NULL DEFAULT 'tshirt',
  eventId VARCHAR(191) NULL,
  primaryImage VARCHAR(191) NULL,
  isActive BOOLEAN NOT NULL DEFAULT TRUE,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3) NOT NULL,
  UNIQUE INDEX Product_slug_key (slug),
  INDEX Product_eventId_idx (eventId),
  FOREIGN KEY (eventId) REFERENCES Event(id) ON DELETE SET NULL
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE ProductVariant (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  productId VARCHAR(191) NOT NULL,
  name VARCHAR(191) NOT NULL,
  color VARCHAR(191) NOT NULL,
  colorName VARCHAR(191) NOT NULL,
  size VARCHAR(191) NOT NULL,
  price DOUBLE NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  image VARCHAR(191) NULL,
  isActive BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE INDEX ProductVariant_productId_colorName_size_key (productId, colorName, size),
  INDEX ProductVariant_productId_idx (productId),
  FOREIGN KEY (productId) REFERENCES Product(id) ON DELETE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE OrderItem (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  orderId VARCHAR(191) NOT NULL,
  productId VARCHAR(191) NULL,
  productVariantId VARCHAR(191) NULL,
  productName VARCHAR(191) NOT NULL,
  variantName VARCHAR(191) NULL,
  quantity INT NOT NULL,
  unitPrice DOUBLE NOT NULL,
  totalPrice DOUBLE NOT NULL,
  INDEX OrderItem_orderId_idx (orderId),
  INDEX OrderItem_productId_idx (productId),
  INDEX OrderItem_productVariantId_idx (productVariantId),
  FOREIGN KEY (orderId) REFERENCES \`Order\`(id) ON DELETE CASCADE,
  FOREIGN KEY (productId) REFERENCES Product(id) ON DELETE SET NULL,
  FOREIGN KEY (productVariantId) REFERENCES ProductVariant(id) ON DELETE SET NULL
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
`;

  await conn.query(CREATE_SQL);
  console.log('✅ All 21 tables created!');
  console.log('');

  // ── Step 2: Seed data ──
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Step 2: Seeding data...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const now = new Date().toISOString().replace('T', ' ').slice(0, 19) + '.000';
  const q = async (sql, params) => await conn.query(sql, params);

  // Admin
  const adminPw = await bcrypt.hash('admin123', 10);
  await q('INSERT INTO AdminUser (id, username, password, name, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [uid(), 'admin', adminPw, 'SMGH Administrator', 'admin', now, now]);
  console.log('✅ Admin user (admin / admin123)');

  // Artists
  const artistBob = uid();
  const artistDebby = uid();
  await q('INSERT INTO Artist (id, name, location, bio, image, featured, createdAt, updatedAt) VALUES (?,?,?,?,?,1,?,?)',
    [artistBob, 'Minister Bob', 'Abokobi, Ghana',
      'Minister Bobby Essuon, widely known as Minister Bob, is the founder and visionary behind Sweet Mothers Ghana. An anointed Ghanaian gospel minister and songwriter known for soul-lifting worship songs and powerful ministrations.',
      '/images/artists/minister-bob.jpg', now, now]);
  await q('INSERT INTO Artist (id, name, location, bio, image, featured, createdAt, updatedAt) VALUES (?,?,?,?,?,1,?,?)',
    [artistDebby, 'Minister Debby', 'Kumasi, Ghana',
      'Minister Debby is a gifted Ghanaian gospel artist from Kumasi with a passion for worship and a voice that captivates audiences. She has been a featured artist at multiple SMGH worship night events.',
      '/images/artists/minister-debby.jpg', now, now]);
  console.log('✅ 2 artists');

  // Team
  const team = [
    ['Robert Yaw Essuon', 'Founder', 'The visionary behind Sweet Mothers Ghana.', '/images/team/robert-essuon.jpg', '{"facebook":"https://facebook.com/sweetmothersgh","youtube":"https://www.youtube.com/@sweetmothersgh"}'],
    ['Victoria Essuon (Mrs)', 'Co-Founder', 'Victoria Essuon is the Co-Founder of Sweet Mothers Ghana.', '/images/team/victoria-essuon.jpg', null],
    ['Christian Agbotah', 'Managing Director', 'Christian Agbotah serves as the Managing Director of Sweet Mothers Ghana.', '/images/team/christian-agbotah.jpg', null],
    ['Theodora Boateng', 'Public Relations Officer', 'Theodora Boateng serves as the Public Relations Officer for Sweet Mothers Ghana.', '/images/team/victoria-essuon.jpg', null],
  ];
  for (let i = 0; i < team.length; i++) {
    await q('INSERT INTO TeamMember (id,name,role,photo,bio,email,phone,socialLinks,category,sortOrder,active,createdAt,updatedAt) VALUES (?,?,?,?,?,\'bobby@sweetmothersgh.org\',\'+233 247 612 799\',?,\'leadership\',?,1,?,?)',
      [uid(), team[i][0], team[i][1], team[i][2], team[i][3], team[i][4], i, now, now]);
  }
  console.log('✅ 4 team members');

  // Foundation
  const founds = [
    [2021, 'SMGH Foundation started full operations in 2021.', 15000, 12000, 52, '["Cape Coast","Moree","Elmina"]'],
    [2022, 'The 2022 foundation outreach expanded to cover more communities.', 25000, 22000, 85, '["Cape Coast","Winneba","Accra"]'],
    [2023, 'The 2023 foundation outreach continued to grow with increased donations.', 35000, 30000, 100, '["Cape Coast","Winneba","Accra","Tema"]'],
    [2024, 'Building on previous years, SMGH Foundation continued its annual outreach.', 50000, 45000, 130, '["Cape Coast","Winneba","Accra","Tema","Kumasi"]'],
  ];
  for (const f of founds) {
    await q('INSERT INTO FoundationRecord (id,year,description,amountRaised,amountSpent,beneficiariesCount,locations,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?,?)',
      [uid(), f[0], f[1], f[2], f[3], f[4], f[5], now, now]);
  }
  console.log('✅ 4 foundation records');

  // Events
  const events = [
    { t: 'SWEET MOTHERS GH – 2017', s: 'smgh-2017', d: '2017-05-07', tm: '16:30', v: 'The Latter Glory Outreach Church', c: 'Winneba', a: 'Winneba, Ghana', b: '/images/events/2017/banner.jpg', st: 'completed', tg: 'inaugural, mother-day, worship-night', ds: '<p>The inaugural Sweet Mothers Ghana worship night was held on Mother\'s Day, May 7, 2017, at The Latter Glory Outreach Church in Winneba.</p>', ai: [0], gal: ['/images/events/2017/banner.jpg','/images/events/2017/gallery-1.jpg','/images/events/2017/gallery-2.jpg'] },
    { t: 'SWEET MOTHERS GH – 2018', s: 'smgh-2018', d: '2018-05-06', tm: '16:30', v: 'Presbyterian Church', c: 'Gbawe', a: 'Gbawe, Ghana', b: '/images/events/2018/banner.jpg', st: 'completed', tg: 'mother-day, worship-night', ds: '<p>The second edition was held on May 6, 2018 at the Presbyterian Church in Gbawe. Minister Debby brought her anointed worship to the SMGH stage for the first time.</p>', ai: [1], gal: ['/images/events/2018/banner.jpg','/images/events/2018/gallery-1.jpg','/images/events/2018/gallery-2.jpg','/images/events/2018/gallery-3.jpg','/images/events/2018/gallery-4.jpg'] },
    { t: 'SWEET MOTHERS GH – 2019', s: 'smgh-2019', d: '2019-05-05', tm: '16:30', v: 'Global Palace International', c: 'Tema Comm 22', a: 'Tema Comm 22, Ghana', b: '/images/events/2019/banner.jpg', st: 'completed', tg: 'global-palace, mother-day', ds: '<p>The 2019 edition was held at Global Palace International in Tema with a growing attendance and powerful ministration by Minister Bob.</p>', ai: [0], gal: ['/images/events/2019/banner.jpg','/images/events/2019/gallery-1.jpg','/images/events/2019/gallery-2.jpg'] },
    { t: 'SWEET MOTHERS GH 2020', s: 'smgh-2020', d: '2020-05-03', tm: '16:30', v: 'Global Palace International', c: 'Tema Comm 22', a: 'Tema Comm 22, Ghana', b: '/images/events/2020/banner.jpg', st: 'completed', tg: 'resilience, mother-day', ds: '<p>The 2020 edition took place during challenging times. Despite global difficulties, the event went ahead demonstrating the resilience of the SMGH vision.</p>', ai: [0], gal: ['/images/events/2020/banner.jpg','/images/events/2020/gallery-1.jpg'] },
    { t: 'SWEET MOTHERS GH – 2021', s: 'smgh-2021', d: '2021-05-02', tm: '16:30', v: 'Fullness Centre - Abokobi', c: 'Abokobi - Pantang', a: 'Abokobi, Ghana', b: '/images/events/2021/banner.jpg', st: 'completed', tg: 'foundation-launch, dual-ministration', ds: '<p>The 2021 edition at Fullness Centre Abokobi featured both Minister Bob and Minister Debby. This marked the SMGH Foundation beginning full structured operations.</p>', ai: [0,1], gal: ['/images/events/2021/banner.jpg','/images/events/2021/gallery-1.jpg','/images/events/2021/gallery-2.jpg','/images/events/2021/gallery-3.jpg','/images/events/2021/gallery-4.jpg','/images/events/2021/gallery-5.jpg','/images/events/2021/gallery-6.jpg','/images/events/2021/gallery-7.jpg','/images/events/2021/gallery-8.jpg','/images/events/2021/gallery-9.jpg'] },
    { t: 'SWEET MOTHERS GH – 2022', s: 'smgh-2022', d: '2022-05-08', tm: '17:30', v: 'Peace Chapel International', c: 'Lapaz', a: 'Lapaz, Ghana', b: '/images/events/2022/banner.jpg', st: 'completed', tg: 'expanded-outreach, lapaz', ds: '<p>The 2022 edition at Peace Chapel International in Lapaz continued the tradition of powerful worship and expanded foundation outreach.</p>', ai: [0], gal: ['/images/events/2022/banner.jpg','/images/events/2022/gallery-1.jpg','/images/events/2022/gallery-2.jpg','/images/events/2022/gallery-3.jpg','/images/events/2022/gallery-4.jpg','/images/events/2022/gallery-5.jpg'] },
    { t: 'SWEET MOTHERS GH – 2023', s: 'smgh-2023', d: '2023-05-14', tm: '17:30', v: 'Church of Pentecost', c: 'Cape Coast', a: 'Cape Coast, Ghana', b: '/images/events/2023/banner.jpg', st: 'completed', tg: 'cape-coast, church-of-pentecost', ds: '<p>The 2023 edition at Church of Pentecost Cape Coast featured Minister Bob delivering a powerful ministration with deep atmosphere of worship and praise.</p>', ai: [0], gal: ['/images/events/2023/banner.jpg','/images/events/2023/gallery-1.jpg','/images/events/2023/gallery-2.jpg','/images/events/2023/gallery-3.jpg','/images/events/2023/gallery-4.jpg','/images/events/2023/gallery-5.jpg','/images/events/2023/gallery-6.jpg','/images/events/2023/gallery-7.jpg'] },
    { t: 'SWEET MOTHERS GH – 2024', s: 'smgh-2024', d: '2024-05-12', tm: '17:00', v: 'TBD', c: 'Ghana', a: null, b: '/images/events/2024/banner.jpg', st: 'completed', tg: 'anniversary, worship-night', ds: '<p>SWEET MOTHERS GH 2024 was held on May 12, 2024. Minister Bob ministered at this highly anticipated event.</p>', ai: [0], gal: ['/images/events/2024/banner.jpg'] },
    { t: 'SWEET MOTHERS GH – 2025', s: 'smgh-2025', d: '2025-05-11', tm: '17:00', v: 'TBD', c: 'Ghana', a: null, b: '/images/events/2024/banner.jpg', st: 'upcoming', tg: 'upcoming, 2025, worship-night', ds: '<p>SWEET MOTHERS GH 2025 is coming soon! Join us for another incredible night of worship, celebration, and giving. Stay tuned for announcements.</p>', ai: [0], gal: [] },
  ];

  const artistIds = [artistBob, artistDebby];

  for (const ev of events) {
    const eid = uid();
    await q('INSERT INTO Event (id,title,slug,date,time,venue,city,address,description,bannerImage,status,tags,youtubeUrls,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [eid, ev.t, ev.s, ev.d+' 00:00:00', ev.tm, ev.v, ev.c, ev.a, ev.ds, ev.b, ev.st, ev.tg, '[]', now, now]);

    for (let i = 0; i < ev.ai.length; i++) {
      await q('INSERT INTO EventArtist (id,eventId,artistId,sortOrder) VALUES (?,?,?,?)', [uid(), eid, artistIds[ev.ai[i]], i]);
    }
    for (let i = 0; i < ev.gal.length; i++) {
      await q('INSERT INTO GalleryItem (id,title,type,url,thumbnail,eventId,year,category,sortOrder,createdAt) VALUES (?,?,"image",?,?,?,?,?,?)',
        [uid(), ev.t+' - Photo '+(i+1), ev.gal[i], ev.gal[i], eid, parseInt(ev.d.slice(0,4)), 'event', i, now]);
    }
  }
  console.log('✅ 9 events with artists and gallery');

  // General gallery
  const gal = [
    ['SMGH 2023 Worship Night', '/images/events/2023/gallery-2.jpg', 2023, 'event'],
    ['SMGH 2024 Event', '/images/events/2024/banner.jpg', 2024, 'event'],
    ['Foundation Outreach', '/images/events/2021/gallery-3.jpg', 2021, 'foundation'],
    ['SMGH Team', '/images/artists/minister-bob.jpg', 2023, 'team'],
  ];
  for (const g of gal) {
    await q('INSERT INTO GalleryItem (id,title,type,url,thumbnail,year,category,sortOrder,createdAt) VALUES (?,?,"image",?,?,?,?,0,?)',
      [uid(), g[0], g[1], g[1], g[2], g[3], now]);
  }
  console.log('✅ 4 general gallery items');

  // Site Settings
  const settings = [
    ['about_content', 'Sweet Mothers Ghana (SMGH) is a faith-based organization founded in 2017 by Minister Bobby Essuon. Our mission is to honour and support mothers, especially single mothers, widows, and the less privileged in Ghana.'],
    ['visionary_message', 'The love of God has led us to show that same Love, Care and Appreciation to our dear mothers and to encourage them to keep up with the task God has entrusted into their hands. ~Minister Bobby Essuon.'],
    ['foundation_description', 'SMGH-FOUNDATION was established in the year 2017 with the mission of providing supports to less privileged widows and rural pastors\' wives through cash, food stuffs and other consumables.'],
    ['contact_phone1', '0243618186'],
    ['contact_phone2', '0247612799'],
    ['contact_email', 'bobby@sweetmothersgh.org'],
    ['contact_address', 'Ghana'],
    ['youtube_url', 'https://www.youtube.com/@sweetmothersgh'],
    ['facebook_url', 'https://web.facebook.com/sweetmothersgh'],
    ['instagram_url', 'https://instagram.com/sweetmothersgh'],
    ['whatsapp_url', 'https://wa.me/233243618186'],
    ['paystack_public_key', ''],
    ['hubtel_merchant_number', ''],
    ['hero_slider_images', JSON.stringify(['/images/events/2023/banner.jpg','/images/events/2021/banner.jpg','/images/events/2022/banner.jpg','/images/events/2019/banner.jpg','/images/events/2024/banner.jpg'])],
    ['nav_links', JSON.stringify([{label:'Home',href:'/'},{label:'Events',href:'/events'},{label:'Foundation',href:'/foundation'},{label:'Team',href:'/team'},{label:'Gallery',href:'/gallery'},{label:'Artists',href:'/artists'},{label:'Donate',href:'/donate'},{label:'Shop',href:'/shop'},{label:'Contact',href:'/contact'},{label:'Track Order',href:'/track-order'}])],
    ['footer_links', JSON.stringify([{label:'Events',href:'/events'},{label:'Foundation',href:'/foundation'},{label:'Our Team',href:'/team'},{label:'Gallery',href:'/gallery'},{label:'Artists',href:'/artists'},{label:'Donate',href:'/donate'}])],
    ['faqs', JSON.stringify([{q:'When is the next SMGH worship night?',a:'SMGH worship nights are held annually on Mother\'s Day (second Sunday in May).'},{q:'How can I volunteer?',a:'Contact us via our form or social media channels.'},{q:'How are donations used?',a:'100% of donations go directly to supporting beneficiaries.'},{q:'Can I nominate a beneficiary?',a:'Yes! Contact us with their details.'},{q:'How can I perform at SMGH?',a:'Reach out through our contact form or social media.'}])],
    ['contact_office_hours', 'Mon - Fri: 9:00 AM - 5:00 PM'],
    ['whatsapp_link', 'https://wa.link/jdnvkt'],
  ];
  for (const s of settings) {
    await q('INSERT INTO SiteSetting (id, `key`, value) VALUES (?,?,?)', [uid(), s[0], s[1]]);
  }
  console.log('✅ 19 site settings (including hero_slider_images)');

  // ── Step 3: Generate Prisma client ──
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Step 3: Regenerating Prisma client...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const { execSync } = require('child_process');
    const nodeBin = process.execPath;
    const prismaBin = path.join(__dirname, 'node_modules', 'prisma', 'build', 'index.js');
    if (fs.existsSync(prismaBin)) {
      console.log('Running: ' + nodeBin + ' ' + prismaBin + ' generate');
      execSync('"' + nodeBin + '" "' + prismaBin + '" generate', {
        cwd: __dirname, stdio: 'inherit', timeout: 120000
      });
      console.log('✅ Prisma client regenerated');
    } else {
      console.log('⚠️  Prisma binary not found, skipping. It should already be in the build.');
    }
  } catch (e) {
    console.log('⚠️  Prisma generate warning: ' + e.message?.slice(0, 200));
    console.log('   This is OK — the setup is complete.');
  }

  await conn.end();

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  🎉 DATABASE SETUP COMPLETE!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('NOW: Restart the Node.js app in cPanel:');
  console.log('  cPanel → Software → Node.js → Restart');
  console.log('');
  console.log('Then visit: https://sweetmothersgh.org');
  console.log('  • Hero slider with 5 event banners');
  console.log('  • 9 events in the events section');
  console.log('  • Admin: /admin (admin / admin123)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

}

main().catch(function(err) {
  console.error('');
  console.error('SETUP FAILED:', err.message);
  console.error('');
  if (err.code === 'ECONNREFUSED') {
    console.error('Cannot connect to MySQL. Check:');
    console.error('  1. Database host is correct in .env');
    console.error('  2. Database exists in cPanel > MySQL Databases');
    console.error('  3. User has permissions for the database');
  } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
    console.error('MySQL access denied. Check:');
    console.error('  1. Username and password in .env');
    console.error('  2. User is assigned to the database');
  } else if (err.code === 'ER_BAD_DB_ERROR') {
    console.error('Database does not exist! Create it in:');
    console.error('  cPanel > MySQL Databases > Create Database');
  }
  process.exit(1);
});
