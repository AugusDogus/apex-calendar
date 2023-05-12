import puppeteer from 'puppeteer';

export const getBrowser = async () => {
  return puppeteer.launch({
    args: ['--window-size=1920,1080', '--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: {
      width: 1920,
      height: 1080,
    },
  });
};
