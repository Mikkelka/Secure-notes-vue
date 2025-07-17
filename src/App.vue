<template>
  <ErrorBoundary>
    <!-- Login Skærm -->
    <div v-if="!authStore.isLoggedIn">
      <LoginForm
        ref="loginFormRef"
        :loading="authStore.loading"
        @login="handleLogin"
        @register="handleRegister"
        @google-login="handleGoogleLogin"
      />
    </div>

    <!-- Hovedapplikation (når bruger er logget ind) -->
    <!-- ANBEFALING: Hele denne v-else blok kunne med fordel flyttes til sin egen komponent, f.eks. 'MainAppLayout.vue', for at holde denne fil mere simpel. -->
    <div
      v-else
      class="main-app-bg"
    >
      <!-- Header -->
      <Header
        :user="authStore.user"
        @logout="authStore.logout"
        @export="uiStore.openDataExport"
        @ai="uiStore.openAiModal"
        @settings="uiStore.openAppSettings"
      />

      <div class="flex pb-16 md:pb-0 md:h-[calc(100vh-4rem)]" >
        <!-- Desktop Sidebar -->
        <div class="hidden md:block w-64 flex-shrink-0">
          <FolderSidebar
            :folders="foldersStore.folders"
            :selected-folder-id="foldersStore.selectedFolderId"
            :note-counts="noteCounts"
            :locked-folders="foldersStore.lockedFolders"
            :user="authStore.user"
            @folder-select="handleFolderSelect"
            @folder-create="handleFolderCreate"
            @folder-update="handleFolderUpdate"
            @folder-delete="handleFolderDelete"
            @unlock-folder="handleUnlockFolder"
            @master-password-unlock="handleMasterPasswordUnlock"
          />
        </div>

        <!-- Mobile Sidebar Overlay -->
        <div
          v-if="uiStore.showMobileSidebar"
          class="fixed inset-0 z-40 md:hidden"
        >
          <div
            class="absolute inset-0 bg-black/50"
            @click="uiStore.closeMobileSidebar"
          />
          <div
            class="absolute left-0 top-16 bottom-0 w-64 transform translate-x-0 transition-transform"
          >
            <!-- REFAKTORERET: Bruger de samme handlers som desktop versionen -->
            <FolderSidebar
              :folders="foldersStore.folders"
              :selected-folder-id="foldersStore.selectedFolderId"
              :note-counts="noteCounts"
              :locked-folders="foldersStore.lockedFolders"
              :user="authStore.user"
              @folder-select="handleFolderSelect"
              @folder-create="handleFolderCreate"
              @folder-update="handleFolderUpdate"
              @folder-delete="handleFolderDelete"
              @unlock-folder="handleUnlockFolder"
              @master-password-unlock="handleMasterPasswordUnlock"
            />
          </div>
        </div>

        <div
          :class="[
            'flex-1 max-w-6xl transition-all duration-300',
            uiStore.selectedNote ? 'mr-[40%]' : '',
          ]"
        >
          <div
            class="h-full px-3 md:p-3 grid gap-4"
            :style="{
              gridTemplateColumns: getGridColumns,
            }"
          >
            <div class="space-y-4">
              <div class="hidden md:block">
                <QuickNote
                  :is-compact="!!uiStore.selectedNote"
                  @save="handleSaveNote"
                  @mode-change="handleQuickNoteMode"
                />
              </div>
              <div v-if="foldersStore.selectedFolderId === 'secure'" class="hidden md:block">
                <SettingsMenu
                  :locked-folders="foldersStore.lockedFolders"
                  @change-secure-pin="openChangePinDialog"
                  @lock-secure-folder="foldersStore.lockSecureFolder"
                />
              </div>
              <div v-if="settingsStore.settings.showPerformanceStats" class="hidden md:block">
                <PerformanceStats :stats="notesStore.performanceStats" />
              </div>
            </div>

            <div
              class="space-y-4 col-span-2 md:col-span-1 h-full overflow-hidden"
            >
              <div
                v-if="notesStore.loading"
                class="loading-container"
              >
                <Loader2
                  class="w-6 h-6 text-gray-400 mx-auto mb-3 animate-spin"
                />
                <h3 class="text-gray-300 text-base mb-1">
                  Henter dine noter...
                </h3>
                <p class="text-gray-500 text-sm">
                  Dekrypterer dine sikre noter
                </p>
              </div>
              <NotesList
                v-else
                :notes="filteredNotes"
                :search-term="notesStore.searchTerm"
                :selected-note-id="uiStore.selectedNote?.id"
                :selected-folder-id="foldersStore.selectedFolderId"
                @search-change="notesStore.setSearchTerm"
                @delete-note="notesStore.moveToTrash"
                @restore-note="notesStore.restoreNote"
                @permanent-delete-note="notesStore.permanentDeleteNote"
                @empty-trash="notesStore.emptyTrash"
                @note-click="handleNoteClick"
                @toggle-favorite="handleToggleFavorite"
                @move-note-to-folder="handleMoveNoteToFolder"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Note Viewer -->
      <NoteViewer
        v-if="uiStore.selectedNote"
        :note="uiStore.selectedNote"
        :user-settings="foldersStore.userSettings"
        @close="uiStore.closeNoteViewer"
        @update="handleViewerUpdate"
        @delete="handleViewerDelete"
        @toggle-favorite="handleToggleFavorite"
        @move-note-to-folder="handleMoveNoteToFolder"
      />

      <!-- Modals and Drawers -->
      <DataExport
        v-if="uiStore.showDataExport"
        :user="authStore.user"
        :notes="notesStore.allNotes"
        :folders="foldersStore.folders"
        @close="uiStore.closeDataExport"
        @open-import="uiStore.openImportData"
      />
      <ImportData
        v-if="uiStore.showImportData"
        :user="authStore.user"
        @close="uiStore.closeImportData"
        @import-complete="handleImportComplete"
      />
      <AiModal
        v-if="uiStore.showAiModal"
        :is-open="uiStore.showAiModal"
        :user-settings="foldersStore.userSettings"
        @close="uiStore.closeAiModal"
        @update-ai-settings="handleUpdateAiSettings"
      />
      <AppSettings
        :is-open="uiStore.showAppSettings"
        @close="uiStore.closeAppSettings"
      />

      <!-- Mobile Bottom Menu -->
      <MobileBottomMenu
        :active-button="uiStore.activeMobileButton"
        :show-settings="foldersStore.selectedFolderId === 'secure'"
        @folders-click="handleMobileFoldersClick"
        @add-note-click="handleMobileAddNoteClick"
        @search-click="handleMobileSearchClick"
        @settings-click="handleMobileSettingsClick"
      />

      <!-- Mobile Drawers -->
      <MobileSearchDrawer
        :is-open="uiStore.showMobileSearch"
        :search-term="notesStore.searchTerm"
        @close="uiStore.closeMobileSearch"
        @search-change="notesStore.setSearchTerm"
      />
      <MobileDrawer
        :is-open="uiStore.showMobileQuickNote"
        title="Ny Note"
        height="h-[90vh]"
        @close="handleMobileQuickNoteClose"
      >
        <QuickNote :is-compact="false" hide-title is-in-drawer @save="handleSaveNote" @mode-change="handleQuickNoteMode" />
      </MobileDrawer>
      <MobileDrawer
        v-if="foldersStore.selectedFolderId === 'secure'"
        :is-open="uiStore.showMobileSettings"
        title="Indstillinger"
        height="h-[50vh]"
        @close="uiStore.closeMobileSettings"
      >
        <SettingsMenu
          :locked-folders="foldersStore.lockedFolders"
          @change-secure-pin="openChangePinDialog"
          @lock-secure-folder="foldersStore.lockSecureFolder"
        />
      </MobileDrawer>

      <!-- Timeout og Dialoger -->
      <TimeoutWarning
        :show="authStore.showTimeoutWarning"
        @extend="authStore.extendSession"
        @logout="authStore.logout"
      />
      <BaseDialog
        :is-open="uiStore.folderConfirmDialog.isOpen"
        title="Slet mappe"
        show-default-actions
        confirm-text="Slet"
        cancel-text="Annuller"
        @confirm="handleConfirmFolderDelete"
        @cancel="uiStore.closeFolderConfirmDialog"
      >
        Er du sikker på at du vil slette denne mappe? Noter flyttes til
        Ukategoriseret.
      </BaseDialog>

      <!-- NY DIALOG: Erstatter window.prompt for at ændre PIN -->
      <BaseDialog
        :is-open="isChangePinDialogOpen"
        title="Ændr sikker PIN-kode"
        show-default-actions
        confirm-text="Gem"
        cancel-text="Annuller"
        @confirm="handleChangeSecurePin"
        @cancel="isChangePinDialogOpen = false"
      >
        <p class="text-sm text-gray-400 mb-2">
          Indtast din nye 4-cifrede PIN-kode.
        </p>
        <input
          v-model="newPinInput"
          type="password"
          maxlength="4"
          placeholder="••••"
          class="pin-input"
          @keyup.enter="handleChangeSecurePin"
        />
      </BaseDialog>
    </div>
  </ErrorBoundary>
