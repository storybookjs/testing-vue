import Vue from 'vue'
import { combineParameters } from '@storybook/client-api'
import { ArgTypes, Parameters, BaseDecorators } from '@storybook/addons'
import { Story, Meta, StoryContext } from '@storybook/vue'
import decorateStory from './decorateStory'
import type { ComponentOptions, VueConstructor } from 'vue'

type StoryFnVueReturnType = string | ComponentOptions<any>
/**
 * Object representing the preview.ts module
 *
 * Used in storybook testing utilities.
 * @see [Unit testing with Storybook](https://storybook.js.org/docs/react/workflows/unit-testing)
 */
export type GlobalConfig = {
  decorators?: BaseDecorators<StoryFnVueReturnType>
  parameters?: Parameters
  argTypes?: ArgTypes
  [key: string]: any
}

/**
 * T represents the whole es module of a stories file. K of T means named exports (basically the Story type)
 * 1. pick the keys K of T that have properties that are Story<AnyProps>
 * 2. infer the actual prop type for each Story
 * 3. reconstruct Story with Partial. Story<Props> -> Story<Partial<Props>>
 */
export type StoriesWithPartialProps<T> = {
  [K in keyof T as T[K] extends Story<any> ? K : never]: T[K] extends Story<
    infer P
  >
    ? Story<Partial<P>>
    : unknown
}

let globalStorybookConfig: GlobalConfig = {}

export function setGlobalConfig(config: GlobalConfig) {
  globalStorybookConfig = config
}

export function composeStory<GenericArgs>(
  story: Story<GenericArgs>,
  meta: Meta,
  globalConfig: GlobalConfig = globalStorybookConfig
): Story<Partial<GenericArgs>> {
  if (typeof story !== 'function') {
    throw new Error(
      `Cannot compose story due to invalid format. @storybook/testing-vue expected a function but received ${typeof story} instead.`
    )
  }

  if ((story as any).story !== undefined) {
    throw new Error(
      `StoryFn.story object-style annotation is not supported. @storybook/testing-vue expects hoisted CSF stories.
           https://github.com/storybookjs/storybook/blob/next/MIGRATION.md#hoisted-csf-annotations`
    )
  }

  const finalStoryFn = (context: StoryContext) => {
    const { passArgsFirst = true } = context.parameters
    if (!passArgsFirst) {
      throw new Error(
        'composeStory does not support legacy style stories (with passArgsFirst = false).'
      )
    }
    const component = story(
      context.args as GenericArgs,
      context
    ) as StoryFnVueReturnType

    const cmp =
      typeof component === 'string' ? { template: component } : component

    cmp.props = Object.keys(context.args)

    return Vue.extend({
      render(h) {
        return h(cmp, {
          props: context.args,
        })
      },
    })
  }

  const combinedDecorators = [
    ...(story.decorators || []),
    ...(meta?.decorators || []),
    ...(globalConfig?.decorators || []),
  ]

  const decorated = decorateStory(
    finalStoryFn as any,
    combinedDecorators as any
  )

  const defaultGlobals = Object.entries(
    (globalConfig.globalTypes || {}) as Record<string, { defaultValue: any }>
  ).reduce((acc, [arg, { defaultValue }]) => {
    if (defaultValue) {
      acc[arg] = defaultValue
    }
    return acc
  }, {} as Record<string, { defaultValue: any }>)
  return ((extraArgs: Record<string, any>) =>
    // @ts-ignore
    decorated({
      id: '',
      kind: '',
      name: '',
      argTypes: globalConfig.argTypes || {},
      globals: defaultGlobals,
      parameters: combineParameters(
        globalConfig.parameters || {},
        meta?.parameters || {},
        story.parameters || {}
      ),
      args: {
        ...(meta?.args || {}),
        ...story.args,
        ...extraArgs,
      },
    })) as Story<Partial<GenericArgs>>
}

export function composeStories<
  T extends { default: Meta; __esModule?: boolean }
>(storiesImport: T, globalConfig?: GlobalConfig): StoriesWithPartialProps<T> {
  const { default: meta, __esModule, ...stories } = storiesImport
  // Compose an object containing all processed stories passed as parameters
  const composedStories = Object.entries(stories).reduce(
    (storiesMap, [key, story]) => {
      storiesMap[key] = composeStory(story as Story, meta, globalConfig)
      return storiesMap
    },
    {} as { [key: string]: Story }
  )
  return composedStories as StoriesWithPartialProps<T>
}

/**
 * Useful function for JSX syntax call of vue stories
 */
export const h = (
  cmp: (p: Record<string, any>) => VueConstructor,
  { props }: { props?: any } = {}
) => cmp(props)
