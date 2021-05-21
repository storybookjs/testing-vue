import MyButton from "./Button.vue";

export default {
  title: "Example/Button",
  component: MyButton,
  decorators: [
    () => `<div style='border:4px solid red;padding:10px;'>
      Component Decorator
      <story/>
    </div>`,
  ],
  argTypes: {
    backgroundColor: { control: "color" },
    size: {
      control: { type: "select", options: ["small", "medium", "large"] },
    },
  },
};

const Template = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { MyButton },
  template: '<my-button @onClick="onClick" v-bind="$props" />',
});

export const Primary = Template.bind({});
Primary.args = {
  primary: true,
  label: "Primary Button",
};
Primary.decorators = [
  () => `<div style='border:4px solid blue;padding:10px;'>
    Story Decorator <br/>
    <story/>
  </div>`,
]

export const Secondary = Template.bind({});
Secondary.args = {
  label: "Secondary Button",
};

export const Large = Template.bind({});
Large.args = {
  size: "large",
  label: "Button",
};

export const Small = Template.bind({});
Small.args = {
  size: "small",
  label: "Button",
};
