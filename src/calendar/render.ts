import { Resvg } from '@resvg/resvg-js';
import { cloneElement, isValidElement, type h } from 'preact';
import { Children } from 'preact/compat';
import satori from 'satori';
import { tailwindToCSS, type TailwindConfig } from 'tw-to-css';
import { Calendar, Event } from './components/calendar';

const WIDTH = 1920;
const HEIGHT = 1080;

function inlineTailwind(el: h.JSX.Element): h.JSX.Element {
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
  // Return cloned element with updated props
  return cloneElement(el, { ...props, style: mergedStyle }, processedChildren);
}

export async function renderCalendarEvents(events: Event[]): Promise<Buffer> {
  const element = Calendar({ events });
  const jsx = inlineTailwind(element);

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

  // Convert SVG to PNG buffer
  const resvg = new Resvg(svg);
  const pngData = resvg.render();
  return pngData.asPng();
}
