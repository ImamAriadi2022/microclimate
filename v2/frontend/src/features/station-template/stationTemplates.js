export const stationTemplates = [
  {
    id: 'station2',
    name: 'Stasiun Cuaca & Iklim Lengkap (Maks. 8 Sensor)',
    shortName: 'Stasiun Lengkap (8 Sensor)',
    description:
      'Mendukung hingga 8 parameter sensor (Suhu, Kelembaban, Curah Hujan, Kecepatan & Arah Angin, Radiasi Matahari, Tekanan Udara, dan Suhu Alat) lengkap dengan grafik tren serta tabel riwayat.',
    basePath: '/custom/station2',
    requiredEndpoints: [
      {
        key: 'topic5History',
        label: 'Path Endpoint Data Sensor',
        description: 'Path URL pada server API Anda yang mengembalikan daftar pembacaan sensor.',
        defaultPath: '',
        placeholder: '/api/sensor/history',
      },
      {
        key: 'station2Daily',
        label: 'Path Data Harian (1 & 7 Hari)',
        description: 'Opsional — digunakan jika server Anda memisahkan endpoint data harian.',
        defaultPath: '',
        placeholder: '/api/sensor/daily',
      },
      {
        key: 'station2Resample15m',
        label: 'Path Data Bulanan (Interval 15 Menit)',
        description: 'Opsional — digunakan jika server Anda memisahkan endpoint ringkasan bulanan.',
        defaultPath: '',
        placeholder: '/api/sensor/monthly',
      },
    ],
    requiredTopics: [
      {
        key: 'topic5',
        label: 'Topik MQTT Data Sensor',
        description: 'Nama topik tempat perangkat Anda mengirimkan data sensor.',
        defaultTopic: 'sensor/data',
      },
    ],
  },
];

export const getTemplateById = (templateId) =>
  stationTemplates.find((template) => template.id === templateId) || stationTemplates[0];

export const getTemplateDisplayName = (templateId) => {
  const found = stationTemplates.find((template) => template.id === templateId);
  return found ? found.shortName || found.name : templateId;
};