</template>

<script setup>
import { computed, watch, onMounted, onUnmounted, ref } from "vue";
import { Loader2 } from "lucide-vue-next";

// Stores
import { useAuthStore } from "./stores/auth";
import { useNotesStore } from "./stores/notes";
import { useFoldersStore } from "./stores/folders";
import { useUIStore } from "./stores/ui";
import { useSettingsStore } from "./stores/settings";

// Components
import ErrorBoundary from "./components/ErrorBoundary.vue";
import LoginForm from "./components/auth/LoginForm.vue";
import Header from "./components/layout/Header.vue";
import FolderSidebar from "./components/layout/FolderSidebar.vue";
import MobileBottomMenu from "./components/layout/MobileBottomMenu.vue";
import MobileDrawer from "./components/layout/MobileDrawer.vue";
import MobileSearchDrawer from "./components/layout/MobileSearchDrawer.vue";
import QuickNote from "./components/notes/QuickNote.vue";
import NotesList from "./components/notes/NotesList.vue";
import NoteViewer from "./components/notes/NoteViewer.vue";
import PerformanceStats from "./components/notes/PerformanceStats.vue";
import SettingsMenu from "./components/settings/SettingsMenu.vue";
import TimeoutWarning from "./components/settings/TimeoutWarning.vue";
import DataExport from "./components/data/DataExport.vue";
import ImportData from "./components/data/ImportData.vue";
import AiModal from "./components/ai/AiModal.vue";
import AppSettings from "./components/settings/AppSettings.vue";
import BaseDialog from "./components/base/BaseDialog.vue";

