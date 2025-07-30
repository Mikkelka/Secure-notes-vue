<template>
  <div class="min-h-screen bg-gray-900 text-white p-4">
    <div class="max-w-4xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-purple-300 mb-2">Real-Time Streaming AI Testing</h1>
        <p class="text-gray-400">Watch AI transform raw meeting notes into structured HTML in real-time</p>
        <div class="mt-4 p-4 bg-blue-900/20 border border-blue-600/30 rounded-lg">
          <p class="text-blue-300 text-sm">
            🧪 <strong>Live Streaming</strong> - Experience AI response chunks as they arrive with token metrics
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
              <p class="text-xs text-gray-400 mt-1">
                Supports VITE_GEMINI_API_KEY or VITE_GOOGLE_API_KEY environment variables
              </p>
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
                <option value="gemini-2.5-flash-lite">Flash Lite (Speed Optimized)</option>
                <option value="gemini-2.5-flash">Flash Standard (Reasoning)</option>
              </select>
            </div>

            <!-- Thinking Toggle -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="text-sm font-medium text-gray-300">🧠 AI Thinking Mode</label>
                <button
                  @click="toggleThinking"
                  :class="[
                    'px-3 py-1 rounded-full text-xs font-medium transition-colors',
                    enableThinking 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-600 text-gray-300'
                  ]"
                >
                  {{ enableThinking ? 'ON' : 'OFF' }}
                </button>
              </div>
              <div class="flex items-center gap-2">
                <button
                  @click="toggleThinking"
                  :class="[
                    'w-12 h-6 rounded-full p-1 transition-colors duration-200',
                    enableThinking ? 'bg-blue-600' : 'bg-gray-600'
                  ]"
                >
                  <div
                    :class="[
                      'icon-sm rounded-full bg-white transition-transform duration-200',
                      enableThinking ? 'translate-x-6' : 'translate-x-0'
                    ]"
                  />
                </button>
                <span class="text-sm text-gray-400">
                  {{ enableThinking ? 'Show AI reasoning process' : 'Max speed mode' }}
                </span>
              </div>
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
              {{ isRunning ? 'Streaming...' : 'Run Streaming Test' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Live Streaming Display -->
      <div v-if="isStreaming || streamingChunks.length > 0" class="mb-8">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-semibold text-green-400">Live Streaming Output</h3>
          <div class="flex items-center gap-3">
            <div v-if="isStreaming" class="flex items-center gap-2">
              <span class="animate-pulse w-2 h-2 bg-green-400 rounded-full"></span>
              <span class="text-sm text-green-400">Streaming...</span>
            </div>
            <button
              @click="clearStreamingDisplay"
              class="px-3 py-1 text-sm bg-gray-600 hover:bg-gray-500 rounded text-white"
            >
              Clear
            </button>
          </div>
        </div>

        <!-- Streaming Content -->
        <div class="p-4 bg-gray-800/50 border border-green-600/30 rounded-lg">
          <div class="mb-3 text-sm text-gray-400">
            <span>Chunks: {{ streamingChunks.length }}</span>
            <span class="ml-4">Characters: {{ streamingText.length }}</span>
          </div>
          
          <!-- Live streaming text display -->
          <div class="bg-gray-900 p-4 rounded-lg max-h-96 overflow-y-auto">
            <div v-if="streamingText.length === 0 && !isStreaming" class="text-gray-500 text-center py-8">
              Start a streaming test to see real-time output
            </div>
            <div v-else class="text-gray-200 text-sm leading-relaxed">
              <span v-for="chunk in streamingChunks" :key="chunk.id" class="inline">
                <span class="text-green-400 opacity-50">{{ chunk.text }}</span>
              </span>
              <span v-if="isStreaming" class="animate-pulse">▍</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Thought Summaries Display -->
      <div v-if="isStreaming || thoughtStreamingChunks.length > 0" class="mb-8">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-semibold text-blue-400">🧠 AI Thought Summaries</h3>
          <div class="flex items-center gap-3">
            <div v-if="isStreaming && thoughtStreamingText.length === 0" class="flex items-center gap-2">
              <span class="animate-pulse w-2 h-2 bg-blue-400 rounded-full"></span>
              <span class="text-sm text-blue-400">Waiting for thoughts...</span>
            </div>
            <div v-else-if="thoughtStreamingText.length > 0" class="flex items-center gap-2">
              <span class="w-2 h-2 bg-blue-400 rounded-full"></span>
              <span class="text-sm text-blue-400">{{ thoughtStreamingChunks.length }} thought chunks</span>
            </div>
          </div>
        </div>

        <!-- Thought Summaries Content -->
        <div class="p-4 bg-gray-800/50 border border-blue-600/30 rounded-lg">
          <div class="mb-3 text-sm text-gray-400">
            <span>Thought Chunks: {{ thoughtStreamingChunks.length }}</span>
            <span class="ml-4">Thought Characters: {{ thoughtStreamingText.length }}</span>
            <span class="ml-4 text-blue-400">AI's internal reasoning process</span>
          </div>
          
          <!-- Live thought summaries display -->
          <div class="bg-gray-900 p-4 rounded-lg max-h-96 overflow-y-auto">
            <div v-if="thoughtStreamingText.length === 0" class="text-gray-500 text-center py-8">
              <div class="text-blue-400 text-lg mb-2">🧠</div>
              <div>AI thought summaries will appear here when thinking is enabled</div>
              <div class="text-xs text-gray-400 mt-2">Thoughts show the AI's internal reasoning before providing the final answer</div>
            </div>
            <div v-else class="text-gray-200 text-sm leading-relaxed">
              <div class="mb-2 text-blue-400 text-xs font-medium">AI REASONING PROCESS:</div>
              <span v-for="chunk in thoughtStreamingChunks" :key="chunk.id" class="inline">
                <span class="text-blue-300 opacity-80">{{ chunk.text }}</span>
              </span>
              <span v-if="isStreaming && thoughtStreamingText.length > 0" class="animate-pulse text-blue-400">▍</span>
            </div>
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
                <span class="ml-1 text-purple-400">Production Streaming</span>
              </div>
              <div>
                <span class="text-gray-400">Thinking:</span>
                <span class="ml-1" :class="result.thinkingEnabled ? 'text-blue-400' : 'text-gray-400'">
                  {{ result.thinkingEnabled ? '🧠 ON' : '⚡ OFF' }}
                </span>
              </div>
            </div>

            <!-- First Chunk Timing (Perceived Performance) -->
            <div v-if="result.firstChunkTime" class="grid grid-cols-2 gap-4 text-sm mb-3 p-2 bg-green-900/20 border border-green-600/30 rounded">
              <div>
                <span class="text-green-400">⚡ First Chunk:</span>
                <span class="ml-1 font-mono text-white">{{ result.firstChunkTime }}ms</span>
              </div>
              <div>
                <span class="text-green-400">💬 First Answer:</span>
                <span class="ml-1 font-mono text-white">{{ result.firstAnswerChunkTime || 'N/A' }}ms</span>
              </div>
              <div v-if="result.thinkingEnabled && result.firstThoughtChunkTime" class="col-span-2">
                <span class="text-blue-400">🧠 First Thought:</span>
                <span class="ml-1 font-mono text-white">{{ result.firstThoughtChunkTime }}ms</span>
              </div>
            </div>

            <!-- Thought Summaries Info -->
            <div v-if="result.thinkingEnabled && (result.thoughtSummaries || result.thoughtSummariesLength !== undefined)" class="grid grid-cols-2 gap-4 text-sm mb-3 p-2 bg-blue-900/20 border border-blue-600/30 rounded">
              <div>
                <span class="text-blue-400">🧠 Thought Summaries:</span>
                <span class="ml-1 font-mono text-white">{{ result.thoughtSummariesLength || 0 }} chars</span>
              </div>
              <div>
                <span class="text-blue-400">Reasoning:</span>
                <span class="ml-1 text-blue-300">{{ result.thoughtSummaries && result.thoughtSummaries.length > 0 ? 'Available' : 'None' }}</span>
              </div>
            </div>

            <!-- Token Metrics -->
            <div v-if="result.inputTokens" class="grid grid-cols-3 gap-4 text-sm mb-3 p-2 bg-blue-900/20 border border-blue-600/30 rounded">
              <div>
                <span class="text-blue-400">Input Tokens:</span>
                <span class="ml-1 font-mono text-white">{{ result.inputTokens }}</span>
              </div>
              <div>
                <span class="text-blue-400">Token Count:</span>
                <span class="ml-1 font-mono text-white">{{ result.tokenCountTime }}ms</span>
              </div>
              <div>
                <span class="text-blue-400">Tokens/sec:</span>
                <span class="ml-1 font-mono text-green-400">{{ result.tokensPerSecond }}</span>
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

            <!-- Thought Summaries Preview -->
            <details v-if="result.thinkingEnabled && result.thoughtSummaries && result.thoughtSummaries.length > 0" class="text-sm mt-2">
              <summary class="cursor-pointer text-blue-400 hover:text-blue-300">
                🧠 Thought Summaries Preview ({{ result.thoughtSummariesLength }} chars)
              </summary>
              <div class="mt-2 p-3 bg-blue-900/20 border border-blue-600/30 rounded text-blue-200 max-h-40 overflow-y-auto">
                <div class="text-blue-400 text-xs font-medium mb-2">AI REASONING PROCESS:</div>
                {{ result.thoughtSummaries.substring(0, 500) }}{{ result.thoughtSummaries.length > 500 ? '...' : '' }}
              </div>
            </details>
          </div>
        </div>
      </div>

      <!-- Instructions -->
      <div class="p-4 bg-yellow-900/20 border border-yellow-600/30 rounded-lg">
        <h4 class="text-lg font-semibold text-yellow-300 mb-3">Real-Time Streaming AI Testing with Configurable Thinking</h4>
        <div class="text-yellow-200 text-sm space-y-2">
          <p>• <strong>Streaming Experience:</strong> Watch AI generate structured HTML in real-time</p>
          <p>• <strong>🧠 Thinking Toggle:</strong> Enable/disable AI reasoning process - compare performance!</p>
          <p>• <strong>⚡ Default Mode:</strong> Thinking OFF for maximum speed (both Flash and Flash-Lite)</p>
          <p>• <strong>🧠 Thinking Mode:</strong> Toggle ON to see AI's internal reasoning process</p>
          <p>• <strong>Production Task:</strong> Raw meeting notes → structured HTML with live formatting</p>
          <p>• <strong>⚡ First Chunk Timing:</strong> Shows when first response starts (perceived performance)</p>
          <p>• <strong>💬 First Answer:</strong> Time to first actual answer content</p>
          <p>• <strong>🧠 First Thought:</strong> Time to first reasoning chunk (when thinking enabled)</p>
          <p>• <strong>Token Metrics:</strong> Shows input tokens, processing time, and tokens/second</p>
          <p>• <strong>Performance Comparison:</strong> Test same model with/without thinking enabled</p>
          <p>• <strong>Live Display:</strong> Green panel for answers, blue panel for AI reasoning (when enabled)</p>
          <p>• <strong>Speed vs Insight:</strong> Choose between max speed or understanding the reasoning process</p>
          <p>• Toggle thinking to see how it affects both performance and insight!</p>
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
} = useAiTesting()

// Utility methods
const getTimingColor = (time) => {
  if (time < 2000) return 'text-green-400'
  if (time < 5000) return 'text-yellow-400'
  return 'text-red-400'
}

// No need to set default content - using fixed test content
</script>