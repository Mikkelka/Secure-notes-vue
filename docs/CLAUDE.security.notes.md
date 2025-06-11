# Sikkerhedsnoter - Auth System

## Nuværende Status (juni 2025)

### Current Implementation
Vi har implementeret simplified auth flow med localStorage-baseret session management:

**Google Login (Anbefalet - Højeste sikkerhed):**
- ✅ Bruger Google UID som krypteringspassword (deterministisk)
- ✅ Ingen bruger-defineret password stored
- ✅ Kun `loginType: 'google'` flag i localStorage
- ✅ Auto-regenerering af CryptoKey ved refresh

**Email/Password Login (Lavere sikkerhed):**
- ⚠️ Base64-encoded password i localStorage
- ⚠️ Potentiel risiko ved browser malware/fysisk adgang
- ✅ Auto-regenerering af CryptoKey ved refresh

### Sikkerhedsanalyse

**Sikkerhed bevaret:**
- End-to-end kryptering stadig intakt
- Firebase data kun encrypted
- Cross-site attacks kan ikke få localStorage
- Network intercept kan ikke få password

**Sikkerhedstab (Email login):**
- Browser malware kan læse password
- Fysisk adgang kan afsløre password
- Browser sync kan sprede password data

**Real-world vurdering:**
For personal notes app er tradeoffet acceptabelt pga.:
- Betydelig UX forbedring (ingen unlock screen)
- De fleste brugere har større security issues
- Browser security er generelt god

## Action Items for Færdig App

### Høj Prioritet
1. **Security audit** af localStorage approach
2. **Vurder password encryption** i localStorage (AES vs Base64)
3. **Implement auto-logout** på mistænkelig aktivitet
4. **Add security settings** - user choice mellem UX og sikkerhed

### Medium Prioritet  
5. **Browser fingerprinting** for at detektere kompromitterede sessions
6. **Option for session-only** (ingen localStorage) for paranoid users
7. **Security warnings** for email/password brugere

### Anbefalinger
- **Promover Google login** som primær login metode
- **Dokumenter sikkerhedsovervejelser** til brugere
- **Overvej enterprise tier** med højere sikkerhed senere

## Noter til Fremtidige Sikkerhedsreview

### Alternativer at undersøge:
1. **WebCrypto API** til password encryption i localStorage
2. **Session tokens** i stedet for passwords  
3. **Hardware security keys** support
4. **Biometric authentication** hvor tilgængeligt

### Testing checklist:
- [ ] Browser malware simulation
- [ ] Fysisk adgang scenarioer  
- [ ] Cross-browser security
- [ ] Mobile browser sikkerhed