# 0.123 — oddzielne mapy aktu II i instalacja Fobosa

Wdrożenie doprecyzowanego [planu autora v0.5](SATUK15_Akt_II_Mars_plan_v0.5.md). Wcześniejsze dokumenty 0.118–0.122 opisują historyczny układ, zastąpiony poniższym.

## Przestrzeń i postęp

- Orbita Marsa: promień 9000, środek (4000, -4000). Satuk 15 pozostaje przy (0, 0), w dolnej lewej części mapy. Nad i pod nią są dwa przemieszczające się pola skał. Anomalie zajmują w pomiarze siatkowym 76.25% mapy. Labirynt ma pięć ślepych odnóg, ponad 25 tys. jednostek najkrótszej bezpiecznej drogi i co najmniej 300 jednostek prześwitu na osi wyznaczonych korytarzy. Deimos w górnej lewej części i zejście na Marsa w centrum pozostają odcięte.
- Orbita Fobosa: osobna mapa o promieniu 2800, środek (30000, 0). Anomalie zajmują 23.38%. Sonda, fizyczny wrak starego Prospectora i pas mniejszych ruchomych asteroid. Dopiero zabezpieczenie zasadzki otwiera lądowanie.
- Obszar asteroidy: promień 1800, środek (60000, 0), bez anomalii. Duża nieruchoma asteroida, gęste pole skał, zakład i dwanaście wymaganych jednostek wroga.
- Powierzchnia Fobosa: dotychczasowy osobny obszar przy (6500, 6000), nieruchome złoża korzystające z rysunku złóż powierzchniowych, średnia instalacja, cztery patrole po zamkniętych trasach.

Mapy orbitalne mają własne granice, radar, tło, miejscowe znaczniki i nazwę w HUD. Przejście przez śluzę po ładowaniu zmienia obszar bez lotu przez pustą przestrzeń między współrzędnymi. Hol przechodzi razem ze statkiem. Fizyczna dostawa pamięci do Satuk 15 i analiza SI nadal otwierają trasę do obszaru asteroidy.

## Instalacja Fobosa

Obracający się skaner używa mechanizmu ochrony CERBERUSA. E przy terminalu otwiera rzeczywistą minigrę połączenia ścieżki; zwykłe czekanie nie wyłącza bazy. Limit to 15 sekund, na Sokole 20. Świat pozostaje aktywny. Wykrycie, walka lub przekroczenie czasu uruchamia alarm i produkcję posiłków. Po cichym sukcesie patrole znikają jako wrogowie i stają się czterema fizycznymi, zapisywanymi dronami do holowania. Powrót przez śluzy do Satuk 15 jest możliwy również z takim dronem albo starym wrakiem.

Poprawiono kolejność warstw instalacji i skanera względem gruntu oraz zgodność nagrody za włamanie z limitem PD zapisu. Wypuszczone wcześniej jednostki z innego obszaru nie zajmują limitu produkcji nowej fabryki.

## Wylot i zasoby grafiki

Usunięto kosztowne rysowanie każdego rozmytego odcinka włókna osobno oraz obliczanie odległości od wszystkich wielokątów dla każdego piksela maski. Maska jest rasteryzowana natywnie jako wspólna unia, a włókna rysowane w grupach. Dłuższy bok ilustracji ma maksymalnie 1536 pikseli.

Cache CPU mieści najwyżej dwie ilustracje i 5 mln pikseli. Każda scena posiada własną teksturę GPU i niszczy ją przy zamknięciu. W lokalnym podglądzie tworzenie grafiki Marsa zajęło około 28–49 ms, a pełnej sceny około 150–250 ms; są to pomiary na tym komputerze, bez pobierania zasobów sieciowych. Dwanaście kolejnych utworzeń i zwolnień scen Mars/Fobos nie zwiększyło cache ponad dwie ilustracje, 3 197 952 piksele (około 12.8 MB RGBA). Nie jest to dowód usunięcia wszystkich zgłoszonych wycieków podczas wielogodzinnej sesji.

## Zapis i sprawdzenie

Dziennik 31 migruje dziennik 30: orbitalne przedmioty, posiłki i sygnały zachowują właściwy nowy obszar; powierzchnia Fobosa pozostaje w miejscu. Dawne przedmioty z powierzchni Deimosa przenoszone są na bezpieczną orbitę Marsa. Ukończona wcześniej baza nie przywraca nowych patroli. Format kampanii pozostaje 66.

75 testów w 12 pakietach przechodzi: Mars, najkrótsza droga i pokrycie anomaliami, rzeczywiste przejścia śluzami i lądowanie, hol, alarm i posiłki, minigra i zapis dronów, migracja, sygnały ratunkowe obu nowych orbit, hipernapęd, skażenie i ratunek jowiszowy, tła, sprzątanie grafiki, wydobycie, receptury i ładownie. Przechodzą również ESLint zmienionych plików, kontrola typów i build. Podgląd w przeglądarce sprawdzał osobne mapy, ilustrację anomalii, bazę i skaner oraz kolejne zamknięcia scen.

Pozostaje ręczny balans długości wypraw i trudności walki na różnych kadłubach oraz długotrwały profil pamięci. Technologia wycinania anomalii i dalsze powierzchnie pozostają późniejszym zakresem.
