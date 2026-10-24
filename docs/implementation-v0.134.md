# 0.134 — stopniowe odkrywanie i ilustracje urządzeń

Stan: 2026-10-24. Wersja aplikacji 0.134.0. Format kampanii 67 i dziennika 32 bez zmian. Aktualizacja nie wymaga nowego zapisu.

## Zasada informacji

Plan projektowy opisuje całą grę; interfejs opisuje wiedzę gracza w danej chwili. Widoczność nie jest tym samym co możliwość opłacenia akcji. Gracz widzi posiadane urządzenia i wyposażenie oraz projekty, których znane już warunki pozwalają obecnie rozpocząć montaż. Brak materiałów nie ukrywa takiego projektu. Nieznane badania, przyszłe fabularne wymagania, wyższe tiery i kadłuby pozostają poza interfejsem.

Reguły znajdują się w `frontend/game/state/discovery.ts`. Nie zapisujemy dodatkowych, dublujących fabułę flag. Reguły czytają ukończone etapy oraz istniejące instalacje. Zachowane starsze wyposażenie nie znika z menu. Profil bez fabuły i sandbox mają obsługę bez odwołań do nieistniejącego dziennika.

## Momenty ujawniania

| Etap | Widoczne projekty i możliwości |
| --- | --- |
| Początek | Budowa Laboratorium I; bez Warsztatu, ekstrakcji i przyszłych tierów. Produkcja pojawia się po uruchomieniu urządzenia. |
| Po misji księżycowej | Projekt Warsztatu I. Po montażu: części I, pięć kadłubów I, generator tarczy i hangar dronów. |
| Ukończony akt II, łącznie z odprawą | Ekstrakcja jako badania w toku. Bez receptury instalacji, kosztów i wskazywania Merkurego jako rozwiązania. |
| Technologia Merkurego | Projekt adaptera. Projekt Laboratorium II dopiero po montażu adaptera i dostarczeniu próbki. |
| Laboratorium II | Procesy II i projekt Warsztatu II. |
| Warsztat II | Części II, kadłuby II i odpowiednie moduły. |
| Pakiet Jowisza | Projekt Laboratorium III. Po jego montażu projekt Warsztatu III; jego montaż otwiera produkcję i kadłuby III. |

Tabela opisuje zasady dla twórców, nie tekst przeznaczony do pokazania graczowi z wyprzedzeniem.

## Ekrany i teksty

- Rozbudowa nie ma przycisków nieznanych urządzeń ani nieosiągalnych tierów. Zniknęły liczniki w rodzaju „1 / 3”. Zapamiętany wybór przyszłego projektu jest zamieniany na dostępny wybór.
- Produkcja filtruje zarówno poziom, jak i dodatkowe badania. Wybranie starej receptury III nie dopisuje jej do listy I. Odnośniki składników, kart zadań i kosztów otwierają wyłącznie poznane procesy. Ukryte zakładki i stara historia nawigacji nie obchodzą reguł.
- Stocznia zawiera tylko projekty odblokowane przez działający Warsztat. Brak części nadal pokazuje koszt dostępnego kadłuba. Projekty kolejnych tierów nie pojawiają się jako szare karty.
- Podglądy modułów statku są ograniczone do poznanego poziomu. Nie wyświetlają kosztu ani modelu przyszłego poziomu przy ukończonym obecnym wyposażeniu. Usunięto pełne rozpiski poziomów ładowni i maksymalnej przyszłej liczby holi; porównanie pokazuje obecny i dostępny stan.
- Podstawowa tarcza nie pokazuje przemysłu kinetycznego. Posiadana tarcza kinetyczna I nie ujawnia wymogów przyszłej obrony i korytarza Marsa dla II, dopóki ten projekt nie jest dostępny.
- Mapa podróży rysuje operacyjne kierunki dostępne w kampanii. Nie przedstawia całego zestawu przyszłych sektorów jako zablokowane miejsca. Nie zmieniono samych reguł podróży.
- Dziennik liczy odkryte cele; nie zdradza całkowitej liczby przyszłych zadań. Opis bieżącej sytuacji korzysta z aktualnego kroku fabuły zamiast ogólnych streszczeń przyszłego sektora.
- Odprawa po Marsie, zadanie „Nowy kierunek”, dialogi załogi i początki Wenus nie wskazują z góry Merkurego ani rozwiązania bariery. Kierunek Merkury zostaje wskazany po przygotowaniach Wenus. Opisy procesów nie zawierają już notatek projektowych o „materiale gry” i „poprzednim tierze”.

## Ilustracje

Nowy wektorowy `stationDeviceScene` zachowuje styl obecnych ilustracji i nie dodaje plików bitmapowych ani pętli animacji.

- Laboratorium I: szkło i podstawowa aparatura; II: obieg oraz zamknięty reaktor; III: próbki i komora analityczna.
- Warsztat I: stanowisko z robotem i przenośnikiem; II: druga głowica; III: prowadnica i dodatkowy moduł montażowy.
- Ekstrakcja: pasywne badania przed gotowym projektem, potem głowica pobierająca, moduł zabezpieczania próbki oraz rozbudowane ekranowanie. Jej warianty oprawy podążają za działającym Warsztatem I–III. Adapter pozostaje pojedynczą instalacją: nie dodano nowych zakupów ani tierów mechaniki wydobycia.

## Weryfikacja

**230/230 testów zestawu akceptacyjnego przechodzi.** Zakres obejmuje poprzednie 206 testów, odkrywanie informacji, mapę, hangar i podglądy modułów. Raport: `dist/discovery-acceptance-final.txt`. Kontrola typów, lint zmienionych plików oraz build produkcyjny przechodzą: `dist/discovery-typecheck.txt`, `dist/discovery-lint.txt`, `dist/discovery-build.txt`.

Testy ujawniania sprawdzają brak przyszłych nazw i tierów w wyrenderowanych drzewach UI, wybory zachowane z późniejszego etapu, ścieżkę badania→projekt, brak odkrycia technologii przez sam zapas materiałów, profil bez fabuły oraz geometrię i zwalnianie kontekstów nowych ilustracji. Pomiar tekstu w tych testach jest zastąpiony stałym pomiarem; rzeczywisty layout sprawdzono osobno w przeglądarce.

Przeglądarkowy podgląd rzeczywistych `LobbyView` i `Background` korzysta z osobnych danych QA i nie zapisuje kampanii. Sprawdzono początek, akt I, akt II, poziomy II/III, badania ekstrakcji, stocznię I, produkcję I, odprawę Wenus i mapę po akcie II. Konsola bez błędów i ostrzeżeń. Artefakty: `dist/discovery-lab-I.png`, `dist/discovery-lab-II.png`, `dist/discovery-lab-III.png`, `dist/discovery-workshop-I.png`, `dist/discovery-workshop-III.png`, `dist/discovery-extraction-research.png`, `dist/discovery-extraction-III.png`, `dist/discovery-recipes-I.png`, `dist/discovery-shipyard-I.png`, `dist/discovery-map-act-II.png`, `dist/discovery-venus-briefing.png`.

Starsze testy hangaru dostosowano do obecnych zasad: do ulepszeń używają Swifta, Prospector pozostaje zablokowany, koszt stanowią części danego tieru, a sterowanie Aegisa porównuje skręt. Usunięto też błędną zmienną w fixture. Pełny historyczny zestaw wszystkich testów nadal nie jest deklarowany jako zielony; zakres tej wersji nie obejmuje napraw całego zaległego zestawu.
