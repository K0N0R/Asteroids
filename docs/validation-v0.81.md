# Weryfikacja 0.81 — gospodarka bazowa i interfejs stacji

Data: 2026-10-19. Format kampanii: 50; poprzednie zapisy są odrzucane.

## Automatyczne sprawdzenia

- `npm test`: 529 testów, 529 zaliczonych, 0 błędów i pominięć. Pełny przebieg po zmianach receptury stali, dostaw, napraw i hipernapędu; log lokalny: `dist/refactor-tests-final.log`.
- `npm run typecheck`: OK także po rozdzieleniu zakładek.
- `npm run lint`: OK także po rozdzieleniu zakładek.
- `npm run build`: OK także po rozdzieleniu zakładek.
- `git diff --check`: OK.

Nowe testy obejmują bilans pierwiastków w procesach, atomowe transakcje całych partii, nieprawidłowe ilości, brakujące składniki, blokady technologii, wszystkie podstawowe rodziny części, brak produkcji podczas lotu, brak limitu magazynu, dostawy nowych przedmiotów, odrzucenie starych zapisów i przygotowane zaopatrzenie bez dodatkowego doświadczenia. Zaktualizowano dotychczasowe regresje pod usunięcie pracowników, paliwa i limitów magazynu; testy Muła sprawdzają darmowe powtarzane naprawy gracza i AI.

## Sprawdzenie w przeglądarce

Lokalny podgląd po przebudowie, z odświeżeniem strony:

- Boczna nawigacja zawiera niezależne pozycje Rozbudowa stacji, Laboratorium i Warsztat; nie ma Przemysłu ani Załogi.
- Rozbudowa stacji ma trzy stale widoczne zakładki: Zaplecze, Tarcze stacji i Drony. Przełączają zawartość tego samego ekranu, bez strzałek powrotu i osobnych podstron. Sprawdzono wszystkie trzy widoki.
- Hipernapęd znajduje się wyłącznie w Hangarze → Ulepszenia wybranego aktywnego statku. Sprawdzono widok początkowego Prospectora i brak zakładki hipernapędu w rozbudowie stacji.
- Laboratorium wyświetla procesy materiałowe i modele; Warsztat wyświetla konkretne części i ich receptury. W obu widokach brak przycisków montażu urządzeń i ulepszania stacji.
- Wybrano stal w Laboratorium, potem elektronikę w Warsztacie, po czym przełączono zakładki w obie strony. Każda zachowała własny wybór.
- Sprawdzono czytelność opisów, dostępność przycisków partii przy pustym magazynie i pełne nazwy pierwiastków. Konsola przeglądarki: brak błędów.
- Zrzuty końcowego interfejsu: `dist/qa-station-upgrades.jpg` i `dist/qa-hangar-hyperdrive.jpg`. Konsola po sprawdzeniu zakładek stacji i Hangaru: brak błędów.

## Zakres pozostający do realizacji

To pierwsza paczka refaktoru, nie ukończona przebudowa całej gospodarki kampanii. Nadal do wdrożenia: wszystkie koszty statków z rodzin części, warianty i tiery II–III, pełny przegląd opisów i manifestów aktów, edukacyjny samouczek, cztery trwałe obszary Ziemi oraz etapowa modułowa baza księżycowa z lokalnym przetwarzaniem. Szczegóły w `plan-current.md` i `chemistry-economy-refactor-plan.md`.

## Lifting i przegląd interfejsu stacji — 2026-10-19

- Wspólne marginesy i linia głównych akcji (y=729, wysokość 44); wyrównane górne i dolne krawędzie kolumn Laboratorium oraz Warsztatu.
- Ilustracje są skalowane do osobnego pola na podstawie rzeczywistych granic rysunku. Nagłówki, równania i objaśnienia mają niezależne miejsce; sprawdzono m.in. wodę, sieć krzemionki, stal i podtrzymywanie życia.
- Nagłówek nie pokazuje zasobów. Magazyn ma ilustrowany pusty stan; po zapełnieniu wyświetla karty zasobów, ilości i paginację tylko wtedy, gdy jest potrzebna. Kolejność kategorii: pierwiastki, materiały, części.
- Zaplecze przedstawia halę produkcyjną z maszynami zależnymi od poziomu. Ilustracja i diagramy tarcz/dronów mają odstęp od zakładek; podpisy są wyśrodkowane.
- W Stoczni rozdzielono listę modułów, objaśnienie, warunek odblokowania, koszty oraz przycisk. Sprawdzono blokadę projektu Muła. Usunięto dodatkowy nagłówek nachodzący na statek w Uzbrojeniu; opis samonaprawy Muła odpowiada obecnej mechanice.
- Przegląd w przeglądarce przy 1280×720: Wyprawa, Hangar (Parametry/Ulepszenia), Stocznia, Uzbrojenie, trzy zakładki Rozbudowy stacji, Laboratorium, Warsztat, Magazyn, Piloci/Nabór i Ratunek.
- Dodatkowa izolowana wizualna próba bez zapisu kampanii: 27 typów zasobów i obie strony magazynu, duże ilości, pełny hangar sześciu statków, ośmiu pilotów, sygnał ratunkowy oraz drony uszkodzone i utracone. Tymczasowa strona QA nie wchodzi do końcowego buildu.
- Po ostatnich korektach: typecheck, lint i build OK. Konsole podglądu gry i izolowanej próby bez błędów. Nie powtarzano pełnego zestawu testów mechanik dla tej paczki wizualnej.
- Zrzuty: `dist/qa-polish-laboratory.jpg`, `dist/qa-polish-workshop.jpg`, `dist/qa-polish-warehouse.jpg`, `dist/qa-polish-station.jpg`, `dist/qa-polish-shipyard.jpg`.
