/**
 * electron-builder configuration for Interview Studio AI.
 *
 * Builds a universal-ish Mac DMG (separate arm64 + x64 artifacts) the user
 * can drag into /Applications.
 */
module.exports = {
  appId: 'com.interviewstudio.ai',
  productName: 'Interview Studio AI',
  copyright: 'Interview Studio AI',
  directories: {
    output: 'release',
    buildResources: 'electron'
  },
  files: [
    'electron/**',
    'server/**',
    'dist/**',
    'package.json',
    '!**/node_modules/**/{CHANGELOG.md,README.md,README,readme.md,readme}',
    '!**/node_modules/**/*.{md,markdown,ts,map}',
    '!**/node_modules/**/{test,tests,__tests__,docs,doc,example,examples}/**',
    '!**/{.DS_Store,.git,.idea,.vscode,*.log}'
  ],
  asar: true,
  asarUnpack: [
    // pdf-parse loads its sample at runtime; ensure it's accessible.
    '**/node_modules/pdf-parse/**'
  ],
  extraMetadata: {
    main: 'electron/main.cjs'
  },
  mac: {
    category: 'public.app-category.productivity',
    target: [
      { target: 'dmg', arch: ['arm64', 'x64'] },
      { target: 'zip', arch: ['arm64', 'x64'] }
    ],
    // icon: 'electron/icon.icns',  // drop in your own .icns to brand the .app
    hardenedRuntime: false,
    gatekeeperAssess: false,
    identity: null // unsigned local build
  },
  dmg: {
    title: 'Interview Studio AI',
    backgroundColor: '#0a0d18',
    window: { width: 540, height: 380 },
    contents: [
      { x: 140, y: 200, type: 'file' },
      { x: 400, y: 200, type: 'link', path: '/Applications' }
    ]
  }
};
