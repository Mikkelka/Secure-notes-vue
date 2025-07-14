import { ref, computed } from 'vue'

export function useAiTesting() {
  // Test configuration
  const testConfig = ref({
    model: 'gemini-2.5-flash-lite-preview-06-17',
    enableThinking: false,
    thinkingBudget: -1,
    includeThoughts: false
  })

  // API Key management
  const apiKey = ref('')
  const apiStatus = ref({ message: '', type: '' })

  // Test state
  const testInput = ref('')
  const testResults = ref([])
  const isRunning = ref(false)
  const showAdvanced = ref(false)

  // Computed properties
  const canRunTest = computed(() => {
    return testInput.value.trim().length > 0 && apiKey.value.trim().length > 0
  })

  const performanceSummary = computed(() => {
    if (testResults.value.length === 0) return null
    
    const successfulResults = testResults.value.filter(r => r.success)
    if (successfulResults.length === 0) return null
    
    const totalTimes = successfulResults.map(r => r.totalTime)
    
    return {
      avgTotal: Math.round(totalTimes.reduce((a, b) => a + b, 0) / totalTimes.length),
      fastest: Math.min(...totalTimes),
      slowest: Math.max(...totalTimes),
      totalTests: successfulResults.length
    }
  })

  // API Key management methods
  const saveApiKey = () => {
    if (apiKey.value.trim()) {
      localStorage.setItem('ai-test-api-key', apiKey.value.trim())
      apiStatus.value = { message: 'API key saved!', type: 'success' }
    }
  }

  const loadSavedApiKey = () => {
    const savedApiKey = localStorage.getItem('ai-test-api-key')
    if (savedApiKey) {
      apiKey.value = savedApiKey
      apiStatus.value = { message: 'API key loaded from storage', type: 'success' }
    }
  }

  // Test preset methods
  const loadPreset = (preset) => {
    testInput.value = preset.content
  }

  // Utility methods
  const getTimingColor = (time) => {
    if (time < 2000) return 'text-green-400'
    if (time < 5000) return 'text-yellow-400'
    return 'text-red-400'
  }

  const clearResults = () => {
    testResults.value = []
  }

  // Main test execution
  const runTest = async () => {
    if (!canRunTest.value || isRunning.value) return
    
    isRunning.value = true
    const startTime = performance.now()
    
    try {
      // Import AI service dynamically
      const { processTextWithAi } = await import('../../services/aiService.js')
      
      // Create mock user settings
      const mockUserSettings = {
        aiSettings: {
          apiKey: apiKey.value.trim(),
          selectedModel: testConfig.value.model,
          enableThinking: testConfig.value.enableThinking,
          thinkingBudget: testConfig.value.thinkingBudget,
          includeThoughts: testConfig.value.includeThoughts
        }
      }
      
      console.log(`🧪 AI Test Started - ${testConfig.value.model}`)
      console.log('🔧 Config:', {
        enableThinking: testConfig.value.enableThinking,
        thinkingBudget: testConfig.value.thinkingBudget,
        includeThoughts: testConfig.value.includeThoughts
      })
      
      // Initialize performance tracking
      if (!window.aiPerformanceMetrics) {
        window.aiPerformanceMetrics = []
      }
      
      // Run the AI test
      const result = await processTextWithAi(
        testInput.value,
        'AI Test',
        mockUserSettings,
        true // Enable debug timing
      )
      
      const endTime = performance.now()
      const totalTime = Math.round(endTime - startTime)
      
      // Get the latest performance metrics
      const latestMetrics = window.aiPerformanceMetrics[window.aiPerformanceMetrics.length - 1]
      
      // Add result to list
      testResults.value.unshift({
        timestamp: new Date().toLocaleTimeString(),
        model: testConfig.value.model,
        thinkingEnabled: testConfig.value.enableThinking,
        success: true,
        totalTime,
        apiTime: latestMetrics?.apiTime || Math.round(totalTime * 0.9),
        firstChunkTime: latestMetrics?.firstChunkTime || 0,
        responseLength: result.length,
        response: result,
        hasThoughts: latestMetrics?.hasThoughts || false,
        thoughtSummaries: latestMetrics?.thoughtSummaries || null,
        thoughtLength: latestMetrics?.thoughtLength || 0
      })
      
      console.log(`✅ AI Test Completed - ${totalTime}ms`)
      
    } catch (error) {
      console.error('❌ AI Test Error:', error)
      
      const endTime = performance.now()
      const totalTime = Math.round(endTime - startTime)
      
      testResults.value.unshift({
        timestamp: new Date().toLocaleTimeString(),
        model: testConfig.value.model,
        thinkingEnabled: testConfig.value.enableThinking,
        success: false,
        totalTime,
        apiTime: 0,
        firstChunkTime: 0,
        responseLength: 0,
        response: '',
        error: error.message,
        hasThoughts: false,
        thoughtSummaries: null,
        thoughtLength: 0
      })
    } finally {
      isRunning.value = false
    }
  }

  // Initialize on creation
  loadSavedApiKey()

  return {
    // Configuration
    testConfig,
    apiKey,
    apiStatus,
    
    // Test state
    testInput,
    testResults,
    isRunning,
    showAdvanced,
    
    // Computed
    canRunTest,
    performanceSummary,
    
    // Methods
    saveApiKey,
    loadPreset,
    getTimingColor,
    clearResults,
    runTest
  }
}