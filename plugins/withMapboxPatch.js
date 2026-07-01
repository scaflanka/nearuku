const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withMapboxPatch(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      if (fs.existsSync(podfilePath)) {
        let content = fs.readFileSync(podfilePath, 'utf8');
        
        const postInstallMatch = /post_install\s+do\s+\|installer\|/;
        if (postInstallMatch.test(content)) {
          const patchCode = `
    # Patch Mapbox Xcode 16 compilation error
    mapbox_file = File.join(installer.sandbox.root, 'MapboxMaps/Sources/MapboxMaps/Annotations/ViewAnnotationManager.swift')
    if File.exist?(mapbox_file)
      content = File.read(mapbox_file)
      if content.include?("idsByView.compactMapValues") && !content.include?("let values = idsByView.compactMapValues")
        content = content.gsub(
          /idsByView\\.compactMapValues\\s*\\{\\s*\\[mapboxMap\\]\\s*id\\s*in\\s*try\\?\\s*mapboxMap\\.options\\(forViewAnnotationWithId:\\s*id\\)\\s*\\}/,
          "let values = idsByView.compactMapValues { [mapboxMap] id in
            try? mapboxMap.options(forViewAnnotationWithId: id)
        }
        return values"
        )
        File.write(mapbox_file, content)
        puts "Successfully patched Mapbox ViewAnnotationManager.swift"
      end
    end`;
          
          if (!content.includes("Patch Mapbox Xcode 16 compilation error")) {
            content = content.replace(postInstallMatch, `post_install do |installer|${patchCode}`);
            fs.writeFileSync(podfilePath, content, 'utf8');
          }
        }
      }
      return config;
    },
  ]);
};
