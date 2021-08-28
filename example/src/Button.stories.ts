import MyButton from './Button.vue';
import { Story } from '@storybook/vue';

export default {
  title: 'Example/Button',
  component: MyButton,
  decorators: [
    () => `<div style='border:4px solid red;padding:10px;'>
      Component Decorator
      <story/>
    </div>`,
  ],
  argTypes: {
    onClick: { action: 'onClick' },
    backgroundColor: { control: 'color' },
    size: {
      control: { type: 'select', options: ['small', 'medium', 'large'] },
    },
  },
};

const Template: Story = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { MyButton },
  template: '<my-button @onClick="onClick" v-bind="$props" />',
});

export const Primary: Story = Template.bind({});
Primary.args = {
  primary: true,
  label: 'Primary Button',
};
Primary.decorators = [
  () => `<div style='border:4px solid blue;padding:10px;'>
    Story Decorator <br/>
    <story/>
  </div>`,
];

export const Secondary: Story = Template.bind({});
Secondary.args = {
  label: 'Secondary Button',
};

export const Large: Story = Template.bind({});
Large.args = {
  size: 'large',
  label: 'Button',
};

export const Small = Template.bind({});
Small.args = {
  size: 'small',
  label: 'Button',
};
