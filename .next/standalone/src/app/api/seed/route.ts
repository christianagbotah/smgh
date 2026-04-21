import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hash } from 'bcryptjs'

export const dynamic = 'force-dynamic'

// Helper: find or create (since some models have no unique fields)
async function findOrCreateArtist(name: string, data: any) {
  const existing = await db.artist.findFirst({ where: { name } })
  if (existing) return existing
  return db.artist.create({ data })
}

async function findOrCreateTeamMember(name: string, data: any) {
  const existing = await db.teamMember.findFirst({ where: { name } })
  if (existing) return existing
  return db.teamMember.create({ data })
}

async function findOrCreateFoundationRecord(year: number, data: any) {
  const existing = await db.foundationRecord.findFirst({ where: { year } })
  if (existing) return existing
  return db.foundationRecord.create({ data })
}

async function seed() {
  // 1. Admin User (username IS unique)
  const hashedPassword = await hash('admin123', 10)
  await db.adminUser.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      name: 'SMGH Administrator',
    },
  })

  // 2. Artists
  const artist1 = await findOrCreateArtist('Minister Bob', {
    name: 'Minister Bob',
    location: 'Abokobi, Ghana',
    bio: 'Minister Bobby Essuon, widely known as Minister Bob, is the founder and visionary behind Sweet Mothers Ghana. An anointed Ghanaian gospel minister and songwriter, he is known for his soul-lifting worship songs and powerful ministrations.',
    image: '/images/artists/minister-bob.jpg',
    featured: true,
  })
  const artist2 = await findOrCreateArtist('Minister Debby', {
    name: 'Minister Debby',
    location: 'Kumasi, Ghana',
    bio: 'Minister Debby is a gifted Ghanaian gospel artist from Kumasi with a passion for worship and a voice that captivates audiences.',
    image: '/images/artists/minister-debby.jpg',
    featured: true,
  })
  const artists = [artist1, artist2]

  // 3. Team Members
  const teamData = [
    { name: 'Robert Yaw Essuon', role: 'Founder', photo: '/images/team/robert-essuon.jpg', sortOrder: 0 },
    { name: 'Victoria Essuon (Mrs)', role: 'Co-Founder', photo: '/images/team/victoria-essuon.jpg', sortOrder: 1 },
    { name: 'Christian Agbotah', role: 'Managing Director', photo: '/images/team/christian-agbotah.jpg', sortOrder: 2 },
    { name: 'Theodora Boateng', role: 'Public Relations Officer', photo: '/images/team/victoria-essuon.jpg', sortOrder: 3 },
  ]
  for (const t of teamData) {
    await findOrCreateTeamMember(t.name, {
      ...t,
      bio: `Bio for ${t.name}`,
      email: 'bobby@sweetmothersgh.org',
      phone: '+233 247 612 799',
      socialLinks: JSON.stringify({}),
      category: 'leadership',
    })
  }

  // 4. Foundation Records
  const foundationData = [
    { year: 2021, amountRaised: 15000, amountSpent: 12000, beneficiariesCount: 52, locations: ['Cape Coast', 'Moree', 'Elmina'] },
    { year: 2022, amountRaised: 25000, amountSpent: 22000, beneficiariesCount: 85, locations: ['Cape Coast', 'Winneba', 'Accra'] },
    { year: 2023, amountRaised: 35000, amountSpent: 30000, beneficiariesCount: 100, locations: ['Cape Coast', 'Winneba', 'Accra', 'Tema'] },
    { year: 2024, amountRaised: 50000, amountSpent: 45000, beneficiariesCount: 130, locations: ['Cape Coast', 'Winneba', 'Accra', 'Tema', 'Kumasi'] },
  ]
  for (const f of foundationData) {
    await findOrCreateFoundationRecord(f.year, {
      ...f,
      description: `SMGH Foundation ${f.year} outreach.`,
      locations: JSON.stringify(f.locations),
    })
  }

  // 5. Events (slug IS unique)
  const eventData = [
    { title: 'SWEET MOTHERS GH – 2017', slug: 'smgh-2017', date: '2017-05-07', venue: 'The Latter Glory Outreach Church', city: 'Winneba', banner: '/images/events/2017/banner.jpg', status: 'completed', tags: 'inaugural', artistIdx: [0] },
    { title: 'SWEET MOTHERS GH – 2018', slug: 'smgh-2018', date: '2018-05-06', venue: 'Presbyterian Church', city: 'Gbawe', banner: '/images/events/2018/banner.jpg', status: 'completed', tags: 'mother-day', artistIdx: [1] },
    { title: 'SWEET MOTHERS GH – 2019', slug: 'smgh-2019', date: '2019-05-05', venue: 'Global Palace International', city: 'Tema Comm 22', banner: '/images/events/2019/banner.jpg', status: 'completed', tags: 'global-palace', artistIdx: [0] },
    { title: 'SWEET MOTHERS GH 2020', slug: 'smgh-2020', date: '2020-05-03', venue: 'Global Palace International', city: 'Tema Comm 22', banner: '/images/events/2020/banner.jpg', status: 'completed', tags: 'resilience', artistIdx: [0] },
    { title: 'SWEET MOTHERS GH – 2021', slug: 'smgh-2021', date: '2021-05-02', venue: 'Fullness Centre - Abokobi', city: 'Abokobi - Pantang', banner: '/images/events/2021/banner.jpg', status: 'completed', tags: 'foundation-launch', artistIdx: [0, 1] },
    { title: 'SWEET MOTHERS GH – 2022', slug: 'smgh-2022', date: '2022-05-08', venue: 'Peace Chapel International', city: 'Lapaz', banner: '/images/events/2022/banner.jpg', status: 'completed', tags: 'lapaz', artistIdx: [0] },
    { title: 'SWEET MOTHERS GH – 2023', slug: 'smgh-2023', date: '2023-05-14', venue: 'Church of Pentecost', city: 'Cape Coast', banner: '/images/events/2023/banner.jpg', status: 'completed', tags: 'cape-coast', artistIdx: [0] },
    { title: 'SWEET MOTHERS GH – 2024', slug: 'smgh-2024', date: '2024-05-12', venue: 'TBD', city: 'Ghana', banner: '/images/events/2024/banner.jpg', status: 'completed', tags: 'anniversary', artistIdx: [0] },
    { title: 'SWEET MOTHERS GH – 2025', slug: 'smgh-2025', date: '2025-05-11', venue: 'TBD', city: 'Ghana', banner: '/images/events/2024/banner.jpg', status: 'upcoming', tags: 'upcoming', artistIdx: [0] },
  ]
  for (const ev of eventData) {
    await db.event.upsert({
      where: { slug: ev.slug },
      update: {},
      create: {
        title: ev.title,
        slug: ev.slug,
        date: new Date(ev.date),
        time: '17:00',
        venue: ev.venue,
        city: ev.city,
        description: `<p>${ev.title} worship night held at ${ev.venue}, ${ev.city}.</p>`,
        bannerImage: ev.banner,
        status: ev.status,
        tags: ev.tags,
        youtubeUrls: JSON.stringify([]),
        artists: {
          create: ev.artistIdx.map((ai: number, idx: number) => ({ artistId: artists[ai].id, sortOrder: idx })),
        },
        guests: { create: [] },
        testimonials: { create: [] },
        galleryItems: {
          create: [{ title: `${ev.title} Banner`, url: ev.banner, thumbnail: ev.banner, type: 'image', year: parseInt(ev.date.slice(0, 4)), category: 'event', sortOrder: 0 }],
        },
      },
    })
  }

  // 6. Gallery Items (idempotent — skip if title exists)
  const galleryData = [
    { title: 'SMGH 2023 Worship', url: '/images/events/2023/gallery-2.jpg', year: 2023, category: 'event' },
    { title: 'SMGH 2024 Event', url: '/images/events/2024/banner.jpg', year: 2024, category: 'event' },
    { title: 'Foundation Outreach', url: '/images/events/2021/gallery-3.jpg', year: 2021, category: 'foundation' },
    { title: 'SMGH Team', url: '/images/artists/minister-bob.jpg', year: 2023, category: 'team' },
  ]
  for (const g of galleryData) {
    const exists = await db.galleryItem.findFirst({ where: { title: g.title } })
    if (!exists) {
      await db.galleryItem.create({
        data: { ...g, thumbnail: g.url, type: 'image', sortOrder: 0 },
      })
    }
  }

  // 7. Site Settings (key IS unique)
  const settings = [
    { key: 'about_content', value: 'Sweet Mothers Ghana (SMGH) is a faith-based organization founded in 2017 by Minister Bobby Essuon. Our mission is to honour and support mothers, especially single mothers, widows, and the less privileged in Ghana.' },
    { key: 'visionary_message', value: '<p class="text-gray-600 leading-relaxed mb-4 text-justify">The love of God has led us to show that same Love, Care and Appreciation to our dear mothers and to encourage them to keep up with the task God has entrusted into their hands. Motherhood as you and I know, is not one of those regular responsibilities out there. Right from the inception of pregnancy to nurturing the child to become a responsible figure in the society.</p><p class="text-gray-600 leading-relaxed mb-4 text-justify">We don\'t just stop there, we also have a great passion for those of them who are finding it difficult to take care of their wards due to one reason and the other. Some are single parenting probably because they have lost their husbands, others due to broken homes etc. We see the need to assist such mothers as well so as to push harder and bring their children up properly.</p><p class="text-gray-600 leading-relaxed mb-6 text-justify">This is why we have the <strong class="text-green-700">SWEET MOTHERS FOUNDATION</strong> where we raise funds to support mothers who are in a very heart-breaking situations.</p><p class="text-gray-500 italic text-sm">We therefore welcome you to join us in fighting for these mothers and their children. Thank you. <span class="text-green-700 font-medium">~Minister Bobby Essuon.</span></p>' },
    { key: 'foundation_description', value: 'SMGH-FOUNDATION was established in the year 2017. This was birthed by Sweet Mothers GH with the mission of providing supports to less privileged widows and rural pastors\' wives. We make donations to them, in cash, food stuffs and other consumables by soliciting funds from organizations and individuals. This initiative started full operations from 2021, even though some donations were made annually to some beneficiaries on our list from 2017 to 2020.' },
    { key: 'contact_phone1', value: '0243618186' },
    { key: 'contact_phone2', value: '0247612799' },
    { key: 'contact_email', value: 'bobby@sweetmothersgh.org' },
    { key: 'contact_address', value: 'Ghana' },
    { key: 'youtube_url', value: 'https://www.youtube.com/@sweetmothersgh' },
    { key: 'facebook_url', value: 'https://web.facebook.com/sweetmothersgh' },
    { key: 'instagram_url', value: 'https://instagram.com/sweetmothersgh' },
    { key: 'whatsapp_url', value: 'https://wa.me/233243618186' },
    { key: 'hero_slider_images', value: JSON.stringify([
      '/images/events/2023/banner.jpg',
      '/images/events/2021/banner.jpg',
      '/images/events/2022/banner.jpg',
      '/images/events/2019/banner.jpg',
      '/images/events/2024/banner.jpg',
    ]) },
    { key: 'nav_links', value: JSON.stringify([
      { label: 'Home', href: '/' },
      { label: 'Events', href: '/events' },
      { label: 'Foundation', href: '/foundation' },
      { label: 'Team', href: '/team' },
      { label: 'Gallery', href: '/gallery' },
      { label: 'Artists', href: '/artists' },
      { label: 'Donate', href: '/donate' },
      { label: 'Shop', href: '/shop' },
      { label: 'Contact', href: '/contact' },
      { label: 'Track Order', href: '/track-order' },
    ]) },
    { key: 'footer_links', value: JSON.stringify([
      { label: 'Events', href: '/events' },
      { label: 'Foundation', href: '/foundation' },
      { label: 'Our Team', href: '/team' },
      { label: 'Gallery', href: '/gallery' },
      { label: 'Artists', href: '/artists' },
      { label: 'Donate', href: '/donate' },
    ]) },
    { key: 'faqs', value: JSON.stringify([
      { q: 'When is the next SMGH worship night?', a: 'SMGH worship nights are held annually on Mother\'s Day (second Sunday in May).' },
      { q: 'How can I volunteer?', a: 'Contact us via this form or reach out through our social media channels.' },
      { q: 'How are donations used?', a: '100% of donations go directly to supporting beneficiaries.' },
      { q: 'Can I nominate a beneficiary?', a: 'Yes! Contact us with their details.' },
      { q: 'How can I perform at SMGH?', a: 'Reach out through our contact form or social media.' },
    ]) },
    { key: 'contact_office_hours', value: 'Mon - Fri: 9:00 AM - 5:00 PM' },
    { key: 'whatsapp_link', value: 'https://wa.link/jdnvkt' },
  ]
  for (const s of settings) {
    await db.siteSetting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    })
  }

  return 'Seed completed successfully!'
}

export async function GET() {
  try {
    const result = await seed()
    return NextResponse.json({ success: true, message: result })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  } finally {
    await db.$disconnect()
  }
}
