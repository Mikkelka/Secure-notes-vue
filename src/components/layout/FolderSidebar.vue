<template>
  <div class="h-full bg-gray-800/95 border-r border-gray-700/50 flex flex-col">
    <!-- Header -->
    <div class="p-4 border-b border-gray-700/50 flex items-center justify-between">
      <h2 class="text-sm font-medium text-white flex items-center gap-2">
        <FolderOpen class="w-4 h-4" />
        Mapper
      </h2>
      
      <!-- Desktop Plus Button -->
      <button
        @click="showCreateForm = !showCreateForm"
        class="hidden md:flex items-center justify-center w-6 h-6 rounded hover:bg-gray-700/50 text-gray-400 hover:text-green-400 transition-all duration-200"
        :title="showCreateForm ? 'Luk' : 'Opret ny mappe'"
      >
        <Plus class="w-4 h-4 transition-transform duration-200" :class="{ 'rotate-45': showCreateForm }" />
      </button>
    </div>

    <!-- Desktop Inline Create Form -->
    <div v-if="showCreateForm" class="hidden md:block p-4 bg-gray-800/60 border-b border-gray-700/50">
      <div class="space-y-3">
        <input
          v-model="newFolderName"
          type="text"
          placeholder="Mappenavn..."
          class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none text-sm"
          @keypress.enter="handleCreateFolder"
          @keydown.escape="cancelCreateFolder"
          ref="folderNameInput"
        />
        
        <!-- Color Picker -->
        <div class="flex gap-2">
          <div
            v-for="color in folderColors"
            :key="color.name"
            @click="newFolderColor = color.name"
            :class="[
              'w-6 h-6 rounded cursor-pointer border-2 transition-all',
              color.class,
              newFolderColor === color.name ? 'border-white scale-110' : 'border-transparent'
            ]"
          />
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-2">
          <button
            @click="handleCreateFolder"
            :disabled="!newFolderName.trim()"
            class="flex-1 px-3 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 text-white rounded text-sm font-medium transition-colors"
          >
            Opret
          </button>
          <button
            @click="cancelCreateFolder"
            class="px-3 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm transition-colors"
          >
            Annuller
          </button>
        </div>
      </div>
    </div>


    <!-- Folders List -->
    <div class="flex-1 overflow-auto scrollbar-hide">
      <!-- Default folders -->
      <div class="p-2">
        <div
          v-for="folder in defaultFolders"
          :key="folder.id"
          :class="[
            'group flex items-center gap-2 p-2 mx-1 my-1 rounded cursor-pointer transition-all min-h-[44px] touch-manipulation sm:gap-3 sm:p-3 sm:mx-2 sm:rounded-lg',
            props.selectedFolderId === folder.id
              ? 'bg-gray-700/80 text-white'
              : 'text-gray-300 hover:bg-gray-700/50 hover:text-white',
          ]"
          @click="handleFolderClick(folder.id)"
        >
          <div class="flex items-center gap-1 flex-shrink-0">
            <component :is="folder.icon" class="w-3 h-3 sm:w-4 sm:h-4" />
          </div>
          <span class="flex-1 text-xs font-medium truncate flex items-center gap-1 sm:text-sm">{{
            folder.name
          }}
            <Lock
              v-if="folder.id === 'secure'"
              class="w-2.5 h-2.5 text-gray-400 sm:w-3 sm:h-3"
            />
          </span>
          <span class="text-xs text-gray-500 px-1 min-w-[20px] text-right sm:text-sm sm:min-w-[24px]">
            {{ props.noteCounts[folder.id] || 0 }}
          </span>
        </div>
      </div>

      <!-- Custom folders -->
      <div v-if="props.folders.length > 0" class="p-2">
        <h3 class="text-[10px] font-medium text-gray-500 mb-1 px-1 uppercase tracking-wide">Egne mapper</h3>
        <div
          v-for="folder in props.folders"
          :key="folder.id"  
          :class="[
            'group flex items-center gap-2 p-2 mx-1 my-0.5 rounded cursor-pointer transition-all min-h-[40px] touch-manipulation',
            props.selectedFolderId === folder.id
              ? 'bg-gray-700/80 text-white'
              : 'text-gray-300 hover:bg-gray-700/50 hover:text-white',
          ]"
          @click="$emit('folderSelect', folder.id)"
        >
          <div class="flex items-center gap-1 flex-shrink-0">
            <div class="w-3 h-3 rounded" :class="getColorClass(folder.color)" />
          </div>
          <span class="flex-1 text-xs font-medium truncate">{{
            folder.name
          }}</span>

          <div class="flex items-center gap-0.5" @click.stop>
            <button
              @click="$emit('folderDelete', folder.id)"
              class="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-600 rounded text-red-400 hover:text-red-300"
            >
              <Trash2 class="w-3 h-3" />
            </button>
          </div>

          <span class="text-xs text-gray-500 px-1 min-w-[18px] text-right">
            {{ props.noteCounts[folder.id] || 0 }}
          </span>
        </div>
      </div>
    </div>

    <!-- Bottom Action Bar - Mobile only -->
    <div class="lg:hidden border-t border-gray-700/50 p-3 mb-14 bg-gray-800/95">
      <button
        @click="$emit('mobileCreateFolder')"
        class="w-full flex items-center justify-center gap-2 p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors font-medium text-sm min-h-[44px] touch-manipulation"
      >
        <Plus class="w-4 h-4" />
        Opret ny mappe
      </button>
    </div>

    <!-- PIN Prompt Modal for Secure Folder -->
    <PinInput
      v-if="showPinPrompt === 'secure'"
      :length="4"
      :user="user"
      @complete="handleUnlockFolder"
      @cancel="showPinPrompt = null"
      @master-password-unlock="handleMasterPasswordUnlock"
      title="Indtast PIN for Secure Folder"
      is-visible
      ref="pinInputRef"
    />
  </div>
