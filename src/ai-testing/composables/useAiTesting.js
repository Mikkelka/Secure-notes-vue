// Ultra-Minimal AI Testing Composable - Back to Basics
import { ref, computed } from 'vue'

export function useAiTesting() {
  // Minimal configuration - only essentials
  const apiKey = ref('')
  const selectedModel = ref('gemini-2.5-flash-lite-preview-06-17')
  const testResults = ref([])
  const isRunning = ref(false)

  // Thinking configuration (default: disabled for max speed)
  const enableThinking = ref(false)

  // Real-time streaming display
  const streamingChunks = ref([])
  const isStreaming = ref(false)
  const streamingText = ref('')

  // Thought summaries streaming display
  const thoughtStreamingChunks = ref([])
  const thoughtStreamingText = ref('')

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

  // API Key management with environment variable support (Google cookbook best practice)
  const saveApiKey = () => {
    if (apiKey.value.trim()) {
      localStorage.setItem('ai-test-api-key', apiKey.value.trim())
    }
  }

  const loadSavedApiKey = () => {
    // Check for environment variable first (Google cookbook recommendation)
    // In Vite, environment variables are accessed via import.meta.env
    const envApiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GOOGLE_API_KEY
    if (envApiKey) {
      apiKey.value = envApiKey
      console.log('🧪 Using API key from environment variable')
      return
    }
    
    // Fallback to localStorage
    const savedApiKey = localStorage.getItem('ai-test-api-key')
    if (savedApiKey) {
      apiKey.value = savedApiKey
      console.log('🧪 Using API key from localStorage')
    }
  }

  // Clear results
  const clearResults = () => {
    testResults.value = []
  }

  // Toggle thinking mode
  const toggleThinking = () => {
    enableThinking.value = !enableThinking.value
  }

  // Streaming display methods
  const clearStreamingDisplay = () => {
    streamingChunks.value = []
    streamingText.value = ''
    thoughtStreamingChunks.value = []
    thoughtStreamingText.value = ''
    isStreaming.value = false
  }

  const addStreamingChunk = (chunk) => {
    const timestamp = new Date().toLocaleTimeString()
    streamingChunks.value.push({
      text: chunk,
      timestamp,
      id: Date.now() + Math.random()
    })
    streamingText.value += chunk
  }

  const addThoughtStreamingChunk = (chunk) => {
    const timestamp = new Date().toLocaleTimeString()
    thoughtStreamingChunks.value.push({
      text: chunk,
      timestamp,
      id: Date.now() + Math.random()
    })
    thoughtStreamingText.value += chunk
  }

  const startStreaming = () => {
    clearStreamingDisplay()
    isStreaming.value = true
  }

  const stopStreaming = () => {
    isStreaming.value = false
  }

  // Main test execution - streaming only
  const runTest = async () => {
    if (!canRunTest.value || isRunning.value) return
    
    isRunning.value = true
    const startTime = performance.now()
    
    // Clear streaming display for new test
    clearStreamingDisplay()
    
    try {
      // Import AI service method
      const { processTextWithAi } = await import('../services/aiTestService.js')
      
      console.log(`🧪 Streaming Test Started - ${selectedModel.value}`)
      
      // Start streaming display
      startStreaming()
      
      // Run streaming test with fixed content (now with configurable thinking)
      const result = await processTextWithAi(
        FIXED_TEST_CONTENT,
        apiKey.value.trim(),
        selectedModel.value,
        addStreamingChunk, // Pass chunk handler for real-time display
        addThoughtStreamingChunk, // Pass thought chunk handler for real-time thought display
        enableThinking.value // Pass thinking toggle state
      )
      
      const endTime = performance.now()
      const totalTime = Math.round(endTime - startTime)
      
      // Get latest performance metrics from service
      const latestMetrics = window.aiPerformanceMetrics?.[window.aiPerformanceMetrics.length - 1]
      
      // Add result to list with token metrics and thought summaries
      testResults.value.unshift({
        timestamp: new Date().toLocaleTimeString(),
        model: selectedModel.value,
        method: enableThinking.value ? 'production-streaming-with-thoughts' : 'production-streaming',
        success: true,
        totalTime,
        responseLength: result.answer.length,
        response: result.answer,
        thoughtSummaries: result.thoughtSummaries,
        thoughtSummariesLength: result.thoughtSummaries.length,
        thinkingEnabled: enableThinking.value,
        // First chunk timing metrics (perceived performance)
        firstChunkTime: result.firstChunkTime,
        firstAnswerChunkTime: result.firstAnswerChunkTime,
        firstThoughtChunkTime: result.firstThoughtChunkTime,
        // Include token metrics from service
        inputTokens: latestMetrics?.inputTokens,
        tokenCountTime: latestMetrics?.tokenCountTime,
        tokensPerSecond: latestMetrics?.tokensPerSecond
      })
      
      console.log(`✅ Streaming Test Completed - ${totalTime}ms`)
      
      // Stop streaming display
      stopStreaming()
      
    } catch (error) {
      console.error(`❌ Google Streaming Test Error:`, error)
      
      // Stop streaming on error
      stopStreaming()
      
      const endTime = performance.now()
      const totalTime = Math.round(endTime - startTime)
      
      testResults.value.unshift({
        timestamp: new Date().toLocaleTimeString(),
        model: selectedModel.value,
        method: enableThinking.value ? 'production-streaming-with-thoughts' : 'production-streaming',
        success: false,
        totalTime,
        responseLength: 0,
        response: '',
        thoughtSummaries: '',
        thoughtSummariesLength: 0,
        thinkingEnabled: enableThinking.value,
        // First chunk timing metrics (will be null on error)
        firstChunkTime: null,
        firstAnswerChunkTime: null,
        firstThoughtChunkTime: null,
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
    enableThinking,
    
    // Test state  
    testResults,
    isRunning,
    
    // Test content
    FIXED_TEST_CONTENT,
    
    // Streaming display
    streamingChunks,
    isStreaming,
    streamingText,
    
    // Thought summaries streaming display
    thoughtStreamingChunks,
    thoughtStreamingText,
    
    // Computed
    canRunTest,
    performanceSummary,
    
    // Methods
    saveApiKey,
    clearResults,
    runTest,
    clearStreamingDisplay,
    toggleThinking
  }
}