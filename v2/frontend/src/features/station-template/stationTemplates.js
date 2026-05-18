export const stationTemplates = [
  {
    id: 'station2',
    name: 'Station2',
    description: 'Template dashboard Station2 dari v1 sebagai acuan utama.',
    basePath: '/custom/station2',
    requiredEndpoints: [
      {
        key: 'topic5History',
        label: 'Topic5 History',
        description: 'Data sensor Station2 (topic5).',
        defaultPath: '/petengoran/topic5/history',
      },
      {
        key: 'station2Daily',
        label: 'Station2 Daily History',
        description: 'Riwayat harian Station2.',
        defaultPath: '/petengoran/station2/history',
      },
      {
        key: 'station2Resample15m',
        label: 'Station2 Resample 15m',
        description: 'Data resample 15 menit Station2.',
        defaultPath: '/petengoran/station2/history',
      },
    ],
    requiredTopics: [
      {
        key: 'topic5',
        label: 'MQTT Topic 5',
        description: 'Topik data Station2.',
        defaultTopic: 'topic5',
      },
    ],
  },
];

export const getTemplateById = (templateId) =>
  stationTemplates.find((template) => template.id === templateId) || stationTemplates[0];
