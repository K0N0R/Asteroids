# 0.133 — HUD, kamuflaż i stabilność sandboxa

Stan: 2026-10-24. Aplikacja 0.133.0. Format kampanii 67 i dziennika 32 bez zmian; zapis 0.132 pozostaje zgodny.

## Zdolności

- HUD sprawdza rzeczywiste uzbrojenie i narzędzia kadłuba. Lancer i Raider mają tylko LPM, bez fikcyjnego lasera na PPM. Muł zachowuje lasery na LPM i pasywną samonaprawę pod R.
- Przypisanie jest tylko w małym polu przy ikonie. Zniknęły dodatkowe podpisy LPM/PPM/Q/E i „PASYWNA”, a także poprzedni tekst PPM/Q Widma nad kołami.
- LPM/PPM i Q/E mają wyśrodkowane etykiety. Jednoliterowe klawisze mają węższe pola. Odliczanie jest duże, pogrubione i wyśrodkowane na ciemnym tle; symbol zdolności jest wtedy przygaszony. Rakieta Żądła pokazuje własne 4 s odnowienia.
- Kamuflaż nie jest już nadpisywany przez końcową aktualizację kamery. Widmo i Żądło mają 30% krycia. Widmo podczas ruchu zostawia krótkie, zanikające sylwetki; pula 12 obiektów jest używana ponownie, a ślad znika po 0,5 s. Dash korzysta z tej samej puli.

## Zawieszanie i zasoby

- Główna pętla wcześniej pomijała całą aktualizację przy klatce dłuższej niż 100 ms. Przy stałym przeciążeniu mogło to utrwalać zastój. Teraz wykonuje aktualizację z ograniczonym krokiem 100 ms; diagnostyka nadal mierzy rzeczywisty czas klatki.
- Promienie i podpalenie mogą generować kilka drobnych trafień na krok fizyki. Dodatkowe iskry dla trafień poniżej 2 obrażeń pojawiają się najwyżej co 60 ms. Obrażenia, animacja promieni i płomienie nadal działają w każdej aktualizacji.
- W używanej wersji Pixi niszczenie `BatchableText` nie usuwało go z runnera zmiany rozdzielczości. Przed poprawką 10 restartów podniosło liczbę subskrypcji z 54 do 566. Każdy tekst aplikacji usuwa teraz subskrypcję przed zwolnieniem danych GPU. Teardown pozostawia natywne zwalnianie tekstury Pixi.
- Czyszczenie puli usuwa również identyfikatory zniszczonych tekstur, zachowując kubełki potrzebne zasobom wciąż używanym. Tooltip zdolności zwalnia rekurencyjnie własne konteksty grafiki.

## Weryfikacja

- 206/206 testów zestawu akceptacyjnego: poprzednie 195 oraz 11 kontroli renderowania, restartów, HUD i wolnych klatek. Raport `dist/runtime-acceptance.txt`. Pełna historyczna regresja nie jest deklarowana jako zielona.
- Test subskrypcji niszczy 1500 tekstów w 30 scenach przez oba stosowane sposoby teardownu; liczba subskrypcji wraca do zera po każdej scenie. Test głównej pętli podaje kolejne 150/250/1000 ms i potwierdza dalszą aktualizację świata, UI i tła.
- Przeglądarkowy podgląd rzeczywistych MissionWorld i MissionHud: Feniks trafia dwoma promieniami i podpala pobliskich przeciwników. 30 restartów bez błędów; subskrypcje pozostają na 47 zamiast narastać. W tej próbie JS heap wahał się po GC, z odczytem końcowym 289 MB i szczytem 423 MB. Nie jest to pomiar pamięci całego procesu Chrome.
- Osobna próba po ograniczeniu iskier wymusza klatki 150 ms; świat przekroczył 2334 s czasu symulacji, oba promienie i podpalenie działały, bez wyjątku. Po 20 restartach nadal 47 subskrypcji; końcowy JS heap 403 MB, szczyt długiej próby 541 MB. Dźwięk wyłączony w podglądzie technicznym.
- Dodatkowo sprawdzono pełne Core i GameSession z tłem oraz produkcyjną ścieżką `finishSandbox`/`launchSandbox`, na oddzielnym pochodzeniu 127.0.0.1 bez używania zapisu localhost. Po 30 restartach Feniks nadal wyświetlał oba promienie i podpalał cel. 1 świat, 5 warstw UI, limit historii 20 raportów, 101 subskrypcji (w tym ukryte lobby), końcowy JS heap 251 MB, szczyt 260 MB. Brak wyjątków i ostrzeżeń konsoli. Dowód: `dist/runtime-session-proof.txt`, `dist/runtime-session-final.png`.
- Typy, lint zmienionych plików i build produkcyjny przechodzą. Raporty: `dist/runtime-typecheck.txt`, `dist/runtime-lint.txt`, `dist/runtime-build.txt`. Po usunięciu starego tekstu Widma ponownie sprawdzono 4/4 testy tego zakresu i lint (`dist/runtime-final.txt`, `dist/runtime-final-lint.txt`) oraz przebudowano produkcję. Podglądy: `dist/runtime-hud-final.png`, `dist/runtime-cloak-final.png`.

Nie odtworzono dokładnie zgłoszonego zużycia 12 GB ani identycznej sekwencji zawieszenia Feniksa. Usunięto potwierdzony wyciek i mechanizm zatrzymywania aktualizacji; próby obejmują zarówno osobne komponenty, jak i pełną sesję. JS heap nie mierzy całej pamięci procesu Chrome ani wszystkich zasobów sterownika GPU, dlatego pomiary nie stanowią potwierdzenia usunięcia każdej możliwej przyczyny objawu z Menedżera zadań.
