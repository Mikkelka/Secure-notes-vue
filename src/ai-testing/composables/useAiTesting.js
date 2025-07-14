// Ultra-Minimal AI Testing Composable - Back to Basics
import { ref, computed } from 'vue'

export function useAiTesting() {
  // Minimal configuration - only essentials
  const apiKey = ref('')
  const selectedModel = ref('gemini-2.5-flash-lite-preview-06-17')
  const testInput = ref('')
  const testResults = ref([])
  const isRunning = ref(false)

  // Computed properties
  const canRunTest = computed(() => {
    return testInput.value.trim().length > 0 && apiKey.value.trim().length > 0
  })

  const performanceSummary = computed(() => {
    if (testResults.value.length === 0) return null
    
    const totalTimes = testResults.value.map(r => r.totalTime)
    
    return {
      avgTotal: Math.round(totalTimes.reduce((a, b) => a + b, 0) / totalTimes.length),
      fastest: Math.min(...totalTimes),
      slowest: Math.max(...totalTimes),
      totalTests: testResults.value.length
    }
  })

  // API Key management
  const saveApiKey = () => {
    if (apiKey.value.trim()) {
      localStorage.setItem('ai-test-api-key', apiKey.value.trim())
    }
  }

  const loadSavedApiKey = () => {
    const savedApiKey = localStorage.getItem('ai-test-api-key')
    if (savedApiKey) {
      apiKey.value = savedApiKey
    }
  }

  // Clear results
  const clearResults = () => {
    testResults.value = []
  }

  // Main test execution - ultra minimal
  const runTest = async () => {
    if (!canRunTest.value || isRunning.value) return
    
    isRunning.value = true
    const startTime = performance.now()
    
    try {
      // Import ultra-minimal AI service
      const { processTextWithAi } = await import('../services/aiTestService.js')
      
      console.log(`🧪 Ultra-Minimal Test Started - ${selectedModel.value}`)
      
      // Call minimal API - no complex configuration
      const result = await processTextWithAi(
        testInput.value,
        apiKey.value.trim(),
        selectedModel.value
      )
      
      const endTime = performance.now()
      const totalTime = Math.round(endTime - startTime)
      
      // Get latest performance metrics from service
      const latestMetrics = window.aiPerformanceMetrics?.[window.aiPerformanceMetrics.length - 1]
      
      // Add result to list
      testResults.value.unshift({
        timestamp: new Date().toLocaleTimeString(),
        model: selectedModel.value,
        success: true,
        totalTime,
        responseLength: result.length,
        response: result
      })
      
      console.log(`✅ Ultra-Minimal Test Completed - ${totalTime}ms`)
      
    } catch (error) {
      console.error('❌ Ultra-Minimal Test Error:', error)
      
      const endTime = performance.now()
      const totalTime = Math.round(endTime - startTime)
      
      testResults.value.unshift({
        timestamp: new Date().toLocaleTimeString(),
        model: selectedModel.value,
        success: false,
        totalTime,
        responseLength: 0,
        response: '',
        error: error.message
      })
    } finally {
      isRunning.value = false
    }
  }

  // Initialize
  loadSavedApiKey()

  return {
    // Configuration
    apiKey,
    selectedModel,
    
    // Test state
    testInput,
    testResults,
    isRunning,
    
    // Computed
    canRunTest,
    performanceSummary,
    
    // Methods
    saveApiKey,
    clearResults,
    runTest
  }
}