<template>
  <BaseDialog
    :is-open="isOpen"
    title="AI Performance Debug"
    size="3xl"
    @close="$emit('close')"
  >
    <div class="space-y-6">
      <!-- Test Configuration -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">
            Model
          </label>
          <select
            v-model="testConfig.model"
            class="w-full input-base"
          >
            <option value="gemini-2.5-flash-lite-preview-06-17">Gemini 2.5 Flash Lite (Fastest ~1s)</option>
            <option value="gemini-2.5-flash">Gemini 2.5 Flash (Standard ~9s)</option>
          </select>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">
            Thinking Budget
          </label>
          <select
            v-model="testConfig.thinkingBudget"
            class="w-full input-base"
          >
            <option value="-1">Dynamic (Auto)</option>
            <option value="0">None</option>
            <option value="1000">Limited (1000)</option>
          </select>
        </div>
      </div>

      <!-- Thought Summaries Option -->
      <div class="p-4 bg-green-900/20 border border-green-600/30 rounded-lg">
        <div class="flex items-center">
          <input
            id="includeThoughts"
            v-model="testConfig.includeThoughts"
            type="checkbox"
            class="w-4 h-4 text-green-600 bg-gray-700 border-gray-600 rounded focus:ring-green-500 focus:ring-2"
          />
          <label for="includeThoughts" class="ml-2 text-sm text-gray-300">
            Show Thought Summaries (includeThoughts)
          </label>
        </div>
        <p class="text-xs text-gray-400 mt-1">
          Reveals the model's internal reasoning process. May slightly impact performance.
        </p>
      </div>

      <!-- Performance Notes -->
      <div class="p-4 bg-blue-900/20 border border-blue-600/30 rounded-lg">
        <h4 class="text-sm font-medium text-blue-300 mb-2">AI Performance Optimization</h4>
        <div class="text-xs text-gray-400 space-y-1">
          <p><strong>Current:</strong> Streaming + systemInstruction optimization</p>
          <p><strong>Results:</strong> Flash-Lite ~1.1s, Standard Flash ~9.3s</p>
          <p><strong>Best:</strong> Gemini 2.5 Flash Lite with any thinking setting</p>
        </div>
      </div>
      

      <!-- Test Input -->
      <div>
        <label class="block text-sm font-medium text-gray-300 mb-2">
          Test Tekst
        </label>
        <textarea
          v-model="testInput"
          rows="4"
          placeholder="Skriv noget tekst her for at teste AI performance..."
          class="w-full input-base resize-none"
        />
      </div>

      <!-- Quick Test Buttons -->
      <div class="flex flex-wrap gap-2">
        <button
          v-for="preset in testPresets"
          :key="preset.name"
          @click="loadPreset(preset)"
          class="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300 transition-colors"
        >
          {{ preset.name }}
        </button>
      </div>

      <!-- Test Results -->
      <div v-if="testResults.length > 0" class="space-y-4">
        <h3 class="text-lg font-medium text-white">Test Resultater</h3>
        
        <div class="grid grid-cols-1 gap-3">
          <div
            v-for="(result, index) in testResults"
            :key="index"
            :class="[
              'p-4 rounded-lg border',
              result.success 
                ? 'bg-green-900/20 border-green-600/30' 
                : 'bg-red-900/20 border-red-600/30'
            ]"
          >
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <span :class="result.success ? 'text-green-400' : 'text-red-400'">
                  {{ result.success ? '✓' : '✗' }}
                </span>
                <span class="text-sm font-medium text-white">
                  {{ result.aiVersion }} - {{ result.model }}
                </span>
                <span class="text-xs text-gray-400">
                  T:{{ result.thinkingBudget === -1 ? 'Auto' : result.thinkingBudget === 0 ? 'None' : result.thinkingBudget }}
                  {{ result.configUsed ? `F:${result.configUsed.useFormatting ? 'Y' : 'N'} S:${result.configUsed.useSafety ? 'Y' : 'N'}` : '' }}
                </span>
              </div>
              <span class="text-sm font-mono" :class="getTimingColor(result.totalTime)">
                {{ result.totalTime }}ms
              </span>
            </div>
            
            <div class="grid grid-cols-3 gap-4 text-xs text-gray-400 mb-2">
              <div>Network: {{ result.networkTime }}ms</div>
              <div>Processing: {{ result.processingTime }}ms</div>
              <div>Response: {{ result.responseSize }} chars</div>
            </div>
            
            <!-- Thought Summaries Information -->
            <div v-if="result.configUsed?.includeThoughts" class="text-xs mb-2">
              <span class="text-blue-300">🧠 Thoughts:</span>
              <span :class="result.hasThoughts ? 'text-green-400' : 'text-gray-500'">
                {{ result.hasThoughts ? 'YES' : 'NO' }}
              </span>
              <span v-if="result.hasThoughts" class="text-gray-400 ml-2">
                ({{ result.thoughtLength }} chars)
              </span>
            </div>
            
            <div v-if="!result.success" class="text-sm text-red-400 mb-2">
              Error: {{ result.error }}
            </div>
            
            <details class="text-sm mb-2">
              <summary class="cursor-pointer text-gray-400 hover:text-white">
                Response Preview
              </summary>
              <div class="mt-2 p-2 bg-gray-800/50 rounded text-gray-300 max-h-32 overflow-y-auto">
                {{ result.response?.substring(0, 200) }}{{ result.response?.length > 200 ? '...' : '' }}
              </div>
            </details>
            
            <!-- Thought Summaries Display -->
            <details v-if="result.hasThoughts && result.thoughtSummaries" class="text-sm">
              <summary class="cursor-pointer text-blue-300 hover:text-blue-200">
                🧠 Thought Summaries ({{ result.thoughtLength }} chars)
              </summary>
              <div class="mt-2 p-2 bg-blue-900/20 border border-blue-600/30 rounded text-blue-100 max-h-48 overflow-y-auto whitespace-pre-wrap">
                {{ result.thoughtSummaries }}
              </div>
            </details>
          </div>
        </div>
      </div>

      <!-- Performance Summary -->
      <div v-if="performanceSummary" class="p-4 bg-blue-900/20 border border-blue-600/30 rounded-lg">
        <h4 class="text-sm font-medium text-blue-300 mb-2">Performance Summary</h4>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <span class="text-gray-400">Avg Total:</span>
            <span class="ml-1 font-mono text-white">{{ performanceSummary.avgTotal }}ms</span>
          </div>
          <div>
            <span class="text-gray-400">Avg Network:</span>
            <span class="ml-1 font-mono text-white">{{ performanceSummary.avgNetwork }}ms</span>
          </div>
          <div>
            <span class="text-gray-400">Fastest:</span>
            <span class="ml-1 font-mono text-green-400">{{ performanceSummary.fastest }}ms</span>
          </div>
          <div>
            <span class="text-gray-400">Slowest:</span>
            <span class="ml-1 font-mono text-red-400">{{ performanceSummary.slowest }}ms</span>
          </div>
        </div>
      </div>
    </div>
    
    <template #footer>
      <div class="flex justify-between">
        <button
          @click="clearResults"
          class="px-4 py-2 text-sm bg-gray-600 hover:bg-gray-500 rounded-lg text-white transition-colors"
          :disabled="testResults.length === 0"
        >
          Clear Results
        </button>
        
        <div class="flex gap-2">
          <button
            @click="runTest"
            :disabled="!canRunTest || isRunning"
            class="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded-lg text-white transition-colors flex items-center gap-2"
          >
            <span v-if="isRunning" class="animate-spin">⟳</span>
            {{ isRunning ? 'Testing...' : 'Run Test' }}
          </button>
          
          <BaseButton variant="secondary" @click="$emit('close')">
            Luk
          </BaseButton>
        </div>
      </div>
    </template>
  </BaseDialog>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import BaseDialog from '../base/BaseDialog.vue'
