# Wdrożenie 0.99 — mapa sektorów i czytelniejsza wyprawa

W kampanii pierwszą pozycją bocznej nawigacji jest Układ słoneczny. Umowna mapa ma centralne Słońce, Merkurego, Wenus, Ziemię z Księżycem, Marsa, pas asteroid, Jowisza, Saturna, Urana, Neptuna i Plutona. Wybór dostępnego sektora korzysta z istniejącego travelStory i zapisu sesji. Pierścień wskazuje bieżący wybór, zablokowane sektory są przyciemnione. Aktywna wyprawa nie pozwala zmienić obszaru. Przycisk Przygotuj wyprawę przechodzi do istniejących zadań i wylotu dla wybranego sektora. Rozmieszczenie i skale są umowne; mapa nie zmienia fizycznych odległości gry. Tryb swobodny zachowuje wybór kontraktów.

Z Wyprawy usunięto dawny rząd sektorów. Filtry i początek kart przesunięto o 52 px wyżej, a dostępna wysokość listy wzrosła z 438 do 490 px. Zachowano główne zadania przed dodatkowymi, Aktywne/Ukończone, skróty Stwórz i historię powrotu. Zniknęły slogan i dekoracyjne paski pod nazwą stacji; dziewięć pozycji nawigacji mieści się nad istniejącymi dodatkowymi przyciskami.

Panel stanu pokazuje aktualny model statku i portret rzeczywiście wybranego pilota, nazwę, kadłub, ładownię, poziom, PD i zapas napraw lub samonaprawę Muła. Postęp głównych celów ma pasek. Usunięto promień obszaru i oznaczenie rozmiaru. Dłuższe podsumowanie sektora ogranicza się do trzech wierszy; szczegóły celów pozostają na kartach zadań. Mapa korzysta ze spokojnego tła, bez dublującej ją dużej ilustracji Ziemi.

Wspólna nazwa earth to teraz Sektor Ziemia–Księżyc. Aktualizacja dotyczy również pozostałych miejsc korzystających z katalogu nazw sektorów. Nie zmienia kluczy ani postępu.

Weryfikacja: trzy celowane testy dostępności, rzeczywistej zmiany sektora i blokady podczas lotu. W przeglądarce sprawdzono nową kampanię, stan zablokowanych sektorów, odblokowanie i wybór Marsa, pierścień, przejście do Wyprawy oraz obrazy statku i pilota. Kontrola typów, lint i release build; bez pełnej regresji.

Wersja aplikacji 0.99.0. Kampania 65 i dziennik 29 bez zmian; ta aktualizacja nie wymaga nowej kampanii. Następny proponowany pakiet: animowane, udźwiękowione kwestie raportowania i naturalniejsza treść wypowiedzi.

## Pas asteroid na mapie

Zamiast pojedynczego skupiska mapa pokazuje ciągły pas drobnych skał na całej eliptycznej orbicie między Marsem i Jowiszem. Jedna przerwa w pierścieniu ma znacznik i podpis Przejście przez pas; tylko ten punkt wybiera istniejący grywalny sektor belt. Rozkład skał jest deterministyczny, a znacznik nie nachodzi na podpis Wenus. Odblokowania i zapis wyboru pozostają w istniejącym mechanizmie. Sprawdzono wygląd oraz trzy testy mapy, typecheck, lint i build.

## Tło i poświata Słońca

Usunięto dolną wskazówkę o pierścieniu wyboru i zablokowanych sektorach. Za orbitami jest wspólna ilustracja Drogi Mlecznej z milkyWayView, używana podczas lotu i w pozostałych widokach, z intensywnością 30%, oraz szeroka, ciepła poświata Słońca. Usunięto błędną spiralę wokół Układu Słonecznego. Tło jest tworzone raz na widok bazy, zachowywane przy odświeżaniu i ukrywane po zmianie zakładki; nie przechwytuje interakcji. Zachowano czytelność podpisów, planet i pasa asteroid; wygląd sprawdzono w osobnym podglądzie przeglądarkowym.
