/* The house's standing pages, in one place. Plain data only — no React, no
   imports.

   These are the targets the footer and half the CTAs already pointed at before
   anything answered them: the bidding guide, the escrow rules, the quarantine
   standard, the legal row. Every one is prose the house writes once and changes
   rarely, so they are a constant and one route rather than twelve route files
   and twelve sections.

   ponytail: copy lives here, not in a CMS. A marketing team that wants to edit
   it without a deploy needs these rows behind an API — the route already reads
   them through one lookup, so that swap is this file plus `InfoPage`. */

/** One block of a standing page: a heading over its paragraphs. */
export type InfoSection = {
  heading: string
  /** Paragraphs, in order. Plain text — these are rendered as `<p>`, never as
      HTML, so copy here cannot carry markup. */
  body: string[]
}

/** One standing page, as the route draws it. */
export type InfoDoc = {
  /** The small caps label above the heading. */
  eyebrow: string
  /** The page's own `h1`, and its `<title>`. */
  title: string
  /** The sentence under the heading, and the page's meta description. */
  lede: string
  sections: InfoSection[]
}

/**
 * Every standing page, keyed by its own URL segment.
 *
 * The key is the path: `/panduan` is `INFO_DOCS.panduan`. A segment that is not
 * a key is a 404, which is what keeps the catch-all route from answering for
 * every typo on the site.
 */