import BaseButton from '../base/BaseButton.vue'
import { processTextWithAi } from '../../services/aiService.js'
import { GoogleGenAI } from "@google/genai"

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  userSettings: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['close'])

const testConfig = ref({
  model: 'gemini-2.5-flash-lite-preview-06-17', // Default to fastest model
  thinkingBudget: -1, // Dynamic thinking
  useFormattingInstructions: true,
  useSafetySettings: true,
  includeThoughts: false // Show thought summaries
})

const testInput = ref('')
const testResults = ref([])
const isRunning = ref(false)

const testPresets = [
  {
    name: 'Short Text',
    content: 'Dette er en kort test tekst til AI performance måling.'
  },
  {
    name: 'Medium Text',
    content: `Dette er en mellemlang tekst til test af AI performance. 
    Den indeholder flere sætninger og skal give et godt billede af hvordan 
    AI'en performer med almindelig tekst længde. Vi kan bruge denne til at 
    måle både network latency og processing time.`
  },
  {
    name: 'Long Text',
    content: `Dette er en lang tekst til omfattende test af AI performance og processing capability.
    
    # Introduktion
    Denne tekst er designet til at teste AI systemets evne til at håndtere længere indhold med kompleks struktur og formatering.
    
    ## Hovedpunkter
    - Performance måling under høj belastning
    - Network latency vs processing time analyse
    - Response kvalitet ved længere input
    - Formaterings-præservering gennem hele processen
    
    ## Detaljeret Analyse
    Når vi tester AI performance, er det vigtigt at overveje flere faktorer:
    
    1. **Network Latency**: Tiden det tager at sende request og modtage response
    2. **Processing Time**: Tiden AI'en bruger på at processere indholdet
    3. **Response Quality**: Om kvaliteten af output påvirkes af performance optimering
    4. **Thinking Budget**: Hvordan påvirker different thinking budgets både hastighed og kvalitet
    
    Dette giver os mulighed for at identificere bottlenecks og optimere systemet accordingly.`
  }
]

