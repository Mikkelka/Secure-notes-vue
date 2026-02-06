export default {
  entry: ['src/ai-testing/AiTestPage.vue'],
  project: ['src/**/*.{js,vue}'],
  ignore: ['public/tinymce/**', 'dist/**', 'docs/**'],
  ignoreBinaries: ['firebase'],
  ignoreIssues: {
    'src/stores/index.js': ['files'],
    'src/components/base/BaseToggle.vue': ['files'],
    'src/constants/folderIds.js': ['exports'],
    'src/constants/folderColors.js': ['exports'],
    'src/utils/secureStorage.js': ['exports'],
    'src/services/aiService.js': ['exports'],
    'src/utils/dataRecovery.js': ['exports'],
    'src/utils/debounce.js': ['exports'],
    'src/ai-testing/services/aiTestService.js': ['exports']
  }
}
