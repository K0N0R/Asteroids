# Wdrożenie 0.88 — dostawy części do Marsa i Wenus

## Komplety budowy

| Projekt | Poszycie | Maszyneria I | Elektronika I | Zasilanie I | Podtrzymywanie życia I |
| --- | --- | --- | --- | --- | --- |
| Baza marsjańska | 12 stalowych I | 6 | 4 | 4 | 4 |
| Placówka Wenus | 8 stalowych I | 4 | 3 | 3 | 3 |
| Osłona słoneczna | 6 lekkich I | — | 2 | 3 | — |

Mars otwiera dostawy po odzyskaniu technologii z Merkurego, Wenus po zwiadzie. Pomiary miejsca i przygotowanie części Wenus można prowadzić równolegle. Osłona przyjmuje wyposażenie dopiero po montażu placówki. Po ostatniej dostawie otrzymuje automatyczne potwierdzenie gotowości; nie pobiera kolejnych materiałów. Obrona i wyposażenie osłony mogą być wykonane w dowolnej kolejności.

## Transport

Przycisk wylotu z dostawą korzysta ze wspólnego manifestu dla Księżyca, Marsa i Wenus. Pobiera tylko brakujące części dostępne w banku Satuk 15 i mieszczące się w ładowni. Komplety podstawowego Prospektora mieszczą się w jednym kursie, mniejsze statki mogą wykonywać dostawy częściowe. Ponowny start aktywnego lotu nie obciąża banku.

C uruchamia transfer do 300 m od docelowej placówki przy prędkości poniżej 35 m/s. Przerwanie ruchem, interakcją, uszkodzeniem lub użyciem narzędzi pozostawia niewysłany ładunek na statku. E przy placówce przez 2 sekundy przekazuje potrzebne części, a po zebraniu kompletu pozwala na montaż. Materiały z innych faz i nadmiar pozostają w ładowni. E po montażu Wenus nadal obsługuje dostawy do osłony. Transfer C używa istniejących ilustracji konkretnych zasobów.

Dostawy nie są zaliczane z banku przez przycisk zadania ani ze zwykłego raportu radiowego. Wymagają właściwego aktywnego sektora, orbity i nieprzerwanej wyprawy. Warstwę odległości i sterowania egzekwuje symulacja. Stan zadania utrwala się natychmiast po przekazaniu, także gdy później nastąpi utrata statku. Ładunek kupiony/załadowany w bazie jest frachtem, a nie nowym wydobyciem. Magazyn Satuk 15 przyjmuje też ładunek przez C w sektorach Marsa i Wenus.

## Interfejs i zapis

Karty zadań zawierają pełne nazwy wymaganych części, ilości i miejsce dostawy. Zmieniono wskazówki budowy, osłony oraz dalszego kroku. Osłona Wenus zachowuje istniejące odblokowania dalszej kampanii i Harpuna. Dawne techniczne identyfikatory dwóch zadań Marsa i jednego Wenus pozostają kluczami liczników, lecz nie oznaczają już ich dawnej waluty.

Format kampanii: 56. Format dziennika: 23. Poprzednie zapisy są odrzucane.

## Weryfikacja

Celowane testy sprawdzają manifesty, pobranie zapasów tylko raz, częściowe dostawy, pojemność mniejszego statku, blokady sektora i fazy, utrwalenie po stracie, brak doświadczenia za fracht, przerwany transfer C i dostawy E przed oraz po montażu. Zaktualizowano wcześniejsze scenariusze budowy i obrony. Typecheck, lint i build przechodzą. Widoki rzeczywistego komponentu sprawdzono na kampanii testowej bez ingerencji w zapis gracza; podgląd `dist/qa-orbital-mars-manifest.jpg`.

Zgodnie z ustaleniem autora kolejne zmiany weryfikować celowanymi testami. Nie ponawiać pełnego zestawu po każdej poprawce.

## Dalszy zakres

To zmiana wymagań i fizycznego transportu. Osobne magazyny i produkcja Marsa oraz Wenus, przebudowa ich grafiki, warianty materiałowe i części II–III pozostają odrębnymi etapami. Opcjonalne zadania rezerw i koszty dalszych sektorów nadal wymagają dalszego porządkowania gospodarki.
