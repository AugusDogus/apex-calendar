import jimp from 'jimp';
import { getBrowser } from './getBrowser';
import { env } from '../env';

export const getCalendarImage = async () => {
  const browser = await getBrowser();
  const page = await browser.newPage();
  await page.goto(env.CALENDAR_URL);
  await page.mouse.click(1000, 1000);
  const screenshot = await page.screenshot({ clip: { x: 46, y: 167, width: 1057, height: 780 } });

  const image = await jimp.read(screenshot);
  // Get the image's height
  const height = image.getHeight();
  // Scan through the image from the bottom to the top
  for (let y = height - 1; y > 0; y--) {
    // Get the color of the pixel
    const color = image.getPixelColor(0, y);
    // Get the RGBA values
    const rgba = jimp.intToRGBA(color);
    // Check if the pixel is 000000
    if (rgba.r === 0 && rgba.g === 0 && rgba.b === 0) {
      // Pixel is black, crop the image to one pixel below the black pixel
      image.crop(0, 0, 1057, y + 1);
      break;
    }
  }

  await browser.close();
  return image.getBufferAsync(jimp.MIME_PNG);
};
