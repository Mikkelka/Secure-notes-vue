- kald mig mikkel
- du kan ikke bruge npm run build, det er jeg nød til at gøre for dig
- undgaa unødvendige Bash tests - mikkel tester selv og giver fejl feedback. Brug kun Bash hvis vi er stuck

## Tailwind CSS @apply Best Practices

- ALTID refactor lange, gentagende Tailwind-klasser til @apply direktiver i src/style.css
- Brug semantiske klassenavne som beskriver komponenten/funktionen (f.eks. `btn-primary`, `input-base`, `header-btn-blue`)
- Gruppér relaterede @apply klasser sammen med kommentarer
- Prioriter @apply refactoring når du ser gentagelser af 5+ utility classes sammen
- Dette sparer tokens når Claude læser filer og gør koden mere vedligeholdelsesvenlig
- Hvis du ser lange klasser i filer vi måske har overset, så lav dem om proaktivt

## Communication Guidelines

- Når jeg har givet udtryk for, at vi er færdige med en implementering, må du gerne skrive [github kommentar] nederst i din respons