</template>

<script setup>
import { computed, ref, nextTick, watch } from "vue";
import {
  FolderOpen,
  Archive,
  Shield,
  Plus,
  Trash2,
  Lock,
  Clock,
} from "lucide-vue-next";
import PinInput from "../base/PinInput.vue";

const props = defineProps({
  folders: {
    type: Array,
    default: () => [],
  },
  selectedFolderId: {
    type: String,
    default: "all",
  },
  noteCounts: {
    type: Object,
    default: () => ({}),
  },
  lockedFolders: {
    type: Set,
    default: () => new Set(),
  },
  user: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits([
  "folderSelect",
  "folderCreate",
  "folderUpdate",
  "folderDelete",
  "unlockFolder",
  "masterPasswordUnlock",
  "mobileCreateFolder",
]);

// Create folder form state
const showCreateForm = ref(false);
const newFolderName = ref("");
const newFolderColor = ref("blue");
const folderNameInput = ref(null);

// PIN prompt state
const showPinPrompt = ref(null);
const pinInputRef = ref(null);

// Folder colors like React version
const folderColors = [
  { name: "blue", class: "text-blue-400 bg-blue-500/20" },
  { name: "green", class: "text-green-400 bg-green-500/20" },
  { name: "purple", class: "text-purple-400 bg-purple-500/20" },
  { name: "red", class: "text-red-400 bg-red-500/20" },
  { name: "yellow", class: "text-yellow-400 bg-yellow-500/20" },
  { name: "pink", class: "text-pink-400 bg-pink-500/20" },
];

const defaultFolders = computed(() => [
  {
    id: "all",
    name: "Alle noter",
    icon: FolderOpen,
  },
  {
    id: "recent",
    name: "Seneste noter",
    icon: Clock,
  },
  {
    id: "uncategorized",
    name: "Ukategoriseret",
    icon: Archive,
  },
  {
    id: "secure",
    name: "Sikker mappe",
    icon: Shield,
  },
  {
    id: "trash",
    name: "Papirkurv",
    icon: Trash2,
  },
]);

const getColorClass = (color) => {
  const colorObj = folderColors.find((c) => c.name === color);
  return colorObj ? colorObj.class : "text-gray-400 bg-gray-500/20";
};

// Folder selection with PIN check
const handleFolderClick = async (folderId) => {
  if (folderId === "secure" && props.lockedFolders.has(folderId)) {
    showPinPrompt.value = folderId;
  } else {
    emit("folderSelect", folderId);
  }
};

// PIN unlock handlers
const handleUnlockFolder = async (pin) => {
  if (showPinPrompt.value && pin) {
    // Since Vue emit doesn't return values, we need to handle this differently
    // We'll emit the event and trust the parent to handle the unlock
    // and close the modal by checking if folder is unlocked
    emit("unlockFolder", showPinPrompt.value, pin);

    // Give the parent a moment to process the unlock
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Check if the folder is still locked
    if (!props.lockedFolders.has(showPinPrompt.value)) {
      // Folder was unlocked successfully
      showPinPrompt.value = null;
      return true;
    } else {
      // PIN was incorrect - show error first, then reset after delay
      pinInputRef.value?.setError("Forkert PIN. Prøv igen.");
      setTimeout(() => {
        pinInputRef.value?.resetPin();
      }, 1500); // Reset after 1.5 seconds so user can see the error
      return false;
    }
  }
  return true;
};

const handleMasterPasswordUnlock = async (masterPassword) => {
  if (showPinPrompt.value && masterPassword) {
    try {
      // Emit the master password unlock event
      emit("masterPasswordUnlock", showPinPrompt.value, masterPassword);

      // Give the parent a moment to process the unlock
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Check if the folder is still locked
      if (!props.lockedFolders.has(showPinPrompt.value)) {
        // Folder was unlocked successfully
        showPinPrompt.value = null;
        return true;
      } else {
        // Master password was incorrect
        pinInputRef.value?.setError("Forkert hovedadgangskode. Prøv igen.");
        return false;
      }
    } catch {
      // Error is caught, but not logged to console
      return false;
    }
  }
  return false;
};

const handleCreateFolder = async () => {
  if (newFolderName.value.trim()) {
    emit("folderCreate", newFolderName.value.trim(), newFolderColor.value);
    newFolderName.value = "";
    newFolderColor.value = "blue";
    showCreateForm.value = false;
  }
};

const cancelCreateFolder = () => {
  showCreateForm.value = false;
  newFolderName.value = "";
  newFolderColor.value = "blue";
};

// Auto-focus input when form opens
const showCreateFormWatcher = () => {
  if (showCreateForm.value) {
    nextTick(() => {
      folderNameInput.value?.focus();
    });
  }
};

// Watch for form visibility changes
watch(showCreateForm, showCreateFormWatcher);
</script>
