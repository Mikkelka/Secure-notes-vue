<template>
  <div class="h-full bg-gray-800/95 border-r border-gray-700/50 flex flex-col">
    <!-- Header -->
    <div class="p-4 border-b border-gray-700/50">
      <div class="flex items-center justify-between">
        <h2 class="text-sm font-medium text-white flex items-center gap-2">
          <FolderOpen class="w-4 h-4" />
          Mapper
        </h2>
        <button
          @click="showCreateForm = true"
          class="p-1 hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-white"
        >
          <Plus class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Create Folder Form -->
    <div
      v-if="showCreateForm"
      class="p-3 border-b border-gray-700/50 bg-gray-700/30"
    >
      <div class="space-y-2">
        <input
          v-model="newFolderName"
          type="text"
          placeholder="Mappenavn..."
          class="input-small text-xs px-2 py-1"
          @keypress.enter="handleCreateFolder"
          ref="folderNameInput"
        />
        <div class="flex gap-1 flex-wrap">
          <button
            v-for="color in folderColors"
            :key="color.name"
            @click="newFolderColor = color.name"
            :class="[
              'w-6 h-6 rounded border-2 transition-all',
              newFolderColor === color.name
                ? 'border-white'
                : 'border-transparent',
              color.class,
            ]"
          />
        </div>
        <div class="flex gap-1">
          <button
            @click="handleCreateFolder"
            :disabled="!newFolderName.trim()"
            class="flex-1 px-2 py-1 bg-green-600 text-white rounded hover:bg-green-500 transition-colors text-xs disabled:opacity-50"
          >
            Opret
          </button>
          <button
            @click="cancelCreateFolder"
            class="px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors text-xs"
          >
            Annuller
          </button>
        </div>
      </div>
    </div>

    <!-- Folders List -->
    <div class="flex-1 overflow-auto">
      <!-- Default folders -->
      <div class="p-2">
        <div
          v-for="folder in defaultFolders"
          :key="folder.id"
          :class="[
            'group flex items-center gap-2 p-2 mx-1 my-1 rounded cursor-pointer transition-all',
            props.selectedFolderId === folder.id
              ? 'bg-gray-700/80 text-white'
              : 'text-gray-300 hover:bg-gray-700/50 hover:text-white',
          ]"
          @click="handleFolderClick(folder.id)"
        >
          <div class="flex items-center gap-1 flex-shrink-0">
            <component :is="folder.icon" class="w-3 h-3" />
          </div>
          <span class="flex-1 text-xs font-medium truncate flex items-center gap-1">{{
            folder.name
          }}
            <Lock
              v-if="folder.id === 'secure'"
              class="w-2.5 h-2.5 text-gray-400"
            />
          </span>
          <span class="text-xs text-gray-500 px-1 min-w-[20px] text-right">
            {{ props.noteCounts[folder.id] || 0 }}
          </span>
        </div>
      </div>

      <!-- Custom folders -->
      <div v-if="props.folders.length > 0" class="p-2">
        <h3 class="text-xs font-medium text-gray-400 mb-2 px-1">Egne mapper</h3>
        <div
          v-for="folder in props.folders"
          :key="folder.id"
          :class="[
            'group flex items-center gap-2 p-2 mx-1 my-1 rounded cursor-pointer transition-all',
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
              class="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-gray-600 rounded text-red-400 hover:text-red-300"
            >
              <Trash2 class="w-3 h-3" />
            </button>
          </div>

          <span class="text-xs text-gray-500 px-1 min-w-[20px] text-right">
            {{ props.noteCounts[folder.id] || 0 }}
          </span>
        </div>
      </div>
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
