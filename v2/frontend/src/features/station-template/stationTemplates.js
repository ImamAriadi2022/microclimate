export const stationTemplates = [
  {
    id: 'station2',
    name: 'Station 2 — Microclimate Lengkap',
    description: 'Template stasiun pemantauan iklim mikro lengkap (8 sensor, grafik tren, dan tabel riwayat).',
    basePath: '/custom/station2',
    requiredEndpoints: [
      {
        key: 'topic5History',
        label: 'Endpoint Utama / Topic 5 History',
        description: 'Endpoint riwayat data sensor utama.',
        defaultPath: '/petengoran/topic5/history',
      },
      {
        key: 'station2Daily',
        label: 'Riwayat Harian (1 & 7 Hari)',
        description: 'Endpoint riwayat data harian stasiun.',
        defaultPath: '/petengoran/station2/history',
      },
      {
        key: 'station2Resample15m',
        label: 'Riwayat 1 Bulan (Resample 15m)',
        description: 'Endpoint riwayat data 1 bulan / interval 15 menit.',
        defaultPath: '/petengoran/station2/history',
      },
    ],
    requiredTopics: [
      {
        key: 'topic5',
        label: 'MQTT Topic Utama',
        description: 'Topik publikasi data sensor MQTT.',
        defaultTopic: 'topic5',
      },
    ],
  },
];

export const getTemplateById = (templateId) =>
  stationTemplates.find((template) => template.id === templateId) || stationTemplates[0];
