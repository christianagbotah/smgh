import { db } from '../src/lib/db'
import { hash } from 'bcryptjs'

async function seed() {
  console.log('🌱 Seeding database with REAL Sweet Mothers Ghana content...')

  // 1. Admin User
  const hashedPassword = await hash('admin123', 10)
  const admin = await db.adminUser.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      name: 'SMGH Administrator',
    },
  })
  console.log(`✅ Admin user created: ${admin.username}`)

  // 2. Artists - REAL artists from WordPress site
  const artists = await Promise.all([
    db.artist.create({
      data: {
        name: 'Minister Bob',
        location: 'Abokobi, Ghana',
        bio: 'Minister Bobby Essuon, widely known as Minister Bob, is the founder and visionary behind Sweet Mothers Ghana. An anointed Ghanaian gospel minister and songwriter, he is known for his soul-lifting worship songs and powerful ministrations. His passion for worship and deep love for mothers inspired the creation of the Sweet Mothers Ghana movement in 2017. He leads Minister Bobby Ministries and has been a blessing to many through his music ministry.',
        image: '/images/artists/minister-bob.jpg',
        featured: true,
      },
    }),
    db.artist.create({
      data: {
        name: 'Minister Debby',
        location: 'Kumasi, Ghana',
        bio: 'Minister Debby is a gifted Ghanaian gospel artist from Kumasi with a passion for worship and a voice that captivates audiences. She has been a featured artist at multiple SMGH worship night events, blessing thousands with her anointed ministrations. Minister Debby first performed at SMGH in 2018 and returned for the 2021 edition, delivering powerful worship experiences.',
        image: '/images/artists/minister-debby.jpg',
        featured: true,
      },
    }),
  ])
  console.log(`✅ ${artists.length} artists created`)

  // 3. Team Members - REAL team from WordPress site
  const teamMembers = await Promise.all([
    db.teamMember.create({
      data: {
        name: 'Robert Yaw Essuon',
        role: 'Founder',
        bio: 'The visionary behind Sweet Mothers Ghana. The love of God has led him to show that same Love, Care and Appreciation to our dear mothers and to encourage them to keep up with the task God has entrusted into their hands. Motherhood as you and I know, is not one of those regular responsibilities out there. Right from the inception of pregnancy to nurturing the child to become a responsible figure in the society. We don\'t just stop there, we also have a great passion for those of them who are finding it difficult to take care of their wards due to one reason and the other. Some are single parenting probably because they have lost their husbands, others due to broken homes etc.',
        photo: '/images/team/robert-essuon.jpg',
        email: 'bobby@sweetmothersgh.org',
        phone: '+233 247 612 799',
        socialLinks: JSON.stringify({ facebook: 'https://facebook.com/sweetmothersgh', youtube: 'https://www.youtube.com/@sweetmothersgh' }),
        category: 'leadership',
        sortOrder: 0,
      },
    }),
    db.teamMember.create({
      data: {
        name: 'Victoria Essuon (Mrs)',
        role: 'Co-Founder',
        bio: 'Victoria Essuon is the Co-Founder of Sweet Mothers Ghana. She works alongside her husband Robert to bring the vision of SMGH to life, providing leadership and support to the organization\'s programs and foundation activities.',
        photo: '/images/team/victoria-essuon.jpg',
        email: 'bobby@sweetmothersgh.org',
        phone: '+233 247 612 799',
        category: 'leadership',
        sortOrder: 1,
      },
    }),
    db.teamMember.create({
      data: {
        name: 'Christian Agbotah',
        role: 'Managing Director',
        bio: 'Christian Agbotah serves as the Managing Director of Sweet Mothers Ghana, overseeing the organization\'s operations, strategic planning, and program execution. He ensures that every SMGH event and foundation outreach is executed to the highest standard.',
        photo: '/images/team/christian-agbotah.jpg',
        email: 'bobby@sweetmothersgh.org',
        phone: '+233 247 612 799',
        category: 'leadership',
        sortOrder: 2,
      },
    }),
    db.teamMember.create({
      data: {
        name: 'Theodora Boateng',
        role: 'Public Relations Officer',
        bio: 'Theodora Boateng serves as the Public Relations Officer for Sweet Mothers Ghana. She handles media relations, communications, and public engagement for the organization.',
        photo: '/images/team/victoria-essuon.jpg',
        email: 'bobby@sweetmothersgh.org',
        phone: '+233 247 612 799',
        category: 'leadership',
        sortOrder: 3,
      },
    }),
  ])
  console.log(`✅ ${teamMembers.length} team members created`)

  // 4. Foundation Records
  const foundationRecords = await Promise.all([
    db.foundationRecord.create({
      data: {
        year: 2021,
        description: 'SMGH Foundation started full operations in 2021. Donations were made in cash, food stuffs and other consumables to less privileged widows and rural pastors\' wives across the Cape Coast metropolis. This marked the beginning of our structured foundation outreach, building on the ad-hoc donations that had been made since 2017.',
        amountRaised: 15000,
        amountSpent: 12000,
        beneficiariesCount: 52,
        locations: JSON.stringify(['Cape Coast', 'Moree', 'Elmina']),
      },
    }),
    db.foundationRecord.create({
      data: {
        year: 2022,
        description: 'The 2022 foundation outreach expanded to cover more communities. Donations in cash, food stuffs and other consumables were distributed to less privileged widows and rural pastors\' wives. School supplies were provided to children of single mothers.',
        amountRaised: 25000,
        amountSpent: 22000,
        beneficiariesCount: 85,
        locations: JSON.stringify(['Cape Coast', 'Winneba', 'Accra']),
      },
    }),
    db.foundationRecord.create({
      data: {
        year: 2023,
        description: 'The 2023 foundation outreach continued to grow, with increased donations and a wider reach of beneficiaries. The foundation provided food items, clothing, and cash support to widows, single mothers, and rural pastors\' wives across multiple communities.',
        amountRaised: 35000,
        amountSpent: 30000,
        beneficiariesCount: 100,
        locations: JSON.stringify(['Cape Coast', 'Winneba', 'Accra', 'Tema']),
      },
    }),
    db.foundationRecord.create({
      data: {
        year: 2024,
        description: 'Building on previous years, SMGH Foundation continued its annual outreach program, providing essential support to mothers in need. The foundation solicited funds from organizations and individuals to support less privileged widows and rural pastors\' wives.',
        amountRaised: 50000,
        amountSpent: 45000,
        beneficiariesCount: 130,
        locations: JSON.stringify(['Cape Coast', 'Winneba', 'Accra', 'Tema', 'Kumasi']),
      },
    }),
  ])
  console.log(`✅ ${foundationRecords.length} foundation records created`)

  // 5. Events with REAL data from WordPress site
  const eventData = [
    {
      title: 'SWEET MOTHERS GH – 2017',
      slug: 'smgh-2017',
      date: new Date('2017-05-07'),
      time: '16:30',
      venue: 'The Latter Glory Outreach Church',
      city: 'Winneba',
      address: 'The Latter Glory Outreach Church, Winneba, Ghana',
      description: '<p>The inaugural Sweet Mothers Ghana worship night was held on Mother\'s Day, May 7, 2017, at The Latter Glory Outreach Church in Winneba. This historic event marked the birth of a movement to honour and support mothers in Ghana.</p><p>The vision was birthed by Minister Bobby Essuon, who felt a strong calling to create a platform that celebrates mothers while also supporting those in need. The event featured heartfelt worship by Minister Bob and a special time of prayer and appreciation for all mothers.</p><p>Though the SMGH Foundation would not begin full operations until 2021, some donations were made to beneficiaries from this very first edition, laying the foundation for what was to come.</p>',
      bannerImage: '/images/events/2017/banner.jpg',
      status: 'completed',
      tags: 'inaugural, mother-day, worship-night',
      youtubeUrls: JSON.stringify([]),
      artistIndices: [0], // Minister Bob
      guests: [],
      testimonials: [
        { quote: 'The first Sweet Mothers Ghana was an unforgettable experience. I felt truly honoured as a mother.', author: 'Attendee', photo: null },
      ],
      galleryImages: [
        '/images/events/2017/banner.jpg',
        '/images/events/2017/gallery-1.jpg',
        '/images/events/2017/gallery-2.jpg',
      ],
    },
    {
      title: 'SWEET MOTHERS GH – 2018',
      slug: 'smgh-2018',
      date: new Date('2018-05-06'),
      time: '16:30',
      venue: 'Presbyterian Church',
      city: 'Gbawe',
      address: 'Presbyterian Church, Gbawe, Ghana',
      description: '<p>The second edition of Sweet Mothers Ghana was held on May 6, 2018 at the Presbyterian Church in Gbawe. The event continued to grow, with Minister Debby bringing her anointed worship to the SMGH stage for the first time.</p><p>Attendees gathered for a powerful night of worship, prayer, and celebration of motherhood. The event honoured outstanding mothers in the community and continued the tradition of annual donations to beneficiaries.</p>',
      bannerImage: '/images/events/2018/banner.jpg',
      status: 'completed',
      tags: 'mother-day, worship-night',
      youtubeUrls: JSON.stringify([]),
      artistIndices: [1], // Minister Debby
      guests: [],
      testimonials: [
        { quote: 'Year after year, Sweet Mothers GH keeps getting better. God is truly behind this vision.', author: 'Pastor Isaac', photo: null },
      ],
      galleryImages: [
        '/images/events/2018/banner.jpg',
        '/images/events/2018/gallery-1.jpg',
        '/images/events/2018/gallery-2.jpg',
        '/images/events/2018/gallery-3.jpg',
        '/images/events/2018/gallery-4.jpg',
      ],
    },
    {
      title: 'SWEET MOTHERS GH – 2019',
      slug: 'smgh-2019',
      date: new Date('2019-05-05'),
      time: '16:30',
      venue: 'Global Palace International',
      city: 'Tema Comm 22',
      address: 'Global Palace International, Tema Comm 22, Ghana',
      description: '<p>The 2019 edition was held at Global Palace International in Tema on May 5, 2019. With a growing attendance, the event featured Minister Bob returning to the SMGH stage for another powerful ministration.</p><p>The venue provided a larger space to accommodate the increasing number of worshippers. The event continued to build on the foundation of previous years, celebrating mothers and reaching out to those in need through the foundation.</p>',
      bannerImage: '/images/events/2019/banner.jpg',
      status: 'completed',
      tags: 'global-palace, mother-day',
      youtubeUrls: JSON.stringify([]),
      artistIndices: [0], // Minister Bob
      guests: [],
      testimonials: [
        { quote: 'The atmosphere at Global Palace was amazing. God showed up powerfully!', author: 'Attendee', photo: null },
      ],
      galleryImages: [
        '/images/events/2019/banner.jpg',
        '/images/events/2019/gallery-1.jpg',
        '/images/events/2019/gallery-2.jpg',
      ],
    },
    {
      title: 'SWEET MOTHERS GH 2020',
      slug: 'smgh-2020',
      date: new Date('2020-05-03'),
      time: '16:30',
      venue: 'Global Palace International',
      city: 'Tema Comm 22',
      address: 'Global Palace International, Tema Comm 22, Ghana',
      description: '<p>The 2020 edition was held on May 3, 2020 at Global Palace International in Tema. Minister Bob ministered at this event, which took place during challenging times. Despite global difficulties, the event went ahead with the necessary precautions, demonstrating the resilience of the SMGH vision.</p><p>The foundation continued its annual tradition of supporting beneficiaries, even as the world faced unprecedented challenges.</p>',
      bannerImage: '/images/events/2020/banner.jpg',
      status: 'completed',
      tags: 'resilience, mother-day',
      youtubeUrls: JSON.stringify([]),
      artistIndices: [0], // Minister Bob
      guests: [],
      testimonials: [
        { quote: 'Even in difficult times, SMGH remained committed to honouring mothers. Truly inspiring.', author: 'Attendee', photo: null },
      ],
      galleryImages: [
        '/images/events/2020/banner.jpg',
        '/images/events/2020/gallery-1.jpg',
      ],
    },
    {
      title: 'SWEET MOTHERS GH – 2021',
      slug: 'smgh-2021',
      date: new Date('2021-05-02'),
      time: '16:30',
      venue: 'Fullness Centre - Abokobi',
      city: 'Abokobi - Pantang',
      address: 'Fullness Centre - Abokobi, Abokobi - Pantang, Ghana',
      description: '<p>The 2021 edition was held on May 2, 2021 at the Fullness Centre in Abokobi. This year was particularly special as both Minister Bob and Minister Debby ministered together on the same stage, creating an unforgettable worship experience.</p><p>This edition also marked a significant milestone as the SMGH Foundation began full structured operations. Donations in cash, food stuffs and other consumables were distributed to less privileged widows and rural pastors\' wives, fulfilling the vision that was birthed in 2017.</p>',
      bannerImage: '/images/events/2021/banner.jpg',
      status: 'completed',
      tags: 'foundation-launch, dual-ministration',
      youtubeUrls: JSON.stringify([]),
      artistIndices: [0, 1], // Minister Bob + Minister Debby
      guests: [],
      testimonials: [
        { quote: 'Having both Minister Bob and Minister Debby on the same stage was incredible. The worship was heavenly!', author: 'Grace', photo: null },
        { quote: 'The foundation work this year was truly impactful. So many mothers were blessed.', author: 'Donor', photo: null },
      ],
      galleryImages: [
        '/images/events/2021/banner.jpg',
        '/images/events/2021/gallery-1.jpg',
        '/images/events/2021/gallery-2.jpg',
        '/images/events/2021/gallery-3.jpg',
        '/images/events/2021/gallery-4.jpg',
        '/images/events/2021/gallery-5.jpg',
        '/images/events/2021/gallery-6.jpg',
        '/images/events/2021/gallery-7.jpg',
        '/images/events/2021/gallery-8.jpg',
        '/images/events/2021/gallery-9.jpg',
      ],
    },
    {
      title: 'SWEET MOTHERS GH – 2022',
      slug: 'smgh-2022',
      date: new Date('2022-05-08'),
      time: '17:30',
      venue: 'Peace Chapel International',
      city: 'Lapaz',
      address: 'Peace Chapel International - Lapaz, Nyamekye Junction, Lapaz, Ghana',
      description: '<p>The 2022 edition was held on May 8, 2022 at Peace Chapel International in Lapaz. The event moved to a new venue to accommodate the growing audience and continued the tradition of powerful worship and celebration of motherhood.</p><p>The foundation outreach expanded its reach, distributing food items, clothing, and cash donations to widows, single mothers, and rural pastors\' wives across multiple communities. The event was well attended and widely celebrated.</p>',
      bannerImage: '/images/events/2022/banner.jpg',
      status: 'completed',
      tags: 'expanded-outreach, lapaz',
      youtubeUrls: JSON.stringify([]),
      artistIndices: [0], // Minister Bob
      guests: [],
      testimonials: [
        { quote: 'SMGH 2022 at Peace Chapel was a blessed experience. The worship was powerful!', author: 'David', photo: null },
      ],
      galleryImages: [
        '/images/events/2022/banner.jpg',
        '/images/events/2022/gallery-1.jpg',
        '/images/events/2022/gallery-2.jpg',
        '/images/events/2022/gallery-3.jpg',
        '/images/events/2022/gallery-4.jpg',
        '/images/events/2022/gallery-5.jpg',
      ],
    },
    {
      title: 'SWEET MOTHERS GH – 2023',
      slug: 'smgh-2023',
      date: new Date('2023-05-14'),
      time: '17:30',
      venue: 'Church of Pentecost',
      city: 'Cape Coast',
      address: 'JW Sackie, Oguaa Abura District, Cape Coast, Ghana',
      description: '<p>The 2023 edition was held on May 14, 2023 at the Church of Pentecost, JW Sackie, Oguaa Abura District in Cape Coast. Minister Bob delivered a powerful ministration starting at 19:30, bringing the audience into a deep atmosphere of worship and praise.</p><p>This event was widely promoted with a dedicated Facebook event page and drew attendees from across the Central Region and beyond. The foundation outreach continued to expand, supporting beneficiaries across multiple communities with essential items and cash donations.</p>',
      bannerImage: '/images/events/2023/banner.jpg',
      status: 'completed',
      tags: 'cape-coast, church-of-pentecost',
      youtubeUrls: JSON.stringify([]),
      artistIndices: [0], // Minister Bob
      guests: [],
      testimonials: [
        { quote: 'The atmosphere of worship at SMGH 2023 was something I have never experienced before. God showed up mightily!', author: 'Esther', photo: null },
      ],
      galleryImages: [
        '/images/events/2023/banner.jpg',
        '/images/events/2023/gallery-1.jpg',
        '/images/events/2023/gallery-2.jpg',
        '/images/events/2023/gallery-3.jpg',
        '/images/events/2023/gallery-4.jpg',
        '/images/events/2023/gallery-5.jpg',
        '/images/events/2023/gallery-6.jpg',
        '/images/events/2023/gallery-7.jpg',
      ],
    },
    {
      title: 'SWEET MOTHERS GH – 2024',
      slug: 'smgh-2024',
      date: new Date('2024-05-12'),
      time: '17:00',
      venue: 'TBD',
      city: 'Ghana',
      address: null,
      description: '<p>SWEET MOTHERS GH 2024 was held on May 12, 2024. Minister Bob ministered at this highly anticipated event, bringing another edition of powerful worship and celebration of motherhood.</p><p>The SMGH Foundation continued its annual outreach, providing support to mothers in need. The event attracted attendees from across Ghana, continuing the legacy of honouring and supporting mothers that began in 2017.</p>',
      bannerImage: '/images/events/2024/banner.jpg',
      status: 'completed',
      tags: 'anniversary, worship-night',
      youtubeUrls: JSON.stringify([]),
      artistIndices: [0], // Minister Bob
      guests: [],
      testimonials: [
        { quote: 'SMGH 2024 was truly special. The organization and worship were exceptional!', author: 'Kwabena', photo: null },
      ],
      galleryImages: [
        '/images/events/2024/banner.jpg',
      ],
    },
    {
      title: 'SWEET MOTHERS GH – 2025',
      slug: 'smgh-2025',
      date: new Date('2025-05-11'),
      time: '17:00',
      venue: 'TBD',
      city: 'Ghana',
      address: null,
      description: '<p>SWEET MOTHERS GH 2025 is coming soon! Join us for another incredible night of worship, celebration, and giving. We continue to honour and support mothers, especially single mothers, widows, and the less privileged.</p><p>Stay tuned for venue and artist announcements. Don\'t miss out on this very one!</p>',
      bannerImage: '/images/events/2024/banner.jpg',
      status: 'upcoming',
      tags: 'upcoming, 2025, worship-night',
      youtubeUrls: JSON.stringify([]),
      artistIndices: [0],
      guests: [],
      testimonials: [],
      galleryImages: [],
    },
  ]

  for (const ev of eventData) {
    const event = await db.event.upsert({
      where: { slug: ev.slug },
      update: {},
      create: {
        title: ev.title,
        slug: ev.slug,
        date: ev.date,
        time: ev.time,
        venue: ev.venue,
        city: ev.city,
        address: ev.address,
        description: ev.description,
        bannerImage: ev.bannerImage,
        status: ev.status,
        tags: ev.tags,
        youtubeUrls: ev.youtubeUrls,
        artists: {
          create: ev.artistIndices.map((ai, idx) => ({
            artistId: artists[ai].id,
            sortOrder: idx,
          })),
        },
        guests: {
          create: ev.guests.map((g, idx) => ({
            name: g.name,
            title: g.title,
            photo: g.photo,
            description: g.description,
            sortOrder: idx,
          })),
        },
        testimonials: {
          create: ev.testimonials.map(t => ({
            quote: t.quote,
            author: t.author,
            photo: t.photo,
          })),
        },
        galleryItems: {
          create: ev.galleryImages.map((url, idx) => ({
            title: `${ev.title} - Photo ${idx + 1}`,
            url: url,
            thumbnail: url,
            type: 'image',
            year: ev.date.getFullYear(),
            category: 'event',
            sortOrder: idx,
          })),
        },
      },
    })
    console.log(`✅ Event created: ${event.title}`)
  }

  // 7. General Gallery Items using real photos
  const generalGallery = [
    { title: 'SMGH 2023 Worship Night', url: '/images/events/2023/gallery-2.jpg', year: 2023, category: 'event' },
    { title: 'SMGH 2024 Event', url: '/images/events/2024/banner.jpg', year: 2024, category: 'event' },
    { title: 'Foundation Outreach', url: '/images/events/2021/gallery-3.jpg', year: 2021, category: 'foundation' },
    { title: 'SMGH Team', url: '/images/artists/minister-bob.jpg', year: 2023, category: 'team' },
  ]

  for (const item of generalGallery) {
    await db.galleryItem.create({
      data: {
        title: item.title,
        url: item.url,
        thumbnail: item.url,
        type: 'image',
        year: item.year,
        category: item.category,
        sortOrder: 0,
      },
    })
  }
  console.log(`✅ ${generalGallery.length} general gallery items created`)

  // 8. Site Settings with REAL contact info from WordPress
  const settings = [
    { key: 'about_content', value: 'Sweet Mothers Ghana (SMGH) is a faith-based organization founded in 2017 by Minister Bobby Essuon. We warmly welcome you to the Sweet Mothers GH website. Our mission is to honour and support mothers, especially single mothers, widows, and the less privileged in Ghana.' },
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
    { key: 'paystack_public_key', value: '' },
    { key: 'hubtel_merchant_number', value: '' },
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
      { q: 'When is the next SMGH worship night?', a: 'SMGH worship nights are held annually on Mother\'s Day (second Sunday in May). Follow our social media for specific dates and announcements.' },
      { q: 'How can I volunteer?', a: 'We always need volunteers for our events and outreach programs. Contact us via this form or reach out through our social media channels.' },
      { q: 'How are donations used?', a: '100% of donations go directly to supporting beneficiaries. We provide food, clothing, education, skill training, and micro-loans to widows, single mothers, and the less privileged.' },
      { q: 'Can I nominate a beneficiary?', a: 'Yes! If you know a widow, single mother, or less privileged person who needs support, please contact us with their details.' },
      { q: 'How can I perform at SMGH?', a: 'Gospel artists interested in performing at SMGH events can reach out through our contact form or social media.' },
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
  console.log(`✅ ${settings.length} site settings created`)

  console.log('\n🎉 Seed completed successfully with REAL content from WordPress!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('Admin credentials: admin / admin123')
  console.log('Real images in: /images/events/YYYY/, /images/team/, /images/artists/')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

seed()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
