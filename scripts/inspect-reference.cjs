const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('https://app-nu-seven-93.vercel.app/', { waitUntil: 'networkidle' });

  // Full page screenshot
  await page.screenshot({ path: 'fullpage.webp', fullPage: true });

  // Section screenshots
  const sections = [
    { name: 'hero', selector: 'section:nth-child(1)' },
    { name: 'features', selector: 'section:nth-child(2)' },
    { name: 'how-it-works', selector: 'section:nth-child(3)' },
    { name: 'visual-tour', selector: 'section:nth-child(4)' },
    { name: 'pricing', selector: 'section:nth-child(5)' },
    { name: 'faq', selector: 'section:nth-child(6)' },
    { name: 'cta', selector: 'section:nth-child(7)' },
  ];

  for (const section of sections) {
    try {
      const element = await page.$(section.selector);
      if (element) {
        await element.screenshot({ path: `${section.name}.webp` });
      }
    } catch (e) {
      console.log(`Could not capture ${section.name}`);
    }
  }

  // Extract DOM patterns for animations
  const motionDNA = await page.evaluate(() => {
    return {
      animations: Array.from(document.querySelectorAll('*')).filter(el => 
        el.classList.contains('animate') || el.getAttribute('data-aos') || el.getAttribute('data-framer')
      ).map(el => ({
        tag: el.tagName,
        classes: el.className,
        style: el.getAttribute('style')
      })),
      gradients: Array.from(document.querySelectorAll('*')).filter(el => 
        el.style.background?.includes('gradient') || el.className.includes('gradient')
      ).map(el => el.className)
    };
  });
  console.log('MOTION_DNA:', JSON.stringify(motionDNA));

  await browser.close();
})();
