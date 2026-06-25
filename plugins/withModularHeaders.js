const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withModularHeaders(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      if (fs.existsSync(podfilePath)) {
        let content = fs.readFileSync(podfilePath, 'utf8');
        
        const targetRegex = /(target\s+['"][^'"]+['"]\s+do)/;
        if (targetRegex.test(content)) {
          const modularPods = `
  pod 'GoogleUtilities', :modular_headers => true
  pod 'RecaptchaInterop', :modular_headers => true`;
          
          // Only add if not already present to keep it idempotent
          if (!content.includes("pod 'RecaptchaInterop'")) {
            content = content.replace(targetRegex, `$1${modularPods}`);
            fs.writeFileSync(podfilePath, content, 'utf8');
          }
        }
      }
      return config;
    },
  ]);
};
