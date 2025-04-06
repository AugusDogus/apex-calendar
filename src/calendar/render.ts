import { Resvg } from '@resvg/resvg-js';
import { cloneElement, isValidElement, type h } from 'preact';
import { Children } from 'preact/compat';
import satori from 'satori';
import { tailwindToCSS, type TailwindConfig } from 'tw-to-css';
import { Calendar } from './components/calendar';
import type { CalendarEvent } from './types';

const WIDTH = 1920;
const HEIGHT = 1080;

const inlineTailwind = (el: h.JSX.Element) => {
  console.log('Processing Tailwind styles...');
  const config: TailwindConfig = {
    theme: {},
    plugins: [],
  };
  const { twj } = tailwindToCSS({ config });

  const { tw, children, style: originalStyle, ...props } = el.props;
  // Generate style from the `tw` prop
  const twStyle = tw ? twj(tw.split(' ')) : {};
  // Merge original and generated styles
  const mergedStyle = { ...originalStyle, ...twStyle };
  // Recursively process children
  const processedChildren = Children.map(children, (child) =>
    isValidElement(child) ? inlineTailwind(child as h.JSX.Element) : child,
  );

  return cloneElement(el, { ...props, style: mergedStyle }, processedChildren);
};

export const renderCalendarEvents = async (events: CalendarEvent[]) => {
  const jsx = Calendar({ events });

  const svg = await satori(jsx, {
    width: WIDTH,
    height: HEIGHT,
    fonts: [
      {
        name: 'Geist Sans',
        data: await Bun.file('node_modules/geist/dist/fonts/geist-sans/Geist-Regular.ttf').arrayBuffer(),
        weight: 400,
        style: 'normal',
      },
      {
        name: 'Geist Sans',
        data: await Bun.file('node_modules/geist/dist/fonts/geist-sans/Geist-Bold.ttf').arrayBuffer(),
        weight: 700,
        style: 'normal',
      },
    ],
  });

  const resvg = new Resvg(svg);
  const pngData = resvg.render();
  return pngData.asPng();
};
