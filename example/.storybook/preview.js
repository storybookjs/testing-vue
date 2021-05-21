export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
};

export const decorators = [
  (story, context) =>
    ({
      component: { story },
      template: `<div style="border:4px solid green;padding:10px;">
      Global decorator ${JSON.stringify(context.globals.locale)}
      <story />
    </div>`
  }),
];

export const globalTypes = {
  locale: {
    name: 'Locale',
    description: 'Language',
    defaultValue: 'en',
    toolbar: {
      icon: 'circlehollow',
      items: [
        { value: 'en', icon: 'circlehollow', title: 'Hello' },
        { value: 'pt-br', icon: 'circle', title: 'Olá' },
        { value: 'fr', icon: 'circle', title: 'Bonjour' },
      ],
    },
  },
}