// --- Store initialisering ---
const authStore = useAuthStore();
const notesStore = useNotesStore();
const foldersStore = useFoldersStore();
const uiStore = useUIStore();
const settingsStore = useSettingsStore();

// --- Template refs ---
const loginFormRef = ref(null);

// --- Lokal state (f.eks. til dialoger) ---
const isChangePinDialogOpen = ref(false);
const newPinInput = ref("");
const isQuickNoteAdvanced = ref(false);

// --- Computed properties ---
const filteredNotes = computed(() => {
  const selectedFolderId = foldersStore.selectedFolderId;
  // Brug den nye 'searchedAndSortedNotes' fra din store som base
  const baseNotes = notesStore.searchedAndSortedNotes;

  if (selectedFolderId === 'all') {
    return baseNotes.filter(note => note.folderId !== 'secure');
  }
  if (selectedFolderId === 'recent') {
    return notesStore.recentNotes;
  }
  if (selectedFolderId === 'uncategorized') {
    return baseNotes.filter(note => !note.folderId);
  }
  if (selectedFolderId === 'trash') {
    return notesStore.trashedNotes;
  }
  
  // Denne linje håndterer både 'secure' og alle specifikke mappe-ID'er
  return baseNotes.filter(note => note.folderId === selectedFolderId);
});

const noteCounts = computed(() => {
  return notesStore.getNoteCounts(foldersStore.folders);
});

const getGridColumns = computed(() => {
  if (uiStore.selectedNote) {
    // When note is selected, keep compact layout
    return isQuickNoteAdvanced.value ? '3fr 2fr' : '1fr 2fr';
  } else {
    // When no note selected, give QuickNote more space in advanced mode
    return isQuickNoteAdvanced.value ? '3fr 2fr' : '2fr 3fr';
  }
});