const canRunTest = computed(() => {
  return testInput.value.trim().length > 0 && props.userSettings?.aiSettings?.apiKey
})

const performanceSummary = computed(() => {
  if (testResults.value.length === 0) return null
  
  const successfulResults = testResults.value.filter(r => r.success)
  if (successfulResults.length === 0) return null
  
  const totalTimes = successfulResults.map(r => r.totalTime)
  const networkTimes = successfulResults.map(r => r.networkTime)
  
  return {
    avgTotal: Math.round(totalTimes.reduce((a, b) => a + b, 0) / totalTimes.length),
    avgNetwork: Math.round(networkTimes.reduce((a, b) => a + b, 0) / networkTimes.length),
    fastest: Math.min(...totalTimes),
    slowest: Math.max(...totalTimes)
  }
})

const loadPreset = (preset) => {
  testInput.value = preset.content
}

const getTimingColor = (time) => {
  if (time < 2000) return 'text-green-400'
  if (time < 5000) return 'text-yellow-400'
  return 'text-red-400'
}


const runTest = async () => {
  if (!canRunTest.value || isRunning.value) return
  
  isRunning.value = true
  
  // Initialize performance metrics tracking if not already done
  if (!window.aiPerformanceMetrics) {
    window.aiPerformanceMetrics = []
  }
  
  const startTime = performance.now()
  
  try {
    // Create a mock userSettings object with current test config
    const mockUserSettings = {
      aiSettings: {
        ...props.userSettings.aiSettings,
        selectedModel: testConfig.value.model,
        includeThoughts: testConfig.value.includeThoughts
      }
    }
    
    console.log(`🧪 Starting AI Performance Test - ${testConfig.value.model}`)
    
    const result = await processTextWithAi(
      testInput.value,
      'Debug Test',
      mockUserSettings,
      true // Enable debug timing
    )
    
    const endTime = performance.now()
    const totalTime = Math.round(endTime - startTime)
    
    // Get the latest performance metrics entry that was just added
    const latestMetrics = window.aiPerformanceMetrics[window.aiPerformanceMetrics.length - 1]
    
    testResults.value.unshift({
      timestamp: new Date().toLocaleTimeString(),
      aiVersion: 'streaming+systemInstruction',
      model: testConfig.value.model,
      thinkingBudget: testConfig.value.thinkingBudget,
      success: true,
      totalTime,
      networkTime: latestMetrics ? latestMetrics.apiTime : Math.round(totalTime * 0.8), // Most time is in API call
      processingTime: latestMetrics ? (latestMetrics.setupTime + latestMetrics.promptTime + latestMetrics.processTime) : Math.round(totalTime * 0.2),
      responseSize: result.length,
      response: result,
      inputLength: testInput.value.length,
      detailedMetrics: latestMetrics || null,
      configUsed: {
        useFormatting: testConfig.value.useFormattingInstructions,
        useSafety: testConfig.value.useSafetySettings,
        includeThoughts: testConfig.value.includeThoughts
      },
      // Thought summaries information
      hasThoughts: latestMetrics?.hasThoughts || false,
      thoughtSummaries: latestMetrics?.thoughtSummaries || null,
      thoughtLength: latestMetrics?.thoughtLength || 0
    })
    
    console.log(`✅ AI Test completed in ${totalTime}ms`)
    
  } catch (error) {
    console.error('❌ AI Test Error:', error)
    
    const endTime = performance.now()
    const totalTime = Math.round(endTime - startTime)
    
    testResults.value.unshift({
      timestamp: new Date().toLocaleTimeString(),
      aiVersion: 'streaming+systemInstruction',
      model: testConfig.value.model,
      thinkingBudget: testConfig.value.thinkingBudget,
      success: false,
      totalTime,
      networkTime: 0,
      processingTime: 0,
      responseSize: 0,
      response: '',
      error: error.message,
      inputLength: testInput.value.length,
      detailedMetrics: null
    })
  } finally {
    isRunning.value = false
  }
}

const clearResults = () => {
  testResults.value = []
}

onMounted(() => {
  // Load default test text
  if (!testInput.value) {
    testInput.value = testPresets[1].content // Medium text as default
  }
  
  // Set model from user settings if available
  if (props.userSettings?.aiSettings?.selectedModel) {
    testConfig.value.model = props.userSettings.aiSettings.selectedModel
  }
})
</script>