export const INFO_DOCS: Record<string, InfoDoc> = {
  panduan: {
    eyebrow: "Panduan",
    title: "Panduan Bidding Pemula",
    lede: "Dari daftar akun sampai ikan sampai di kolam, dalam enam langkah.",
    sections: [
      {
        heading: "1. Daftar dan lengkapi data",
        body: [
          "Buat akun dengan email aktif, lalu lengkapi nama, nomor telepon, dan alamat pengiriman di halaman akun. Alamat wajib lengkap sampai kecamatan karena ekspedisi ikan hidup menghitung ongkos per zona, bukan per kota.",
          "Satu akun satu identitas. Akun ganda pada satu lot kami anggap pengaturan harga dan keduanya dibatalkan."
        ]
      },
      {
        heading: "2. Pelajari lot sebelum lelang dibuka",
        body: [
          "Setiap lot punya halaman dossier: foto dari lima sudut, video walk-round bila tersedia, silsilah indukan, ukuran saat difoto, dan catatan breeder. Baca ukuran dan tanggal foto — koi tumbuh, dan angka di halaman adalah angka saat pengukuran, bukan saat pengiriman.",
          "Pertanyaan teknis soal lot ditujukan ke breeder lewat halaman mitra masing-masing, bukan di ruang lelang saat sesi berjalan."
        ]
      },
      {
        heading: "3. Ikut sesi lelang",
        body: [
          "Sesi dibuka sesuai jadwal di halaman lelang. Masuk ke ruang siaran, dan tawaran Anda tercatat dengan waktu server — bukan waktu perangkat Anda. Selisih satu detik di layar bisa berarti tawaran Anda masuk setelah ketukan.",
          "Kenaikan tawaran mengikuti kelipatan yang tertera pada tiap lot. Tawaran di bawah kelipatan ditolak sistem, bukan ditawar ulang."
        ]
      },
      {
        heading: "4. Menang lot",
        body: [
          "Pemenang mendapat notifikasi dan tagihan di halaman pesanan. Pembayaran dilakukan ke rekening bersama yang dikelola rumah lelang, bukan langsung ke breeder — lihat Mekanisme Rekening Bersama.",
          "Lot yang sudah dimenangkan tidak bisa dibatalkan sendiri dari keranjang. Pengajuan pembatalan ditujukan ke admin dan dinilai kasus per kasus."
        ]
      },
      {
        heading: "5. Karantina dan pengiriman",
        body: [
          "Setelah pembayaran lunas, ikan masuk karantina sesuai standar BBKP sebelum diberangkatkan. Masa karantina menunda pengiriman, dan itu memang tujuannya: ikan yang dikirim tanpa puasa transit sampai dalam kondisi jauh lebih buruk.",
          "Jadwal keberangkatan dipilih di halaman pengiriman bersama metode ekspedisi."
        ]
      },
      {
        heading: "6. Terima dan klaim bila perlu",
        body: [
          "Rekam proses pembukaan kemasan tanpa dipotong, dari kardus tersegel sampai ikan masuk wadah. Rekaman itu satu-satunya bukti yang berlaku untuk klaim Garansi Ikan Hidup."
        ]
      }
    ]
  },

  rekber: {
    eyebrow: "Kepatuhan",
    title: "Mekanisme Rekening Bersama",
    lede: "Uang pembeli ditahan rumah lelang sampai ikan diterima hidup.",
    sections: [
      {
        heading: "Kenapa tidak bayar langsung ke breeder",
        body: [
          "Transaksi koi bernilai tinggi dengan barang hidup yang dikirim lintas pulau. Bila uang berpindah lebih dulu, risiko sepenuhnya di pembeli; bila ikan berpindah lebih dulu, risiko sepenuhnya di breeder. Rekening bersama memindahkan keduanya ke rumah lelang."
        ]
      },
      {
        heading: "Alur dana",
        body: [
          "Pembeli membayar ke rekening yang terdaftar atas nama rumah lelang. Dana dicatat sebagai tertahan, bukan sebagai pendapatan breeder. Breeder melihat status pesanan berubah menjadi lunas dan boleh memulai karantina, tetapi belum menerima uangnya.",
          "Dana diteruskan ke breeder setelah pembeli mengonfirmasi penerimaan, atau otomatis setelah 2x24 jam sejak paket tercatat diterima tanpa klaim masuk."
        ]
      },
      {
        heading: "Bila ada klaim",
        body: [
          "Klaim yang masuk sebelum dana diteruskan akan menahan pencairan sampai penilaian selesai. Pengembalian dana penuh atau sebagian dibayar dari dana yang masih tertahan, sehingga pembeli tidak menunggu itikad baik pihak mana pun.",
          "Biaya layanan rumah lelang dipotong dari transaksi yang selesai, dan tidak dipotong dari dana yang dikembalikan."
        ]
      },
      {
        heading: "Di luar mekanisme ini",
        body: [
          "Pembayaran langsung ke rekening pribadi breeder di luar platform tidak dilindungi, tidak bisa diklaim, dan merupakan pelanggaran ketentuan bagi breeder yang memintanya."
        ]
      }
    ]
  },

  pembayaran: {
    eyebrow: "Kepatuhan",
    title: "Mekanisme Pembayaran",
    lede: "Cara menyelesaikan tagihan, dan batas waktunya.",
    sections: [
      {
        heading: "Batas waktu",
        body: [
          "Tagihan lot yang dimenangkan berlaku 2x24 jam sejak sesi ditutup. Lewat batas itu lot dilepas kembali dan akun dicatat gagal bayar; tiga catatan gagal bayar menutup akses bidding.",
          "Pembelian katalog harga tetap dan perlengkapan tidak menahan stok sampai dibayar."
        ]
      },
      {
        heading: "Metode",
        body: [
          "Transfer bank ke rekening bersama rumah lelang adalah metode utama untuk lot lelang, karena jumlahnya besar dan harus bisa ditahan. Rincian rekening muncul pada halaman tagihan masing-masing pesanan.",
          "Nominal transfer harus sama persis sampai digit terakhir, termasuk kode unik bila ada. Nominal berbeda tidak terbaca otomatis dan harus dicocokkan manual oleh admin."
        ]
      },
      {
        heading: "Yang tidak diterima",
        body: [
          "Pembayaran bertahap, pembayaran oleh pihak ketiga yang namanya berbeda dari pemilik akun, dan pembayaran di luar kanal resmi tidak diproses."
        ]
      }
    ]
  },

  karantina: {
    eyebrow: "Kepatuhan",
    title: "Standar Karantina BBKP RI",
    lede: "Apa yang terjadi pada ikan antara lunas dan berangkat.",
    sections: [
      {
        heading: "Masa karantina",
        body: [
          "Ikan yang akan dikirim lintas provinsi menjalani karantina di fasilitas breeder dengan parameter air tercatat harian. Masa minimum tujuh hari untuk pengiriman domestik, lebih panjang bila hasil pemeriksaan menuntutnya."
        ]
      },
      {
        heading: "Puasa transit",
        body: [
          "Ikan dipuasakan 24 sampai 48 jam sebelum pengemasan, sesuai ukuran. Ikan yang dikirim dengan perut terisi mengotori air kantong, kadar amonia naik, dan perjalanan panjang berubah menjadi keracunan."
        ]
      },
      {
        heading: "Dokumen",
        body: [
          "Pengiriman antar pulau menyertakan sertifikat kesehatan ikan dari Balai Besar Karantina Ikan setempat. Nomor dokumen tercantum pada rincian pesanan dan ikut di dalam kemasan.",
          "Pembeli yang membutuhkan dokumen untuk keperluan kontes atau ekspor lanjutan sebaiknya menyebutkannya sebelum pengiriman dijadwalkan, karena beberapa dokumen tidak bisa diterbitkan setelah ikan berangkat."
        ]
      }
    ]
  },

  garansi: {
    eyebrow: "Kepatuhan",
    title: "Garansi Ikan Hidup (D.O.A)",
    lede: "Ikan mati dalam perjalanan diganti nilainya — dengan syarat bukti.",
    sections: [
      {
        heading: "Cakupan",
        body: [
          "Garansi berlaku untuk kematian yang terjadi dalam masa pengiriman, dihitung dari kemasan disegel di fasilitas breeder sampai paket diterima di alamat tujuan.",
          "Garansi tidak mencakup kematian setelah ikan masuk kolam atau wadah pembeli, termasuk kematian akibat aklimatisasi yang terlalu cepat, parameter air tujuan yang tidak cocok, atau penyakit yang muncul kemudian."
        ]
      },
      {
        heading: "Syarat bukti",
        body: [
          "Rekaman video tanpa jeda dan tanpa potongan, dimulai saat kardus masih tersegel dengan label pengiriman terbaca, berlanjut sampai kantong dibuka dan ikan terlihat. Rekaman yang dimulai setelah kardus terbuka tidak dapat diterima — tidak ada cara membedakan ikan yang sampai mati dari ikan yang mati sesudahnya.",
          "Klaim diajukan maksimum 3 jam sejak paket tercatat diterima oleh ekspedisi."
        ]
      },
      {
        heading: "Bentuk penggantian",
        body: [
          "Penggantian dibayarkan sebagai pengembalian dana sebesar nilai lot, dipotong biaya ekspedisi yang sudah terpakai. Ikan pengganti tidak dijanjikan karena setiap lot adalah individu, bukan stok yang bisa diambil lagi dari rak."
        ]
      }
    ]
  },

  sertifikat: {
    eyebrow: "Kepatuhan",
    title: "Cek Sertifikat Breeder",
    lede: "Apa arti label terverifikasi di halaman mitra.",
    sections: [
      {
        heading: "Yang diperiksa",
        body: [
          "Sebelum sebuah farm boleh menjual di sini, kami memeriksa tiga hal: parameter air pada kolam pembesaran, prosedur biosecurity dan fasilitas karantinanya, serta akurasi catatan silsilah indukan terhadap ikan yang dijual.",
          "Pemeriksaan dilakukan di lokasi, bukan lewat berkas. Farm yang menolak kunjungan tidak diverifikasi."
        ]
      },
      {
        heading: "Masa berlaku dan peninjauan",
        body: [
          "Verifikasi berlaku dua belas bulan dan ditinjau ulang lebih cepat bila ada klaim berulang terhadap satu farm. Label pada halaman mitra mencerminkan status saat ini, bukan status saat pertama kali bergabung.",
          "Farm yang dicabut verifikasinya kehilangan akses penjualan, dan lot yang sedang berjalan tetap diselesaikan di bawah rekening bersama."
        ]
      },
      {
        heading: "Memeriksa sendiri",
        body: [
          "Setiap halaman mitra menampilkan status verifikasi, spesialisasi varietas, dan sejak kapan farm tersebut terdaftar. Bila sebuah farm mengaku terverifikasi tetapi halamannya tidak menyatakannya, yang berlaku adalah halamannya."
        ]
      }
    ]
  },

  bantuan: {
    eyebrow: "Bantuan",
    title: "Pusat Bantuan",
    lede: "Pertanyaan yang paling sering masuk, dengan jawabannya.",
    sections: [
      {
        heading: "Tawaran saya tidak masuk",
        body: [
          "Dua sebab paling umum: nominal di bawah kelipatan kenaikan lot tersebut, atau sesi sudah ditutup di sisi server meski layar Anda belum menyegarkan. Waktu yang berlaku adalah waktu server."
        ]
      },
      {
        heading: "Kenapa pesanan saya belum dikirim",
        body: [
          "Pesanan lunas tidak langsung berangkat. Ikan menjalani karantina dan puasa transit lebih dulu — lihat Standar Karantina. Status pada halaman pesanan menunjukkan tahap yang sedang berjalan."
        ]
      },
      {
        heading: "Satu produk dijual beberapa penjual, harganya berbeda",
        body: [
          "Itu normal. Harga, stok, dan ongkos ditentukan masing-masing penjual. Tombol beli pada halaman produk memakai penawaran terbaik saat itu, dan daftar penawaran lain ada di bawahnya."
        ]
      },
      {
        heading: "Saya ingin membatalkan lot yang sudah dimenangkan",
        body: [
          "Lot yang dimenangkan adalah transaksi yang sudah terjadi dan tidak bisa dihapus dari keranjang. Ajukan pembatalan ke admin; penilaian mempertimbangkan apakah ikan sudah masuk karantina atau sudah berangkat."
        ]
      },
      {
        heading: "Pertanyaan yang tidak ada di sini",
        body: [
          "Hubungi admin lewat kanal pada halaman Hubungi Admin, sertakan nomor pesanan bila pertanyaannya menyangkut satu transaksi."
        ]
      }
    ]
  },

  kontak: {
    eyebrow: "Bantuan",
    title: "Hubungi Admin",
    lede: "Satu kanal untuk transaksi, satu untuk kemitraan.",
    sections: [
      {
        heading: "Pertanyaan transaksi",
        body: [
          "Untuk pembayaran, pengiriman, klaim garansi, dan pengajuan pembatalan: kirim surel ke admin@mafiakoijogja.id dengan nomor pesanan pada baris subjek. Pesan tanpa nomor pesanan dijawab paling akhir karena harus dicari manual.",
          "Jam kerja admin 09.00–17.00 WIB, Senin sampai Sabtu. Klaim garansi yang masuk di luar jam kerja tetap tercatat waktu masuknya, jadi batas 3 jam tidak hangus karena malam."
        ]
      },
      {
        heading: "Kemitraan farm dan breeder",
        body: [
          "Farm yang ingin menjual di sini mengirim pengajuan ke kemitraan@mafiakoijogja.id. Lihat Kemitraan Farm & Breeder untuk syarat dan tahapannya."
        ]
      },
      {
        heading: "Yang tidak dilayani lewat kanal ini",
        body: [
          "Penawaran lot tidak diterima lewat surel atau pesan pribadi — tawaran hanya sah bila masuk melalui ruang lelang. Permintaan harga khusus di luar platform juga tidak dilayani."
        ]
      }
    ]
  },

  kemitraan: {
    eyebrow: "Bantuan",
    title: "Kemitraan Farm & Breeder",
    lede: "Syarat, tahapan, dan apa yang rumah lelang ambil.",
    sections: [
      {
        heading: "Syarat dasar",
        body: [
          "Farm aktif dengan kolam pembesaran sendiri, catatan indukan yang bisa ditelusuri, dan fasilitas karantina yang dapat diperiksa. Pedagang tanpa fasilitas sendiri tidak diverifikasi sebagai breeder, meski boleh mendaftar sebagai penjual perlengkapan."
        ]
      },
      {
        heading: "Tahapan",
        body: [
          "Pengajuan lewat surel, lalu pemeriksaan berkas, lalu kunjungan lokasi. Setelah lolos, farm mendapat akses panel penjual untuk mengunggah lot, mengatur harga, dan mengelola stok sendiri.",
          "Lot pertama ditinjau sebelum tayang. Setelah itu penayangan berjalan tanpa tinjauan, dengan audit berkala."
        ]
      },
      {
        heading: "Komisi dan pembayaran",
        body: [
          "Rumah lelang mengambil komisi dari nilai transaksi yang selesai. Besarannya tercantum pada perjanjian kemitraan dan berbeda antara lot lelang dan penjualan harga tetap.",
          "Pencairan mengikuti mekanisme rekening bersama: dana diteruskan setelah pembeli menerima ikan, bukan setelah pembeli membayar."
        ]
      }
    ]
  },

  syarat: {
    eyebrow: "Legal",
    title: "Syarat & Ketentuan",
    lede: "Ketentuan penggunaan platform dan keikutsertaan dalam lelang.",
    sections: [
      {
        heading: "Akun",
        body: [
          "Satu orang satu akun, dengan data yang benar. Akun tidak boleh dipindahtangankan. Pemilik akun bertanggung jawab atas seluruh aktivitas yang terjadi dengan kredensialnya."
        ]
      },
      {
        heading: "Tawaran bersifat mengikat",
        body: [
          "Tawaran yang masuk tidak dapat ditarik. Tawaran tertinggi saat sesi ditutup menjadi transaksi yang wajib diselesaikan sesuai batas waktu pembayaran.",
          "Pengaturan harga antar peserta, penggunaan akun ganda, dan tawaran tanpa niat membayar mengakibatkan pembatalan dan penutupan akses."
        ]
      },
      {
        heading: "Peran rumah lelang",
        body: [
          "Rumah lelang menyelenggarakan lelang dan menahan dana sebagai pihak ketiga. Ikan dijual oleh breeder masing-masing; deskripsi, foto, dan catatan lot adalah pernyataan breeder yang bersangkutan.",
          "Rumah lelang menilai klaim atas dasar bukti yang disyaratkan, dan keputusan atas klaim bersifat final di dalam platform."
        ]
      },
      {
        heading: "Perubahan ketentuan",
        body: [
          "Ketentuan dapat berubah. Perubahan berlaku untuk transaksi yang terjadi setelah perubahan diumumkan, bukan surut ke lot yang sedang berjalan."
        ]
      }
    ]
  },

  privasi: {
    eyebrow: "Legal",
    title: "Kebijakan Privasi",
    lede: "Data apa yang dikumpulkan, untuk apa, dan dibagikan ke siapa.",
    sections: [
      {
        heading: "Yang dikumpulkan",
        body: [
          "Nama, surel, nomor telepon, dan alamat pengiriman yang Anda masukkan sendiri. Riwayat tawaran dan pesanan yang timbul dari penggunaan platform. Data teknis minimal yang diperlukan agar sesi tetap masuk."
        ]
      },
      {
        heading: "Untuk apa dipakai",
        body: [
          "Menjalankan transaksi: mencatat tawaran, menerbitkan tagihan, mengirim pesanan, dan menilai klaim. Alamat dan nomor telepon diteruskan ke breeder dan ekspedisi sejauh yang dibutuhkan untuk mengirim pesanan Anda.",
          "Data tidak dijual ke pihak ketiga dan tidak dipakai untuk iklan pihak lain."
        ]
      },
      {
        heading: "Berapa lama disimpan",
        body: [
          "Catatan transaksi disimpan selama diwajibkan untuk keperluan pembukuan dan sengketa. Data akun yang dihapus atas permintaan Anda dihapus kecuali bagian yang terikat pada catatan transaksi tersebut."
        ]
      },
      {
        heading: "Hak Anda",
        body: [
          "Anda dapat melihat dan memperbaiki data akun dari halaman pengaturan, dan meminta penghapusan akun lewat admin. Permintaan penghapusan tidak membatalkan kewajiban pembayaran yang sedang berjalan."
        ]
      }
    ]
  },

  regulasi: {
    eyebrow: "Legal",
    title: "Regulasi Lelang",
    lede: "Aturan teknis di dalam ruang lelang.",
    sections: [
      {
        heading: "Waktu",
        body: [
          "Pembukaan dan penutupan sesi mengikuti waktu server. Tawaran yang tercatat setelah penutupan tidak sah, tanpa memperhatikan apa yang terlihat di perangkat peserta."
        ]
      },
      {
        heading: "Kelipatan dan perpanjangan",
        body: [
          "Setiap lot memiliki kelipatan kenaikan minimum yang tertera pada halamannya. Tawaran di bawah kelipatan ditolak.",
          "Tawaran yang masuk pada menit terakhir memperpanjang lot tersebut dengan jangka yang sama bagi semua peserta, sehingga tidak ada lot yang berakhir karena peserta lain kehabisan waktu menekan tombol."
        ]
      },
      {
        heading: "Penarikan lot oleh rumah lelang",
        body: [
          "Lot dapat ditarik sebelum sesi ditutup bila ditemukan kekeliruan deskripsi yang material, atau bila kondisi kesehatan ikan berubah. Penarikan setelah sesi ditutup hanya dilakukan bila ikan tidak layak dikirim, dan dana pembeli dikembalikan penuh."
        ]
      },
      {
        heading: "Sanksi",
        body: [
          "Gagal bayar, pengaturan harga, dan manipulasi identitas berakibat pembatalan transaksi dan pembatasan atau penutupan akses akun."
        ]
      }
    ]
  }
}

/** Every segment the standing-page route answers for. */
export const INFO_SLUGS = Object.keys(INFO_DOCS)
