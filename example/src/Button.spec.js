import { mount } from '@cypress/vue';
import { composeStories } from '@storybook/testing-vue';

import * as stories from './Button.stories.js';

const { Primary, Secondary } = composeStories(stories);

describe('<Button />', () => {
  it('Primary', () => {
    mount(<Primary />);
    cy.get('button').should('exist');
  });

  it('Secondary', () => {
    mount(<Secondary label="overriden label" />);
    cy.get('button').should('exist');
  });
});
