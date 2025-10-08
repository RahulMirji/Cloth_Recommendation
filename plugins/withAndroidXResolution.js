const { withProjectBuildGradle } = require('@expo/config-plugins');

/**
 * Adds AndroidX resolution strategy to force all dependencies to use AndroidX
 * This replaces old Android Support libraries with their AndroidX equivalents
 */
function withAndroidXResolution(config) {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      const buildGradleContent = config.modResults.contents;
      
      // Check if we haven't already added this
      if (!buildGradleContent.includes('Force AndroidX dependencies')) {
        // Add the resolution strategy to allprojects block
        const resolutionStrategy = `
allprojects {
    configurations.all {
        resolutionStrategy {
            // Force specific AndroidX versions to avoid conflicts
            force 'androidx.core:core:1.16.0'
            force 'androidx.versionedparcelable:versionedparcelable:1.1.1'
            force 'androidx.appcompat:appcompat:1.7.0'
            
            // Replace old support libraries with AndroidX equivalents
            eachDependency { details ->
                if (details.requested.group == 'com.android.support') {
                    def name = details.requested.name
                    // Map support library to AndroidX equivalent
                    if (name == 'support-compat' || name == 'support-core-utils') {
                        details.useTarget 'androidx.core:core:1.16.0'
                    } else if (name == 'appcompat-v7') {
                        details.useTarget 'androidx.appcompat:appcompat:1.7.0'
                    } else if (name == 'versionedparcelable') {
                        details.useTarget 'androidx.versionedparcelable:versionedparcelable:1.1.1'
                    } else if (name == 'support-v4') {
                        details.useTarget 'androidx.legacy:legacy-support-v4:1.0.0'
                    } else if (name == 'support-annotations') {
                        details.useTarget 'androidx.annotation:annotation:1.10.0'
                    }
                }
            }
        }
    }
}
`;
        
        // Insert before buildscript block or at the beginning
        config.modResults.contents = resolutionStrategy + '\n' + buildGradleContent;
      }
    }
    
    return config;
  });
}

module.exports = withAndroidXResolution;
