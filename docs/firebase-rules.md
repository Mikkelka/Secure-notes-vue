
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function til at checke auth
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function til at checke ejerskab
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    // Helper function til at validere note data
    function isValidNote() {
      return request.resource.data.keys().hasAll(['userId', 'encryptedContent', 'createdAt', 'updatedAt']) &&
             request.resource.data.userId is string &&
             request.resource.data.encryptedContent is string &&
             request.resource.data.createdAt is timestamp &&
             request.resource.data.updatedAt is timestamp;
    }
    
    // Helper function til at validere folder data (UPDATED to support both old and new formats)
    function isValidFolder() {
      // Check if folder has either 'name' (old format) or 'encryptedName' (new format)
      let hasValidName = request.resource.data.keys().hasAny(['name', 'encryptedName']) &&
                         ((request.resource.data.keys().hasAll(['name']) && request.resource.data.name is string) ||
                          (request.resource.data.keys().hasAll(['encryptedName']) && request.resource.data.encryptedName is string));
      
      return request.resource.data.keys().hasAll(['userId', 'color', 'createdAt', 'updatedAt']) &&
             hasValidName &&
             request.resource.data.userId is string &&
             request.resource.data.color is string &&
             request.resource.data.createdAt is timestamp &&
             request.resource.data.updatedAt is timestamp;
    }
    
    // Helper function til at validere userSettings data
    function isValidUserSettings() {
      return request.resource.data.keys().hasAll(['userId', 'encryptedSettings', 'updatedAt']) &&
             request.resource.data.userId is string &&
             request.resource.data.encryptedSettings is string &&
             request.resource.data.updatedAt is timestamp;
    }
    
    // Notes collection
    match /notes/{noteId} {
      // Læs: Kun hvis authenticated og ejer
      allow read: if isAuthenticated() && isOwner(resource.data.userId);
      
      // Opret: Kun hvis authenticated, data er valid, og userId matcher auth
      allow create: if isAuthenticated() && 
                      isValidNote() &&
                      request.resource.data.userId == request.auth.uid;
      
      // Opdater: Kun hvis authenticated, ejer, og userId ikke ændres
      allow update: if isAuthenticated() && 
                      isOwner(resource.data.userId) &&
                      request.resource.data.userId == resource.data.userId;
      
      // Slet: Kun hvis authenticated og ejer
      allow delete: if isAuthenticated() && isOwner(resource.data.userId);
    }
    
    // Folders collection
    match /folders/{folderId} {
      // Læs: Kun hvis authenticated og ejer
      allow read: if isAuthenticated() && isOwner(resource.data.userId);
      
      // Opret: Kun hvis authenticated, data er valid, og userId matcher auth
      allow create: if isAuthenticated() && 
                      isValidFolder() &&
                      request.resource.data.userId == request.auth.uid;
      
      // Opdater: Kun hvis authenticated, ejer, og userId ikke ændres
      allow update: if isAuthenticated() && 
                      isOwner(resource.data.userId) &&
                      request.resource.data.userId == resource.data.userId;
      
      // Slet: Kun hvis authenticated og ejer
      allow delete: if isAuthenticated() && isOwner(resource.data.userId);
    }
    
    // UserSettings collection - document ID er brugerens UID
    match /userSettings/{userId} {
      // Læs: Kun hvis authenticated og document ID matcher auth UID
      allow read: if isAuthenticated() && request.auth.uid == userId;
      
      // Opret/Opdater: Kun hvis authenticated, data er valid, userId matcher auth og document ID
      allow create, update: if isAuthenticated() && 
                              isValidUserSettings() &&
                              request.resource.data.userId == request.auth.uid &&
                              request.auth.uid == userId;
      
      // Slet: Kun hvis authenticated og document ID matcher auth UID
      allow delete: if isAuthenticated() && request.auth.uid == userId;
    }
    
    // Bloker alt andet
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
