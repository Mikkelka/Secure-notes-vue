<template>
  <div class="min-h-screen bg-gray-900 text-white p-4">
    <div class="max-w-4xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-purple-300 mb-2">Production-Realistic Performance Testing</h1>
        <p class="text-gray-400">Testing actual Note Organizer formatting tasks with production instructions</p>
        <div class="mt-4 p-4 bg-blue-900/20 border border-blue-600/30 rounded-lg">
          <p class="text-blue-300 text-sm">
            🧪 <strong>Production Testing</strong> - Raw text → structured HTML notes using actual app instructions
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

            <!-- Test Method Selection -->
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">Google Method</label>
              <select
                v-model="testMethod"
                class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="simple">Simple (response.text)</option>
                <option value="streaming">Streaming (chunk.text)</option>
              </select>
            </div>

            <!-- Fixed Test Content -->
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">Fixed Test Content</label>
              <div class="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-300 text-sm max-h-32 overflow-y-auto">
                {{ FIXED_TEST_CONTENT }}
              </div>
              <p class="text-xs text-gray-400 mt-1">Raw meeting notes that will be formatted to structured HTML</p>
            </div>

            <!-- Run Test Button -->
            <button
              @click="runTest"
              :disabled="!canRunTest || isRunning"
              class="w-full px-4 py-3 bg-green-600 hover:bg-green-500 disabled:opacity-50 rounded-lg text-white font-medium flex items-center justify-center gap-2"
            >
              <span v-if="isRunning" class="animate-spin">⟳</span>
              {{ isRunning ? 'Testing...' : `Run ${testMethod === 'streaming' ? 'Streaming' : 'Simple'} Test` }}
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
                <span class="text-gray-400">Method:</span>
                <span class="ml-1 text-purple-400">
                  {{ result.method?.includes('optimized') ? 'Standard Flash (Optimized)' : 
                     result.method?.includes('minimal') ? 'Flash-Lite (Minimal)' :
                     result.method?.includes('streaming') ? 'Production Streaming' : 'Production Simple' }}
                </span>
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
        <h4 class="text-lg font-semibold text-yellow-300 mb-3">Fixed Content Performance Testing</h4>
        <div class="text-yellow-200 text-sm space-y-2">
          <p>• <strong>Fixed Task:</strong> Same raw meeting notes → structured HTML every test</p>
          <p>• <strong>Production Instructions:</strong> Uses actual Note Organizer + HTML formatting rules</p>
          <p>• <strong>Standard Flash:</strong> Optimized config (thinkingBudget: 0, maxOutputTokens: 8192)</p>
          <p>• <strong>Flash-Lite:</strong> Minimal config for speed</p>
          <p>• <strong>Consistent Testing:</strong> No variables - pure model performance comparison</p>
          <p>• Check console for detailed performance logging</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAiTesting } from './composables/useAiTesting.js'

// Import ultra-minimal testing functionality
const {
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
} = useAiTesting()

// Utility methods
const getTimingColor = (time) => {
  if (time < 2000) return 'text-green-400'
  if (time < 5000) return 'text-yellow-400'
  return 'text-red-400'
}

// No need to set default content - using fixed test content
</script>