// --- Genindlæsning af data ---
const reloadAllData = async () => {
  if (authStore.user && authStore.encryptionKey) {
    try {
      await Promise.all([
        notesStore.loadNotes(authStore.user),
        foldersStore.loadFolders(authStore.user),
      ]);
    } catch (error) {
      console.error("❌ Fejl ved genindlæsning af data:", error);
    }
  }
};

// --- Auth Handlers ---
const handleLogin = async (email, password) => {
  const result = await authStore.handleLogin(email, password);
  if (result.success) loginFormRef.value?.clearForm();
  else loginFormRef.value?.setError(result.error);
};

const handleRegister = async (email, password) => {
  const result = await authStore.handleRegister(email, password);
  if (result.success) loginFormRef.value?.clearForm();
  else loginFormRef.value?.setError(result.error);
};

const handleGoogleLogin = async () => {
  const result = await authStore.handleGoogleLogin();
  if (!result.success) loginFormRef.value?.setError(result.error);
};

// --- Note Handlers ---
const handleNoteClick = (note) => {
  uiStore.setSelectedNote(note);
  notesStore.setEditingNote(null);
};

const handleSaveNote = async (title, content) => {
  const targetFolderId =
    ["all", "recent", "uncategorized"].includes(foldersStore.selectedFolderId)
      ? null
      : foldersStore.selectedFolderId;

  const success = await notesStore.saveNote(
    title, content, targetFolderId, authStore.user
  );

  if (success && uiStore.showMobileQuickNote) {
    handleMobileQuickNoteClose();
  }
  return success;
};

const handleViewerUpdate = async (noteId, title, content) => {
  const success = await notesStore.updateNote(
    noteId, title, content
  );
  if (success) {
    uiStore.setSelectedNote({
      ...uiStore.selectedNote,
      title, content, updatedAt: new Date(),
    });
  }
  return success;
};

const handleViewerDelete = async (noteId) => {
  const success = await notesStore.moveToTrash(noteId);
  if (success) uiStore.closeNoteViewer();
  return success;
};

const handleToggleFavorite = async (noteId) => {
  return await notesStore.toggleFavorite(noteId);
};

// --- Folder Move Handler ---
const handleMoveNoteToFolder = async (noteId, newFolderId) => {
  // Check if user has access to the target folder
  if (newFolderId === 'secure' && foldersStore.lockedFolders.has('secure')) {
    alert('Du skal først låse op for den sikre mappe');
    return false;
  }
  
  try {
    const success = await notesStore.moveNoteToFolder(noteId, newFolderId);
    
    if (success) {
      // Update selectedNote if it's the one being moved
      if (uiStore.selectedNote?.id === noteId) {
        uiStore.setSelectedNote({
          ...uiStore.selectedNote,
          folderId: newFolderId,
          updatedAt: new Date()
        });
      }
    }
    
    return success;
  } catch (error) {
    console.error('Fejl ved flytning af note:', error);
    alert('Kunne ikke flytte noten. Prøv igen.');
    return false;
  }
};

// --- Folder Handlers ---
const handleFolderCreate = (name, color) => {
  return foldersStore.createFolder(name, color, authStore.user);
};

const handleFolderUpdate = (folderId, name, color) => {
  return foldersStore.updateFolder(folderId, name, color, authStore.user);
};

const handleFolderDelete = (folderId) => {
  uiStore.openFolderConfirmDialog(folderId);
};

const handleConfirmFolderDelete = async () => {
  if (uiStore.folderConfirmDialog.folderId) {
    await foldersStore.deleteFolder(uiStore.folderConfirmDialog.folderId);
  }
  uiStore.closeFolderConfirmDialog();
};

// REFAKTORERET: Kombinerede handlers for desktop og mobil
const handleFolderSelect = (folderId) => {
  foldersStore.selectFolder(folderId);
  if (uiStore.showMobileSidebar) {
    uiStore.closeMobileSidebar();
  }
};

