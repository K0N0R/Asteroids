# Wersja 0.37 — powtarzalne próby sandboxa

## Obsługa

W bazie wybierz **SANDBOX / TESTY**. Konfigurator udostępnia wszystkie 14 kadłubów, trzy warianty uzbrojenia, sześć modułów na poziomach 0–III i seed sektora. Seed można wpisać, zmieniać o jeden lub losować. Każda próba zaczyna się z neutralnym pilotem, pełnym kadłubem i tarczą oraz trzema zestawami naprawczymi.

- **Swobodny sektor**: pełna mapa, prototypy i zwykłe mechaniki sektora.
- **Wydobycie**: małe pole surowców bez przeciwników; zbierz 10 jednostek ładunku i wróć.
- **Walka**: dwa drony poza osłoną Aurory; zniszcz oba i wróć.
- **Holowanie / ratunek**: przygotowany wrak i kapsuła; dostarcz co najmniej jeden hol.
- **Infiltracja**: start przy Cerberze, jego normalna obstawa i trzy komponenty do sabotażu; wykradnij dane i wróć.
- **Eskorta**: rozpocznij eskortę Keplera, ukończ badania i wróć.

HUD i panel TAB pokazują cele danej próby. **F6** natychmiast uruchamia tę samą konfigurację od początku, zapisując wynik poprzedniej próby w pamięci sesji. **F7** kończy próbę i otwiera raport. Raport pozwala powtórzyć konfigurację, zmienić ją lub wrócić do bazy. Dostępne są również przyciski ekranowe. Zamknij pauzę lub panel TAB przed restartem albo zakończeniem próby.

## Izolacja i powtarzalność

Sandbox tworzy własną kampanię w pamięci. Nie otrzymuje repozytorium zapisu ani normalnej kampanii. Sesja omija normalne autosave, pracę personelu oraz rozliczenie wyprawy. Dostawy holu, zużycie zestawów, śmierć i odzysk dotyczą wyłącznie lokalnej próby. Zwykły zapis zachowuje format 18.

Restart odtwarza seed, kadłub, uzbrojenie, moduły, pilota i zapasy. Identyczne wejścia przy stałym kroku symulacji dają powtarzalne wyniki; sam seed nie zastępuje identycznego sterowania. Losowe efekty dekoracyjne nie stanowią gwarancji identycznego obrazu klatka po klatce. Odświeżenie strony usuwa próbę i historię sandboxa.

Scenariusze korzystają z rzeczywistej symulacji: fizycznego holu, napraw, osłon, walki, infiltracji, wydobycia i eskorty. Konfiguracja przygotowuje sektor oraz pozycję startową; cele testowe są niezależne od zwykłego kontraktu kampanii.

## Pomiary

Raport zawiera konfigurację, wynik celu, czas symulacji, przebytą drogę, obrażenia kadłuba i tarczy, obrażenia zadane przeciwnikom, zniszczenia, zużyte zestawy, dostarczone hole, aktualny ładunek oraz pozostały kadłub i tarczę.

Obrażenia są liczone do faktycznie pozostałego zdrowia/osłony, bez nadmiaru przy śmiertelnym trafieniu. Obrażenia zadane przeciwnikom nie obejmują ich kolizji ze środowiskiem. Licznik asteroid obejmuje również zniszczone fragmenty. Ładunek oznacza zawartość statku na końcu próby; dostarczone hole mają osobny licznik. Historia zachowuje maksymalnie 20 raportów w pamięci, a ekran pokazuje trzy poprzednie próby wraz z konfiguracją skróconą do scenariusza, kadłuba i seeda. Brak zewnętrznej telemetrii.

## Weryfikacja

- Pełny zestaw: **299/299 testów**.
- Osiem nowych testów obejmuje wszystkie scenariusze i kadłuby, deterministyczny restart, seedy, izolację zapisu po dostawie i śmierci, rzeczywiste obrażenia, naprawę, dokowanie oraz walidację konfiguracji.
- TypeScript, ESLint i produkcyjny build.
- Kontrola w przeglądarce: konfigurator i ręczny seed, start walki, cele HUD/TAB, F6, F7, historia raportów, przejście do konfiguratora, start eskorty oraz powrót do niezmienionej bazy.

## Co pozostało przed kampanią

To domknięcie narzędzi testowych, nie całego pierwszego dużego etapu. Następna praca to przejście pełnych cykli powodzenia i porażki głównych mechanik, naprawa ujawnionych problemów, porównanie statków na wspólnych seedach oraz pomiar FPS i pamięci przy rzeczywistym renderowaniu. Testy symulacji nie zastępują sesji balansu ani pomiarów renderera. Szczegółowe kryteria zawiera [bieżący plan](plan-current.md).
