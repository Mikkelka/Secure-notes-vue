// Ultra-Minimal AI Testing Composable - Back to Basics
import { ref, computed } from 'vue'

export function useAiTesting() {
  // Minimal configuration - only essentials
  const apiKey = ref('')
  const selectedModel = ref('gemini-2.5-flash-lite-preview-06-17')
  const testMethod = ref('simple') // 'simple' or 'streaming'
  const testResults = ref([])
  const isRunning = ref(false)

  // Fixed test content - raw unstructured text for consistent formatting testing
  const FIXED_TEST_CONTENT = `møde om projekt status idag kl 14. deltagere: mig, sarah fra design, mikkel tech lead, anna fra product. 

sarah viste nye mockups for dashboard meget flotte men vi mangler data integration. mikkel siger backend api klar næste uge. anna bekymret om deadline fredag kan vi nå det?

vigtige punkter: frontend næsten færdig, sarah arbejder på responsive design, database migration skal testes før deploy, anna tager kontakt til kunde om potentiel utsættelse

næste skridt: mikkel færdiggør api dokumentation, jeg laver integration tests, sarah tester på mobile devices, mødes igen torsdag for final review

deadline stress men team confident. kunde har været tålmodig hidtil.

tekniske detaljer diskuteret: database performance issues med user queries, sarah foreslog ny caching strategy med redis. mikkel bekymret om server kapacitet hvis vi får flere kunder samtidig. anna vil have load testing før launch.

budget status: brugt 73% af allocated resources, 2 uger tilbage til deadline. extra udvikler måske nødvendig for mobile app hvis timeline skal holdes. client har været understanding omkring små delays.

security review: peter fandt 3 vulnerabilities i auth system, ikke critical men skal fixes. password reset flow needs work. sarah siger frontend validation kan forbedres. alle issues logged i jira.

next sprint planning: focus på critical bugs først, performance optimizations hvis tid tillader det. maria joins team næste uge som QA tester. demo til kunde er planlagt fredag hvis alt går som forventet.

risici identificeret: third party payment api har været ustabil sidste uge, backup plan needed. christmas vacation period kan påvirke support. deployment pipeline skal testes mere grundigt før production release.`

  // Computed properties
  const canRunTest = computed(() => {
    return apiKey.value.trim().length > 0
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
      // Import AI service methods
      const { processTextWithAi, processTextWithAiStreaming } = await import('../services/aiTestService.js')
      
      const method = testMethod.value === 'streaming' ? 'streaming' : 'simple'
      console.log(`🧪 Google ${method} Test Started - ${selectedModel.value}`)
      
      // Choose method based on selection - using fixed test content
      const result = testMethod.value === 'streaming' 
        ? await processTextWithAiStreaming(
            FIXED_TEST_CONTENT,
            apiKey.value.trim(),
            selectedModel.value
          )
        : await processTextWithAi(
            FIXED_TEST_CONTENT,
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
        method: testMethod.value === 'streaming' ? 'google-official-streaming' : 'google-official-simple',
        success: true,
        totalTime,
        responseLength: result.length,
        response: result
      })
      
      console.log(`✅ Google ${method} Test Completed - ${totalTime}ms`)
      
    } catch (error) {
      console.error(`❌ Google ${testMethod.value} Test Error:`, error)
      
      const endTime = performance.now()
      const totalTime = Math.round(endTime - startTime)
      
      testResults.value.unshift({
        timestamp: new Date().toLocaleTimeString(),
        model: selectedModel.value,
        method: testMethod.value === 'streaming' ? 'google-official-streaming' : 'google-official-simple',
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
    testMethod,
    
    // Test state  
    testResults,
    isRunning,
    
    // Test content
    FIXED_TEST_CONTENT,
    
    // Computed
    canRunTest,
    performanceSummary,
    
    // Methods
    saveApiKey,
    clearResults,
    runTest
  }
}