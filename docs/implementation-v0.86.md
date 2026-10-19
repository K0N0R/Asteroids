# Wdrożenie 0.86 — modułowa budowa księżycowa

## Przebieg

Po zwiadzie gracz produkuje w Satuk 15 i dostarcza na powierzchnię pięć kompletów wyposażenia: 8 poszyć stalowych I, 4 maszynerie I, 3 elektroniki I, 2 układy zasilania I oraz 2 systemy podtrzymywania życia I. Każda ukończona dostawa odsłania odpowiedni moduł placówki. Nie wystarczy zapas żelaza ani węgla; lokalne wydobycie nie zastępuje początkowego wyposażenia.

Pełen komplet ma 19 miejsc i mieści się w początkowym Prospectorze. Nie trzeba czekać na zbudowanie Muła, aby dostarczyć maszyny do uruchomienia Muła. Wszystkie potrzebne części można ręcznie wyprodukować przed opuszczeniem Ziemi.

Po uruchomieniu pięciu modułów E przy Mule rozpoczyna eskortę. Muł wydobywa i wozi do budowy 160 porcji Żelaza (Fe) oraz 2 porcje Węgla (C). Gracz może równolegle dostarczać oba pierwiastki. Surowce zasilają miejscowy proces rozbudowy; nie przyznajemy za nie uniwersalnych komponentów. Zbiorniki i stanowisko odbioru pojawiają się w kolejnych etapach. Po zakończeniu dostaw skan instalacji przez E potwierdza odbiór i odblokowuje kadłub Muła. Obrona i dalsza kampania zachowują własne warunki.

Muł czeka przy budowie przed dostarczeniem wyposażenia. Po ostatniej dostawie można uruchomić go w tej samej wyprawie. Jego chwytaki przyjmują aktualnie potrzebne pierwiastki, w tym węgiel. Wypełniona ładownia lub skompletowanie potrzebnej partii uruchamia kurs do placówki. Darmowa samonaprawa i fizyczne działanie laserów pozostają zachowane. Utrata załadowanego Muła nie zalicza niedostarczonego materiału.

## Transport i zapis

Manifest ładuje wiele rodzajów części w jednej transakcji z banku. Uwzględnia postęp, braki, stan magazynu i pojemność statku. Kolejny start nie obciąża magazynu ponownie. Transfer C lub E przy budowie przekazuje wszystkie pasujące pozycje aktualnej fazy i pozostawia nadwyżki na statku. Odrzucone, obce, orbitalne i przerwane dostawy nie zaliczają budowy.

Każda pozycja ma trwały licznik w dzienniku. Utrata statku zachowuje tylko wcześniej przekazane wyposażenie. Zapisy zawierają aktualny manifest i rozróżniają załadunek w bazie od nowego wydobycia. Rozliczanie doświadczenia odejmuje fracht dla całego katalogu zasobów. NPC nie może zaliczyć początkowego wyposażenia za gracza.

Format kampanii: 54. Format dziennika: 22. Poprzednie zapisy są odrzucane.

## Grafika i interfejs

Duży, połączony zespół kopuł, cylindrów, korytarzy, linii przetwarzania, paneli i zbiorników zastępuje dawny prostokąt. Elementy mają zaokrąglenia i płaskie kolory bez konturów. Stan grafiki wynika z ukończonych dostaw, również podczas bieżącego lotu.

Widok wyprawy pokazuje osobne wymagania modułów i przycisk wieloskładnikowego manifestu. HUD usuwa pięć ukończonych pozycji wyposażenia po uruchomieniu produkcji, zachowując miejsce na wydobycie, odbiór i obronę. Kontekst budowy wskazuje pierwszą oczekującą pozycję i liczbę pozostałych.

## Ograniczenia i następny etap

Lokalne przetwarzanie obsługuje na razie automatyczny proces budowy. Nie ma jeszcze osobnego magazynu księżycowego ani pełnego menu ręcznego Laboratorium/Warsztatu w tej placówce. Takie menu i logistyka zapasów są kolejnym rozszerzeniem. Manifesty i koszty placówek Marsa oraz Wenus pozostają do refaktoru. Cztery obszary Ziemi, części II–III, warianty materiałowe i muzyka pozostają w planie.

## Weryfikacja

- Pełna regresja: **561/561**, 0 błędów i 0 pominiętych; `dist/lunar-stages-full-final.log`.
- Typecheck, lint i build: bez błędów.
- Nowe testy: mieszany manifest i jednorazowe obciążenie, blokada zastępowania wyposażenia pierwiastkami, trwałość częściowych dostaw po utracie statku, odróżnianie frachtu od wydobycia, blokada startu Muła i uruchomienie po dostawie w tym samym locie, odbiór i odblokowanie kadłuba.
- Zachowane testy prawdziwego wydobycia oboma laserami, wielokrotnych kursów Muła, wspólnych dostaw, ataku AI, obrony, transferu powierzchnia/orbita oraz zapisów.
- Osobny podgląd bez zapisu użytkownika: etapy grafiki i baza w rzeczywistym `MissionWorld` z HUD. Brak błędów konsoli. Dodatkowo sprawdzono sześć kart dostaw i przycisk manifestu w LobbyView, bez nachodzenia tekstów. Zrzuty: `dist/qa-lunar-stages.jpg`, `dist/qa-lunar-base-world.jpg`, `dist/qa-lunar-manifest.jpg`.
