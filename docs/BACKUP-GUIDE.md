# 📦 Simple Backup Guide

**For: Mikkel** | **Secure Notes App** | **Keep It Simple!**

## 🎯 **TL;DR**

1. **Klik Export knappen** i appen
2. **Download JSON filen** 
3. **Zip den med password** eller gem sikkert
4. **Færdig!** 🎉

---

## 💾 **Sådan laver du backup**

### **Step 1: Start appen**
```bash
npm run dev
```

### **Step 2: Eksporter**
1. Log ind normalt
2. Klik **"Export"** knappen (ved siden af Logout)
3. Indtast dit password
4. Download filen: `sikre-noter-backup-2025-06-05.json`

### **Step 3: Sikker opbevaring**
- **Zip med password:** `7-Zip` eller `WinRAR` med stærk adgangskode
- **Gem offline:** USB drive, ekstern disk
- **Flere kopier:** Forskellige steder

---

## 📄 **Hvad indeholder backup filen?**

```json
{
  "exportDate": "2025-06-05T15:30:00.000Z",
  "userId": "JSSlDgPhOATuVz4uPTx3KWmtV1l2",
  "notes": [
    {
      "id": "note123",
      "title": "Min første note",
      "content": "Dette kan jeg læse direkte!",
      "folderId": "folder456",
      "isFavorite": true,
      "createdAt": "2025-06-01T10:00:00.000Z"
    }
  ],
  "folders": [
    {
      "id": "folder456", 
      "name": "Arbejde",
      "color": "#3B82F6"
    }
  ],
  "metadata": {
    "notesCount": 15,
    "foldersCount": 3,
    "favoriteCount": 5
  }
}
```

**Alt er læsbart!** Du kan åbne filen i enhver teksteditor.

---

## 🔄 **Backup rutine**

### **Månedlig backup:**
- Eksporter ny fil første dag i måneden
- Overskriv gamle backup eller gem med dato

### **Før store ændringer:**
- Eksporter backup før du opdaterer appen
- Eksporter backup før du ændrer noget vigtigt

---

## 🛡️ **Sikkerhed**

### **Do's:**
- ✅ Zip backup med stærk password
- ✅ Gem offline (ikke cloud)
- ✅ Slet gamle backups efter nye er lavet
- ✅ Test at du kan åbne backup filen

### **Don'ts:**
- ❌ Gem backup i klartekst på delte mapper
- ❌ Send backup via email/chat
- ❌ Gem på samme computer som appen (hvis harddisk går i stykker)

---

## 📥 **Import Backup (Gendannelse)**

### **Hvornår skal du bruge import?**
- Skift af email/Firebase konto
- Migration fra en anden bruger
- Gendannelse efter data tab
- Kopiering af noter mellem konti

### **Sådan importerer du:**
1. **Start appen** og log ind med din nye/nuværende konto
2. **Klik Export knappen** → **"Importer noter fra backup fil?"**
3. **Vælg din backup JSON fil**
4. **Se preview** af data der importeres  
5. **Bekræft password** 
6. **Klik "Slet Alt og Importer"**

### **⚠️ VIGTIGT: Clean Slate Import**
- **SLETTER ALLE** eksisterende noter på nuværende konto
- **ERSTATTER** med noter fra backup filen
- **IKKE reversibel** - lav backup først hvis du har vigtige noter
- **Krypterer** backup data med din nuværende konto

### **Eksempel Use Cases:**

**Scenario 1: Skift af email**
```
1. Eksporter backup fra mikkel@gammel-email.com
2. Opret ny Firebase konto med mikkel@ny-email.com  
3. Log ind med ny konto → Import backup
4. Alle noter er nu tilgængelige på ny konto
```

**Scenario 2: Kopiering mellem brugere**
```
1. Person A eksporterer deres noter
2. Person B logger ind på deres konto
3. Person B importerer Person A's backup  
4. Person B har nu kopier af Person A's noter
```

---

## 💡 **Pro tips**

### **Test din backup:**
```bash
# Åbn backup filen for at se om den er læsbar
notepad sikre-noter-backup-2025-06-05.json
```

### **Automatisering (avanceret):**
```bash
# Du kan lave et script der automatisk zipper backup
powershell Compress-Archive -Path "sikre-noter-backup*.json" -DestinationPath "backup-$(Get-Date -Format 'yyyy-MM-dd').zip"
```

### **Multiple formater:**
- **JSON:** Kan importeres til andre systemer senere
- **TXT:** Konverter til ren tekst hvis nødvendigt
- **CSV:** Import til Excel/Google Sheets

---

## ✅ **Tjekliste**

**Jeg har:**
- [ ] Lavet min første backup via Export knappen
- [ ] Åbnet JSON filen og bekræftet jeg kan læse den
- [ ] Zippet backup filen med password
- [ ] Gemt backup sikkert offline
- [ ] Testet import funktionen (valgfrit - kun hvis du har test data)
- [ ] Forstået at import sletter eksisterende data
- [ ] Planlagt næste backup (anbefalet: månedligt)
- [ ] Testet at jeg kan finde backup filen igen

**Status: SIMPEL, PRAKTISK og KOMPLET** ✅

---

*Du bruger allerede andre krypterede tjenester, så du ved hvordan man passer på sensitive data. Denne backup metode passer perfekt til dit workflow!* 😊