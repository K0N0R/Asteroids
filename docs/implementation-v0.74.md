# Wersja 0.74 — raportowanie radiowe w całej kampanii

Data: 2026-10-18. Format kampanii 46, dziennika 20. Starsze zapisy są odrzucane, bez migracji.

## Raporty podczas lotu

Automatyczne potwierdzenia Satuk 15 obejmują teraz pozostałe sektory: Marsa, Wenus, Merkurego, pas asteroid, Jowisza, Saturna, Urana, Neptuna i Plutona. Odczyty, ukończone włamania, zniszczenie stoczni, obrony placówek, oczyszczenie przeszkód pasa i zwycięstwa nad bossami trafiają do dziennika przed dokowaniem. Działa istniejący dolny panel dialogu z portretem oficera i ręcznym przechodzeniem kwestii.

Potwierdzony cel otwiera powrót dla wybranego rozkazu i pozostaje zapisany także po późniejszej stracie statku lub przerwaniu wyprawy. Niewysłany raport z odwrotu albo śmiertelnej klatki nie przyznaje postępu. Sandbox zachowuje własne rozliczenia.

## Częściowe patrole i nagrody

Aktywna wyprawa zapisuje liczbę już zgłoszonych zwycięstw patrolowych. Raporty co klatkę i dokowanie przekazują licznik narastający, a dziennik otrzymuje wyłącznie różnicę. Częściowe zwycięstwo zapisuje się natychmiast, ale nie otwiera dokowania przed osiągnięciem całego celu. HUD odejmuje już potwierdzoną część zamiast pokazywać ją podwójnie.

Nagroda zadania trafia do stacji raz, przy potwierdzeniu radiowym. Raport powrotu nie wypłaca jej ponownie. Premie doświadczenia za bossów (12 za Neptuna, 18 za Plutona) są zapamiętywane w wyprawie i przyznawane pilotowi przy bezpiecznym powrocie. Samo wcześniejsze potwierdzenie zadania nie odbiera tej premii. Kolejna wyprawa nie dostaje jej ponownie.

## Granice pakietu

Nowo odblokowane miejsca i obsady w aktach II–X nadal powstają przy rozpoczęciu kolejnej wyprawy. Radio informuje o tym gracza. Nie przebudowujemy aktywnego świata i nie odtwarzamy zniszczonych skał ani pokonanych jednostek. Ziemia i Księżyc zachowują wcześniej dodane odblokowania podczas lotu.

Radio przekazuje dane, nie surowce: zaopatrzenie Saturna wymaga dostarczenia ładunku. Projekty stacji i podróże sektorowe nadal wykonuje się w stacji. Transfer C pozostaje dostępny w dotychczasowym zakresie Ziemi i Księżyca.

## Weryfikacja

**502/502 testy**, typecheck, lint, build i `git diff --check` przechodzą.

Dodano 12 testów: częściowy patrol, blokada przedwczesnego dokowania, jednorazowe nagrody, zapis liczników, potwierdzony rozkaz, odczyty w ośmiu kolejnych sektorach, zachowanie po stracie, brak raportów po odwrocie lub zniszczeniu, premie bossów i odrzucanie nieprawidłowych zapisów. Dotychczasowe scenariusze lotu, walki, włamań, obron, wydobycia przeszkód i bossów zaktualizowano do potwierdzania przed powrotem. Są to testy symulacji; nie stanowią ciągłego przejścia kampanii ani nowej kontroli przeglądarkowej.

## Następny zakres

Pierwsza misja odzysku w skażonej anomalii: nieregularny obszar zagrożenia, czytelne ostrzeganie o obrażeniach, obiekt do fizycznego odzyskania i możliwość wyboru bezpieczniejszej lub krótszej trasy. Równolegle pozostaje przegląd `asteroids-sounds` i dobór nowych dźwięków do istniejących zdarzeń.
