<template>
  <div class="min-h-screen bg-gray-900 text-white p-4">
    <div class="max-w-6xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-purple-300 mb-2">AI Performance Testing Lab</h1>
        <p class="text-gray-400">Isolated testing environment for AI performance optimization</p>
        <div class="mt-4 p-4 bg-yellow-900/20 border border-yellow-600/30 rounded-lg">
          <p class="text-yellow-300 text-sm">
            🧪 <strong>Test Environment</strong> - This page is isolated from the main app for safe testing
          </p>
        </div>
      </div>

      <!-- API Key Setup -->
      <div class="mb-8 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
        <h2 class="text-xl font-semibold mb-4">API Configuration</h2>
        <div class="flex gap-3 items-end">
          <div class="flex-1">
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Google AI API Key
            </label>
            <input
              v-model="apiKey"
              type="password"
              placeholder="Enter your API key..."
              class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <button
            @click="saveApiKey"
            :disabled="!apiKey.trim()"
            class="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded-lg text-white"
          >
            Save
          </button>
        </div>
        <p v-if="apiStatus.message" :class="[
          'text-sm mt-2',
          apiStatus.type === 'success' ? 'text-green-400' : 'text-red-400'
        ]">
          {{ apiStatus.message }}
        </p>
      </div>

      <!-- Test Configuration -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <!-- Model & Thinking Settings -->
        <div class="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
          <h3 class="text-lg font-semibold mb-4">Model Configuration</h3>
          
          <div class="space-y-4">
            <!-- Model Selection -->
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">AI Model</label>
              <select
                v-model="testConfig.model"
                class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="gemini-2.5-flash-lite-preview-06-17">Gemini 2.5 Flash Lite (~1s)</option>
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (~15s)</option>
              </select>
            </div>

            <!-- Universal Thinking Toggle -->
            <div class="p-3 bg-gray-700/30 rounded-lg border border-gray-600/50">
              <div class="flex items-center justify-between mb-2">
                <div>
                  <label class="block text-sm font-medium text-gray-300">
                    Enable AI Thinking
                  </label>
                  <p class="text-xs text-gray-400">
                    Flash-Lite: ~1s (off) vs ~4s (on)<br>
                    Standard Flash: ~15s (shows thoughts when on)
                  </p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input
                    v-model="testConfig.enableThinking"
                    type="checkbox"
                    class="sr-only peer"
                  />
                  <div class="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
              <div class="text-xs">
                <span :class="!testConfig.enableThinking ? 'text-green-400 font-medium' : 'text-gray-500'">
                  ⚡ Pure Speed
                </span>
                <span class="text-gray-400 mx-2">|</span>
                <span :class="testConfig.enableThinking ? 'text-purple-400 font-medium' : 'text-gray-500'">
                  🧠 Thinking Enabled
                </span>
              </div>
            </div>

            <!-- Advanced Thinking Controls (for debug) -->
            <div v-if="showAdvanced" class="p-3 bg-blue-900/20 rounded-lg border border-blue-600/30">
              <h4 class="text-sm font-medium text-blue-300 mb-2">Advanced Controls</h4>
              <div class="space-y-2">
                <div>
                  <label class="block text-xs text-gray-400 mb-1">Thinking Budget</label>
                  <select
                    v-model="testConfig.thinkingBudget"
                    class="w-full px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded"
                  >
                    <option value="-1">Dynamic (Auto)</option>
                    <option value="0">None</option>
                    <option value="1000">Limited (1000)</option>
                    <option value="2000">Extended (2000)</option>
                  </select>
                </div>
                <div class="flex items-center">
                  <input
                    v-model="testConfig.includeThoughts"
                    type="checkbox"
                    class="w-3 h-3 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <label class="ml-2 text-xs text-gray-300">
                    Force includeThoughts (debug)
                  </label>
                </div>
              </div>
            </div>

            <button
              @click="showAdvanced = !showAdvanced"
              class="text-xs text-gray-400 hover:text-gray-300"
            >
              {{ showAdvanced ? 'Hide' : 'Show' }} Advanced Controls
            </button>
          </div>
        </div>

        <!-- Test Input -->
        <div class="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
          <h3 class="text-lg font-semibold mb-4">Test Input</h3>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">Test Text</label>
              <textarea
                v-model="testInput"
                rows="8"
                placeholder="Enter text to test AI performance..."
                class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              />
            </div>

            <!-- Quick Presets -->
            <div class="flex flex-wrap gap-2">
              <button
                v-for="preset in testPresets"
                :key="preset.name"
                @click="loadPreset(preset)"
                class="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded text-gray-300"
              >
                {{ preset.name }}
              </button>
            </div>

            <!-- Run Test Button -->
            <button
              @click="runTest"
              :disabled="!canRunTest || isRunning"
              class="w-full px-4 py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded-lg text-white font-medium flex items-center justify-center gap-2"
            >
              <span v-if="isRunning" class="animate-spin">⟳</span>
              {{ isRunning ? 'Testing...' : 'Run AI Test' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Test Results -->
      <div v-if="testResults.length > 0" class="mb-8">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-semibold">Test Results</h3>
          <button
            @click="clearResults"
            class="px-3 py-1 text-sm bg-gray-600 hover:bg-gray-500 rounded text-white"
          >
            Clear Results
          </button>
        </div>

        <div class="space-y-4">
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
            <!-- Result Header -->
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-3">
                <span :class="result.success ? 'text-green-400' : 'text-red-400'">
                  {{ result.success ? '✓' : '✗' }}
                </span>
                <div>
                  <span class="font-medium">{{ result.model }}</span>
                  <span class="text-xs text-gray-400 ml-2">
                    Thinking: {{ result.thinkingEnabled ? 'ON' : 'OFF' }}
                  </span>
                </div>
              </div>
              <span class="text-lg font-mono" :class="getTimingColor(result.totalTime)">
                {{ result.totalTime }}ms
              </span>
            </div>

            <!-- Performance Metrics -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
              <div>
                <span class="text-gray-400">API Time:</span>
                <span class="ml-1 font-mono">{{ result.apiTime }}ms</span>
              </div>
              <div>
                <span class="text-gray-400">First Chunk:</span>
                <span class="ml-1 font-mono">{{ result.firstChunkTime }}ms</span>
              </div>
              <div>
                <span class="text-gray-400">Response:</span>
                <span class="ml-1">{{ result.responseLength }} chars</span>
              </div>
              <div>
                <span class="text-gray-400">Thoughts:</span>
                <span :class="result.hasThoughts ? 'text-purple-400' : 'text-gray-500'">
                  {{ result.hasThoughts ? 'YES' : 'NO' }}
                </span>
              </div>
            </div>

            <!-- Error Display -->
            <div v-if="!result.success" class="text-red-400 text-sm mb-3">
              <strong>Error:</strong> {{ result.error }}
            </div>

            <!-- Response Preview -->
            <details class="text-sm mb-3">
              <summary class="cursor-pointer text-gray-400 hover:text-white">
                Response Preview ({{ result.responseLength }} chars)
              </summary>
              <div class="mt-2 p-3 bg-gray-800/50 rounded text-gray-300 max-h-40 overflow-y-auto">
                {{ result.response?.substring(0, 500) }}{{ result.response?.length > 500 ? '...' : '' }}
              </div>
            </details>

            <!-- Thought Summaries -->
            <details v-if="result.hasThoughts && result.thoughtSummaries" class="text-sm">
              <summary class="cursor-pointer text-purple-300 hover:text-purple-200">
                🧠 Thought Summaries ({{ result.thoughtLength }} chars)
              </summary>
              <div class="mt-2 p-3 bg-purple-900/20 border border-purple-600/30 rounded text-purple-100 max-h-48 overflow-y-auto whitespace-pre-wrap">
                {{ result.thoughtSummaries }}
              </div>
            </details>
          </div>
        </div>
      </div>

      <!-- Performance Summary -->
      <div v-if="performanceSummary" class="p-4 bg-blue-900/20 border border-blue-600/30 rounded-lg">
        <h4 class="text-lg font-semibold text-blue-300 mb-3">Performance Summary</h4>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span class="text-gray-400">Average:</span>
            <span class="ml-1 font-mono text-white">{{ performanceSummary.avgTotal }}ms</span>
          </div>
          <div>
            <span class="text-gray-400">Fastest:</span>
            <span class="ml-1 font-mono text-green-400">{{ performanceSummary.fastest }}ms</span>
          </div>
          <div>
            <span class="text-gray-400">Slowest:</span>
            <span class="ml-1 font-mono text-red-400">{{ performanceSummary.slowest }}ms</span>
          </div>
          <div>
            <span class="text-gray-400">Tests:</span>
            <span class="ml-1 font-mono text-white">{{ performanceSummary.totalTests }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAiTesting } from './composables/useAiTesting.js'
import { testPresets } from './data/testPresets.js'

// Import AI testing functionality
const {
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
} = useAiTesting()

// Load default test text
onMounted(() => {
  if (!testInput.value) {
    testInput.value = testPresets[1].content // Medium text as default
  }
})
</script>