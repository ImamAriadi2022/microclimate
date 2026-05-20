export const stationTemplates = [
  {
    id: 'station2',
    name: 'data alat',
    description: 'Template dashboard',
    basePath: '/custom/station2',
    requiredEndpoints: [
      {
        key: 'topic5History',
        label: 'Topic5 History',
        description: 'Data sensor (topic5).',
        defaultPath: '/petengoran/topic5/history',
      },
      {
        key: 'Daily data',
        label: 'Daily History',
        description: 'Riwayat harian.',
        defaultPath: '/petengoran/station2/history',
      },
      {
        key: 'Resample15m',
        label: 'Resample 15m',
        description: 'Data resample 15 menit',
        defaultPath: '/petengoran/station2/history',
      },
    ],
    requiredTopics: [
      {
        key: 'topic5',
        label: 'MQTT Topic 5',
        description: 'Topik data',
        defaultTopic: 'topic5',
      },
    ],
  },
];

export const getTemplateById = (templateId) =>
  stationTemplates.find((template) => template.id === templateId) || stationTemplates[0];
