# Wdrożenie 0.91 — Akt I: Ziemia–Księżyc

## Przebieg

1. Orbita Ziemi: pierwsze zaopatrzenie i zaplecze Satuk 15.
2. Synchronizacja jednego satelity: większa ochrona orbity oraz śluzy Ziemia–Księżyc i Ziemia–wraki satelit.
3. Dodatkowy odzysk: trzy fizyczne satelity dostarczają 3 poszycia, 2 elektroniki, 1 maszynerię, 1 podtrzymywanie życia, 2 zespoły napędowe i 1 zasilanie — kompletny koszt Swifta. Każdy wrak można przekazać raz. Można wracać do tego celu później.
4. Przelot Prospectorem na orbitę Księżyca zalicza trasę, ale nie synchronizuje sondy.
5. Osobne strojenie sondy księżycowej: większa bezpieczna orbita, lądowanie i trasa do bogatej asteroidy.
6. Dostawy wyposażenia na powierzchnię, uruchomienie lokalnego przetwarzania, rozbudowa z Mułem i odbiór techniczny.
7. Automatyczny atak przy ukończonej placówce. Trzy fale przeciwników. Zwycięstwo otwiera Marsa, a powrót do Satuk 15 prowadzi do rozmowy o pościgu.

Ulepszenie dowolnego statku jest opcjonalne. Dodatkowa osłona przed asteroidami również nie blokuje ataku ani Marsa. Główna ścieżka nie wymaga Swifta. Wcześniejsze obszary i zadania dodatkowe pozostają dostępne.

## Spójność świata i interfejsu

Ziemia i Księżyc to jeden układ orbitalny i wspólny dziennik. Księżyc nie ma oddzielnej zakładki podróży w bazie. Lądowanie zachowuje ten sam statek i wyprawę. Definicje zadań zachowują wewnętrzne identyfikatory `earth` i `lunar`, natomiast dostępność, manifesty, rozkazy, raporty i zapis obsługują je jako jeden układ.

Śluzy, sonda, lokalne strefy i asteroida aktualizują się w bieżącej symulacji i warstwie graficznej. Obrzeża odseparowanych bezpiecznych obszarów mają czerwone linie. Granice wewnątrz nakładających się stref są pomijane. Dawne przekaźniki zachodni i południowy oraz dodatkowy węzeł orbitalny zostały usunięte.

Holowanie satelitów działa podczas hiperskoku; holowany obiekt jest przesuwany razem ze statkiem i nie staje się jego przeszkodą kolizyjną. Inne ograniczenia hipernapędu pozostają zachowane. Wraki satelit mają własne grafiki oraz deterministyczny odzysk części zamiast losowego kadłuba przeciwnika. Fracht powracający z niedokończonej budowy jest zwracany do magazynu bez automatycznej darowizny na dodatkowy cel zaopatrzenia.

## Zapis i sprawdzenie

Kampania 59, dziennik 24, wersja aplikacji 0.91.0. Poprzednie zapisy są świadomie odrzucane zgodnie z ustaleniem autora; brak migracji.

Celowane scenariusze obejmują rzeczywiste strojenie obu satelitów, skok początkowego Prospectora, rozdzielenie odblokowań, fizyczny hol przez śluzę i przekazanie części, budowę Swifta z odzysku, brak duplikacji nagród, lądowanie we wspólnej wyprawie, automatyczny atak po odbiorze oraz otwarcie Marsa i rozmowę po powrocie. Istniejące testy księżycowe dostosowano do podróży przez śluzę, zachowując sprawdzanie dostaw, wydobycia, ładunku, animacji i powrotu. Pełna regresja nie należy do tej weryfikacji.

Wynik: sprawdzone 64 celowane scenariusze (w tym ponowione wyłącznie poprawiane przypadki), poprawny typecheck, ESLint zmienionych plików i build wydania. Podgląd w przeglądarce obejmował wspólny dziennik, orbitę Księżyca z podejściem i śluzami oraz trzy wraki w czerwonym obrysie ochrony. Nie przeprowadzono pełnej ręcznej sesji kampanii od zera do finału.
