# Orbit 0.30 - Żądło

Kolejny etap szybkich specjalizacji floty po Widmie. Żądło ma własny identyfikator `stinger` i nie zastępuje istniejącego kadłuba. Feniks pozostaje kolejnym konceptem.

## Rola i balans

Glass cannon ze smukłym nieuzbrojonym dziobem, szerokimi rozwidlonymi skrzydłami inspirowanymi układem X, dwoma silnikami, jasnoniebieskim kokpitem i żółtozielonymi oznaczeniami. Cztery działka: po dwa na każdym skrzydle, wszystkie domyślnie skierowane do przodu. Model i fizyczny hitbox uwzględniają większą rozpiętość. Grafika powstaje z figur Pixi i korzysta ze wspólnego systemu mocowań.

- Kadłub: 55 HP; tarcza: 20, regeneracja 7/s po 5 s bez trafienia.
- Ładownia: 20; brak lasera wydobywczego.
- Prędkość: 680; skręt: 2,85; ciąg: 1650; hamowanie: 1000; boost: ×1,95.
- LPM: salwa czterech lekkich pocisków co 0,24 s. Bazowo 8 obrażeń na pocisk; przeciw lekkiemu patrolowi ×1,5 (12), przeciw ciężkiemu Lancerowi ×0,4 (3,2). Prędkość 1250, czas lotu 0,9 s.
- PPM: salwa czterech przeciwpancernych pocisków co 0,4 s. Bazowo 12 obrażeń na pocisk; przeciw lekkiemu patrolowi ×0,45 (5,4), przeciw ciężkiemu Lancerowi ×1,5 (18). Prędkość 1500, czas lotu 1 s; odrębny ciężki wygląd pocisków i dźwięk.
- Wspólny cykl ognia zapobiega dodatkowej salwie przy przełączeniu. Przy obu przyciskach PPM ma pierwszeństwo. Przytrzymanie powtarza salwy; pauza zatrzymuje cykl.
- Jeden chwytak o zasięgu 140. Brak lasera; pociski mają zwykłą niską skuteczność przeciw skałom.
- Brak kamuflażu, także pod C. Specjalizacją jest szybki otwarty atak, nie ukrywanie się jak na Widmie.
- Cena: 165 rudy / 14 komponentów; wymagany warsztat II. Wartości są roboczym balansem, nie obowiązkowymi liczbami z referencji.

Żądło jest szybsze i zwrotniejsze od Widma, ale nie ma jego ukrycia. Ma znacznie słabszą tarczę niż Bastion oraz mniejszą ładownię i wydajność wydobycia niż statki użytkowe. Zachowuje standardowy pojedynczy hol.

## Integracja i zapis

Stocznia automatycznie pokazuje dziesiąty typ na drugiej stronie. Limit posiadanej floty pozostaje równy sześć. Uzbrojenie Żądła jest stałe; montaż zwykłych działek jest zablokowany. Dawny moduł lasera staje się układem amunicji: +25% do obrażeń obu trybów na poziom. Prototyp działek również wzmacnia obie amunicje. Poziomy modułów i wcześniejsze zakupione bronie pozostają zapisane bez kasowania. Format kampanii pozostaje 15; stare kampanie nie wymagają migracji ani zmiany identyfikatorów. HUD i panel pokładu pokazują dwa rodzaje pocisków.

## Weryfikacja

Testy w istniejących zestawach obejmują wymaganie warsztatu, koszt zakupu, zachowanie zapisu i ulepszeń, cztery widoczne mocowania, oba rodzaje salw, brak lasera, obrażenia przeciw patrolowi i Lancerowi, priorytet PPM i wspólny cykl ognia. Test wspólnego katalogu obejmuje zakup i zapis wszystkich dziesięciu kadłubów oraz niezmieniony limit floty.

Kontrole repozytorium: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`. Oględziny stoczni i lotu należy wykonywać na osobnym adresie, bez odświeżania aktywnej wyprawy użytkownika.