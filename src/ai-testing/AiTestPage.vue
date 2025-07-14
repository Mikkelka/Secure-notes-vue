<template>
  <div class="min-h-screen bg-gray-900 text-white p-4">
    <div class="max-w-4xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-purple-300 mb-2">Ultra-Minimal AI Testing Lab</h1>
        <p class="text-gray-400">Back to basics - Google's minimal example with scientific testing</p>
        <div class="mt-4 p-4 bg-blue-900/20 border border-blue-600/30 rounded-lg">
          <p class="text-blue-300 text-sm">
            🧪 <strong>Clean Slate Testing</strong> - Zero optimizations, pure baseline performance
          </p>
        </div>
      </div>

      <!-- Configuration -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <!-- API Key -->
        <div class="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
          <h2 class="text-xl font-semibold mb-4">API Configuration</h2>
          <div class="space-y-3">
            <div>
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
              class="w-full px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded-lg text-white"
            >
              Save API Key
            </button>
          </div>
        </div>

        <!-- Model Selection & Test Input -->
        <div class="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
          <h2 class="text-xl font-semibold mb-4">Test Configuration</h2>
          
          <div class="space-y-4">
            <!-- Model Selection -->
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">AI Model</label>
              <select
                v-model="selectedModel"
                class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="gemini-2.5-flash-lite-preview-06-17">Flash Lite (Speed Optimized)</option>
                <option value="gemini-2.5-flash">Flash Standard (Reasoning)</option>
              </select>
            </div>

            <!-- Test Input -->
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">Test Input</label>
              <textarea
                v-model="testInput"
                rows="6"
                placeholder="Enter text to test AI performance..."
                class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              />
            </div>

            <!-- Test Presets -->
            <div class="flex flex-wrap gap-2">
              <button
                v-for="preset in testPresets"
                :key="preset.name"
                @click="testInput = preset.content"
                class="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded text-gray-300"
              >
                {{ preset.name }}
              </button>
            </div>

            <!-- Run Test Button -->
            <button
              @click="runTest"
              :disabled="!canRunTest || isRunning"
              class="w-full px-4 py-3 bg-green-600 hover:bg-green-500 disabled:opacity-50 rounded-lg text-white font-medium flex items-center justify-center gap-2"
            >
              <span v-if="isRunning" class="animate-spin">⟳</span>
              {{ isRunning ? 'Testing...' : 'Run Ultra-Minimal Test' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Test Results -->
      <div v-if="testResults.length > 0" class="mb-8">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-semibold">Baseline Performance Results</h3>
          <button
            @click="clearResults"
            class="px-3 py-1 text-sm bg-gray-600 hover:bg-gray-500 rounded text-white"
          >
            Clear Results
          </button>
        </div>

        <!-- Performance Summary -->
        <div v-if="performanceSummary" class="p-4 bg-blue-900/20 border border-blue-600/30 rounded-lg mb-4">
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

        <!-- Individual Results -->
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
                    {{ result.timestamp }}
                  </span>
                </div>
              </div>
              <span class="text-lg font-mono" :class="getTimingColor(result.totalTime)">
                {{ result.totalTime }}ms
              </span>
            </div>

            <!-- Response Info -->
            <div class="grid grid-cols-2 gap-4 text-sm mb-3">
              <div>
                <span class="text-gray-400">Response:</span>
                <span class="ml-1">{{ result.responseLength }} chars</span>
              </div>
              <div>
                <span class="text-gray-400">Type:</span>
                <span class="ml-1 text-purple-400">Ultra-Minimal</span>
              </div>
            </div>

            <!-- Error Display -->
            <div v-if="!result.success" class="text-red-400 text-sm mb-3">
              <strong>Error:</strong> {{ result.error }}
            </div>

            <!-- Response Preview -->
            <details class="text-sm">
              <summary class="cursor-pointer text-gray-400 hover:text-white">
                Response Preview ({{ result.responseLength }} chars)
              </summary>
              <div class="mt-2 p-3 bg-gray-800/50 rounded text-gray-300 max-h-40 overflow-y-auto">
                {{ result.response?.substring(0, 500) }}{{ result.response?.length > 500 ? '...' : '' }}
              </div>
            </details>
          </div>
        </div>
      </div>

      <!-- Instructions -->
      <div class="p-4 bg-yellow-900/20 border border-yellow-600/30 rounded-lg">
        <h4 class="text-lg font-semibold text-yellow-300 mb-3">Testing Instructions</h4>
        <div class="text-yellow-200 text-sm space-y-2">
          <p>• This is Google's minimal example - zero optimizations or configuration</p>
          <p>• Test both models with identical input to compare baseline performance</p>
          <p>• Check browser console for detailed timing logs</p>
          <p>• Results show pure AI model performance without interference</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAiTesting } from './composables/useAiTesting.js'
import { testPresets } from './data/testPresets.js'

// Import ultra-minimal testing functionality
const {
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
} = useAiTesting()

// Utility methods
const getTimingColor = (time) => {
  if (time < 2000) return 'text-green-400'
  if (time < 5000) return 'text-yellow-400'
  return 'text-red-400'
}

// Load default test text
if (!testInput.value) {
  testInput.value = testPresets[1].content // Medium text as default
}
</script>