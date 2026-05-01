// This file is a plain-JS Vercel function entry point.
// NestJS source is pre-compiled to dist/ by the build command (tsc with emitDecoratorMetadata),
// so Vercel does not need to transpile TypeScript decorators itself.
module.exports = require('../dist/lambda').default;
