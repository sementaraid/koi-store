import { ROUTES } from './routes.ts';

export type InfoSection = {
  heading: string
  body: string[]
}

export type InfoDoc = {
  eyebrow: string
  title: string
  lede: string
  sections: InfoSection[]
  action?: {
    label: string
    href: string
    note?: string
  }
}

export const INFO_DOCS: Record<string, InfoDoc> = {
  panduan: {
    eyebrow: "Panduan",
    title: "Panduan bid pemula",
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
          "Sesi dibuka sesuai jadwal. Pasang tawaran langsung di halaman lot, dan tawaran Anda tercatat dengan waktu server — bukan waktu perangkat Anda. Selisih satu detik di layar bisa berarti tawaran Anda masuk setelah ketukan.",
          "Kenaikan tawaran mengikuti kelipatan yang tertera pada tiap lot. Tawaran di bawah kelipatan ditolak sistem, bukan ditawar ulang."
        ]
      },
      {
        heading: "4. Menang lot",
        body: [
          "Pemenang mendapat notifikasi dan tagihan di halaman pesanan. Transfer harga menang ke rekening Koi Auction House dalam 1×24 jam, lalu admin memverifikasi pembayaran. Rumah lelang meneruskan harga menang ke farm setelah ikan tiba sehat — lihat Mekanisme Pembayaran & Pencairan.",
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
    title: "Mekanisme Pembayaran & Pencairan",
    lede: "Harga menang dibayar ke rumah lelang, lalu diteruskan ke farm setelah ikan tiba sehat.",
    sections: [
      {
        heading: "Kenapa tidak bayar langsung ke farm",
        body: [
          "Transaksi koi bernilai tinggi dengan barang hidup yang dikirim lintas pulau. Bila uang berpindah lebih dulu, risiko sepenuhnya di pembeli; bila ikan berpindah lebih dulu, risiko sepenuhnya di farm. Rekening bersama memindahkan keduanya ke rumah lelang."
        ]
      },
      {
        heading: "Alur dana",
        body: [
          "Pemenang mentransfer harga menang ke rekening Koi Auction House dalam 1×24 jam. Setelah admin memverifikasi transfer, lot ditandai lunas dan farm boleh memulai karantina.",
          "Rumah lelang meneruskan harga menang ke farm setelah pemenang mengunggah bukti ikan tiba sehat, atau tiga hari setelah farm menandai lot dikirim bila pemenang tidak mengirim bukti. Yang dipotong hanya biaya transfer bank; tidak ada komisi."
        ]
      },
      {
        heading: "Bila ada klaim",
        body: [
          "Klaim yang masuk sebelum dana diteruskan menunda pencairan sampai penilaian selesai. Pengembalian dana penuh atau sebagian dibayar rumah lelang dari rekening perusahaan, sehingga pembeli tidak menunggu itikad baik pihak mana pun.",
          "Tidak ada komisi. Biaya transfer bank dipotong dari pencairan ke farm dan tidak pernah dari dana yang dikembalikan ke pembeli."
        ]
      },
      {
        heading: "Di luar mekanisme ini",
        body: [
          "Pembayaran langsung ke rekening pribadi farm di luar platform tidak dilindungi, tidak bisa diklaim, dan merupakan pelanggaran ketentuan bagi farm yang memintanya."
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
          "Tagihan lot yang dimenangkan harus ditransfer ke rekening Koi Auction House dalam 1×24 jam sejak sesi ditutup. Lewat batas itu akun dicatat gagal bayar dan admin memberi strike; dua catatan gagal bayar menutup akses bid. Lot tidak dialihkan ke peserta lain.",
          "Pembelian katalog harga tetap dan perlengkapan tidak menahan stok sampai dibayar."
        ]
      },
      {
        heading: "Metode",
        body: [
          "Transfer bank ke rekening bersama rumah lelang adalah metode utama untuk lot lelang, karena jumlahnya besar dan pembayaran harus tercatat sebelum ikan dikirim. Rincian rekening muncul pada halaman tagihan masing-masing pesanan.",
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
          "Ikan yang akan dikirim lintas provinsi menjalani karantina di fasilitas farm dengan parameter air tercatat harian. Masa minimum tujuh hari untuk pengiriman domestik, lebih panjang bila hasil pemeriksaan menuntutnya."
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
    title: "Garansi Tiba Hidup (Klaim 4 Jam)",
    lede: "Ikan mati dalam perjalanan diganti nilainya — dengan syarat bukti.",
    sections: [
      {
        heading: "Cakupan",
        body: [
          "Garansi berlaku untuk kematian yang terjadi dalam masa pengiriman, dihitung dari kemasan disegel di fasilitas farm sampai paket diterima di alamat tujuan.",
          "Garansi tidak mencakup kematian setelah ikan masuk kolam atau wadah pembeli, termasuk kematian akibat aklimatisasi yang terlalu cepat, parameter air tujuan yang tidak cocok, atau penyakit yang muncul kemudian."
        ]
      },
      {
        heading: "Syarat bukti",
        body: [
          "Rekaman video tanpa jeda dan tanpa potongan, dimulai saat kardus masih tersegel dengan label pengiriman terbaca, berlanjut sampai kantong dibuka dan ikan terlihat. Rekaman yang dimulai setelah kardus terbuka tidak dapat diterima — tidak ada cara membedakan ikan yang sampai mati dari ikan yang mati sesudahnya.",
          "Klaim diajukan maksimum 4 jam sejak paket tercatat diterima oleh ekspedisi."
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
    lede: "Satu kanal untuk pertanyaan transaksi dan kemitraan.",
    sections: [
      {
        heading: "Pertanyaan transaksi",
        body: [
          "Untuk pembayaran, pengiriman, klaim garansi, dan pengajuan pembatalan: hubungi admin melalui halaman ini dengan nomor pesanan pada baris subjek. Pesan tanpa nomor pesanan dijawab paling akhir karena harus dicari manual.",
          "Jam kerja admin 09.00–17.00 WIB, Senin sampai Sabtu. Klaim garansi yang masuk di luar jam kerja tetap tercatat waktu masuknya, jadi batas 4 jam tidak hangus karena malam."
        ]
      },
      {
        heading: "Kemitraan farm",
        body: [
          "Farm yang ingin menjual di sini mengajukan lewat Area Peternak di situs ini. Lihat Kemitraan Farm untuk syarat dan tahapannya."
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
    title: "Kemitraan Farm",
    lede: "Syarat, tahapan, dan bagaimana pembayaran farm bekerja.",
    sections: [
      {
        heading: "Syarat dasar",
        body: [
          "Farm aktif dengan kolam pembesaran sendiri, catatan indukan yang bisa ditelusuri, dan fasilitas karantina yang dapat diperiksa. Pedagang tanpa fasilitas sendiri tidak diverifikasi sebagai farm, meski boleh mendaftar sebagai penjual perlengkapan."
        ]
      },
      {
        heading: "Tahapan",
        body: [
          "Pengajuan lewat Area Peternak di situs ini, lalu pemeriksaan berkas, lalu kunjungan lokasi. Setelah lolos, farm mengelola lelang dan lotnya sendiri lewat Area Peternak.",
          "Lot pertama ditinjau sebelum tayang. Setelah itu penayangan berjalan tanpa tinjauan, dengan audit berkala."
        ]
      },
      {
        heading: "Komisi dan pembayaran",
        body: [
          "Rumah lelang tidak mengambil komisi. Farm menerima harga menang penuh.",
          "Pencairan diteruskan setelah pemenang mengunggah bukti ikan tiba sehat, atau tiga hari setelah farm menandai lot dikirim bila pemenang tidak mengirim bukti. Yang dipotong hanya biaya transfer bank."
        ]
      }
    ],
    action: {
      label: "Buka Area Peternak",
      href: ROUTES.farm,
      note: "Farm yang sudah terverifikasi masuk lewat Area Peternak. Pengajuan baru juga lewat Area Peternak."
    }
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
          "Rumah lelang menyelenggarakan lelang dan menerima pembayaran sebagai pihak ketiga. Ikan dijual oleh farm masing-masing; deskripsi, foto, dan catatan lot adalah pernyataan farm yang bersangkutan.",
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

export const INFO_SLUGS = Object.keys(INFO_DOCS)
