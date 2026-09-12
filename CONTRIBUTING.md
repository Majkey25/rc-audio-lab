# Contributing

Use Node.js 24 or newer. Install with `npm ci`.

Keep changes focused and preserve the RC model's assumptions. New formulas need a derivation or a primary source and a numerical test. UI changes must work in Czech and English and remain operable by keyboard.

Before submitting a pull request:

```sh
npm run check
npx playwright install chromium firefox
npm run test:e2e -- --workers=2
```

Check the rendered interface at desktop and mobile widths. Audio changes must be verified through the production worklet, not only by testing a separate formula. Keep sample/photo licenses and credits with any replacement assets.

The report is maintained separately from the simulator. Do not silently change its equations, citations or claims of experimental verification when changing code.