const handleUnlockFolder = async (folderId, pin) => {
  const success = await foldersStore.unlockFolder(folderId, pin);
  if (success && uiStore.showMobileSidebar) {
    uiStore.closeMobileSidebar();
  }
  return success;
};

const handleMasterPasswordUnlock = async (folderId, masterPassword) => {
  const success = await foldersStore.unlockWithMasterPassword(folderId, masterPassword, authStore.user);
  if (success && uiStore.showMobileSidebar) {
    uiStore.closeMobileSidebar();
  }
  return success;
};

// REFAKTORERET: Bruger dialog i stedet for window.prompt
const openChangePinDialog = () => {
  newPinInput.value = "";
  isChangePinDialogOpen.value = true;
};

const handleChangeSecurePin = async () => {
  if (newPinInput.value && /^\d{4}$/.test(newPinInput.value)) {
    const success = await foldersStore.changeSecurePin(
      newPinInput.value,
      authStore.user
    );
    if (success) {
      alert("PIN ændret succesfuldt!");
      isChangePinDialogOpen.value = false;
    } else {
      alert("Kunne ikke ændre PIN. Prøv igen.");
    }
  } else {
    alert("PIN skal være 4 cifre.");
  }
};

// --- AI Settings Handler ---
const handleUpdateAiSettings = async (newAiSettings) => {
  return await foldersStore.updateAiSettings(
    newAiSettings,
    authStore.user
  );
};

// --- Mobile UI Handlers ---
const handleMobileFoldersClick = () => {
  if (uiStore.showMobileQuickNote) notesStore.setEditingNote(null);
  uiStore.toggleMobileSidebar();
};

const handleMobileAddNoteClick = () => {
  if (uiStore.showMobileQuickNote) {
    uiStore.closeMobileQuickNote();
    notesStore.setEditingNote(null);
  } else {
    notesStore.setEditingNote({ title: "", content: "", isNew: true });
    uiStore.toggleMobileQuickNote();
  }
};

const handleMobileSearchClick = () => {
  if (uiStore.showMobileQuickNote) notesStore.setEditingNote(null);
  uiStore.toggleMobileSearch();
};

const handleMobileSettingsClick = () => {
  if (uiStore.showMobileQuickNote) notesStore.setEditingNote(null);
  uiStore.toggleMobileSettings();
};

const handleMobileQuickNoteClose = () => {
  uiStore.closeMobileQuickNote();
  notesStore.setEditingNote(null);
};

const handleQuickNoteMode = (isAdvanced) => {
  isQuickNoteAdvanced.value = isAdvanced;
};

// REFAKTORERET: Undgår hård genindlæsning af siden
const handleImportComplete = async () => {
  uiStore.closeImportData();
  await reloadAllData(); // Genindlæs data elegant
};


// --- Lifecycle & Watchers ---
let unsubscribeAuth = null;
let cleanupActivityListeners = null;

// Watch both user AND encryption key to avoid race condition
watch(
  [() => authStore.user, () => authStore.encryptionKey],
  async ([user, encryptionKey]) => {
    if (user && encryptionKey) {
      await reloadAllData();
    } else if (user && !encryptionKey) {
      // User is logged in but encryption key is missing - try recovery
      const recovered = await authStore.recoverEncryptionKey();
      if (recovered) {
        // Small delay to ensure Vue reactivity propagates
        await new Promise(resolve => setTimeout(resolve, 50));
        // Force reload data immediately after recovery
        await reloadAllData();
      } else {
        console.warn('Failed to recover encryption key');
      }
    } else if (!user) {
      notesStore.resetNotes();
      foldersStore.resetFolders();
    }
  },
  { immediate: true }
);

watch(
  () => authStore.encryptionKey,
  (newKey) => {
    if (newKey && !cleanupActivityListeners) {
      cleanupActivityListeners = authStore.setupActivityListeners();
    } else if (!newKey && cleanupActivityListeners) {
      cleanupActivityListeners();
      cleanupActivityListeners = null;
    }
  },
  { immediate: true }
);

onMounted(async () => {
  unsubscribeAuth = await authStore.initializeAuth();
});

onUnmounted(() => {
  if (unsubscribeAuth) unsubscribeAuth();
  if (cleanupActivityListeners) cleanupActivityListeners();
});
</script>