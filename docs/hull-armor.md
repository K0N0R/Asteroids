# Poszycie i pancerz floty

Wszystkie kadłuby mają teraz wzmocnienia w formie poszycia, obramowań lub zewnętrznych płyt. Usunięto dawny renderer nakładający cienkie linie kolejnych poziomów. Geometria pancerza pozostaje zmianą wizualną: bez zmian cen, HP, sterowania, zapisu ani kolizji.

## Nowe zestawy

| Kadłub | Rozwój pancerza |
| --- | --- |
| Swift | Smukłe płyty nasad skrzydeł, rozszerzenia ich poszycia i osłona dziobu. |
| Bastion | Pancerz barków przy działkach, klin dziobowy odsunięty od kokpitu i domknięcie nasad. |
| Manta | Przedni łuk, osłony zewnętrznych barków oraz płyty przy nasadach skrzydeł. |
| Sokół | Segmenty kołnierza dysku, poszycie przednich ramion i tylna płyta poza zbiornikiem. |
| Atlas | Dwa pasy poszycia centralnego korpusu, ich przedłużenie przy kokpicie i osłona dziobu. Kontenery pozostają widoczne. |
| Widmo | Pancerz mocowań ostrzy, płytki na skrzydłach i osłony boków centralnego kadłuba. Skrzydłowe płyty skalują się z ostrzami, środkowe zachowują stałe mocowania. |
| Żądło | Klinowe osłony nasad skrzydeł, tylne płyty i wąski pancerz dziobu. |
| Feniks | Poszycie nasad, ukośne płyty skrzydeł i osłony boków korpusu, z odsłoniętym pomarańczowym rdzeniem. |
| Raider | Surowe kanciaste barki, osłona dziobu i tylne mocowania z widocznymi łącznikami. |
| Lancer | Większe boczne płyty, szeroki klin dziobowy i osłony przy mocowaniach napędu. |

Poziom I dodaje główne płyty, II rozszerza osłonięty obszar, III uzupełnia zestaw i wzmacnia wizualnie powierzchnie wcześniejszych segmentów. Płyty mają własny cień, krawędź i powierzchnię zamiast kilku równoległych linii. Zbiorniki rozszerzeń rysowane są nad płytami.

Wcześniej przebudowane Prospector, Mule, Harpun i Aegis zachowują swoje obramowanie, poszycie i zewnętrzne osłony.

## Weryfikacja

- 80 testów floty, uzbrojenia, grafiki oraz zmian 0.34/0.35.
- TypeScript, pełny lint i build produkcyjny.
- Dwie galerie: wszystkie dziesięć zestawów na poziomach 0–III, w tym Widmo z maksymalnymi ostrzami.
- Galeria wszystkich 14 kadłubów: wersje bazowe i z kompletem modułów III, z kontrolą widoczności wyposażenia.
- Podgląd na porcie 3001, bez zmiany zapisu użytkownika na porcie 3000. Nie wykonano pomiaru FPS ani nowej sesji balansu.

## Proponowane dalsze kroki

1. Indywidualny podgląd modułów w hangarze: wskazany moduł i poziom, porównanie przed/po oraz krótkie podświetlenie zmienianych części. Obecne Bazowy / Moduły III pokazuje cały zestaw jednocześnie.
2. Wizualizacja uszkodzeń: subtelne ślady trafień, lokalne osmalenie i krótkie przebłyski osłon. Czytelność podczas lotu ważniejsza niż liczba efektów.
3. Sesja balansu: użyteczność pancerza, koszt modernizacji i napraw, dochody z wydobycia/walki/odzysku oraz różnice między lekkimi i ciężkimi kadłubami.

To propozycje kolejnych etapów, nie dodatkowy wdrożony zakres.
