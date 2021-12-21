import Vue, { ComponentOptions, VueConstructor } from 'vue';
import { StoryFn, DecoratorFunction, StoryContext } from '@storybook/addons';

export const WRAPS = 'STORYBOOK_WRAPS';
export const VALUES = 'STORYBOOK_VALUES';

export type VueStory =
  | (ComponentOptions<any> & { options: Record<string, any> })
  | VueConstructor;
type StoryFnVueReturnType = string | ComponentOptions<any> | VueConstructor;

function getType(fn: Function) {
  const match = fn && fn.toString().match(/^\s*function (\w+)/);
  return match ? match[1] : '';
}

// https://github.com/vuejs/vue/blob/dev/src/core/util/props.js#L92
function resolveDefault({ type, default: def }: any) {
  if (typeof def === 'function' && getType(type) !== 'Function') {
    // known limitation: we don't have the component instance to pass
    return def.call();
  }

  return def;
}

export function extractProps(component: VueConstructor) {
  // @ts-ignore this options business seems not good according to the types
  return Object.entries(component.options.props || {})
    .map(([name, prop]) => ({ [name]: resolveDefault(prop) }))
    .reduce((wrap, prop) => ({ ...wrap, ...prop }), {});
}

function prepare(rawStory: StoryFnVueReturnType, innerStory?: VueStory) {
  let story: ComponentOptions<Vue> | VueConstructor;

  if (typeof rawStory === 'string') {
    story = { template: rawStory };
  } else if (rawStory != null) {
    story = rawStory as ComponentOptions<Vue>;
  } else {
    return null;
  }

  let storyVue: VueConstructor;
  // @ts-ignore
  // eslint-disable-next-line no-underscore-dangle
  if (!story._isVue) {
    if (innerStory) {
      story.components = { ...(story.components || {}), story: innerStory };
    }
    storyVue = Vue.extend(story);
    // @ts-ignore // https://github.com/storybookjs/storybook/pull/7578#discussion_r307984824
  } else if (story.options[WRAPS]) {
    storyVue = story as VueConstructor;
    return storyVue;
  } else {
    storyVue = story as VueConstructor;
  }

  return Vue.extend({
    // @ts-ignore // https://github.com/storybookjs/storybook/pull/7578#discussion_r307985279
    [WRAPS]: story,
    // @ts-ignore // https://github.com/storybookjs/storybook/pull/7578#discussion_r307984824
    [VALUES]: {
      ...(innerStory && 'options' in innerStory
        ? innerStory.options[VALUES]
        : {}),
      ...extractProps(storyVue),
    },
    functional: true,
    render(h, { data, parent, children }) {
      return h(
        story,
        {
          ...data,
          // @ts-ignore // https://github.com/storybookjs/storybook/pull/7578#discussion_r307986196
          props: { ...(data.props || {}), ...parent.$root[VALUES] },
        },
        children
      );
    },
  });
}

const defaultContext: StoryContext = {
  id: 'unspecified',
  name: 'unspecified',
  kind: 'unspecified',
  parameters: {},
  args: {},
  argTypes: {},
  globals: {},
};

function decorateStory(
  storyFn: StoryFn<StoryFnVueReturnType>,
  decorators: DecoratorFunction<StoryFnVueReturnType>[]
) {
  return decorators.reduce(
    // @ts-ignore
    (decorated, decorator) => (context: StoryContext = defaultContext) => {
      let story: VueStory;

      const decoratedStory = decorator(
        ({ parameters, ...innerContext } = {} as StoryContext) =>
          decorated({ ...context, ...innerContext }),
        context
      );

      if (!story) {
        story = decorated(context) as VueStory;
      }

      if (decoratedStory === story) {
        return story;
      }

      return prepare(decoratedStory, story);
    },
    (context: StoryContext) => prepare(storyFn(context))
  );
}

export default decorateStory;
