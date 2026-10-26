# Wenus — przebudowa grywalności i oprawy

2026-10-26. Uzupełnienie planu aktu III po rzeczywistym przejściu gracza. Dotychczasowe kryteria uznano za spełnione zbyt wcześnie: test bez trafienia sondy nie sprawdzał wznowienia transmisji, a widok przygotowany przez teleport nie sprawdzał podróży między lokacjami.

## Przebieg, który sprawdzamy jako całość

1. **Orbitalny zwiad.** Wenus pozostaje odległą planetą z paralaksą. Przekaźnik ma rozpoznawalną antenę, segmenty paneli, konstrukcję i sygnalizację. Dwa lokalne patrole są rzeczywistymi kontaktami, bez zapętlonych posiłków.
2. **Martwe laboratorium.** Śluza leży przy północno-zachodniej krawędzi orbity i prowadzi dalej na północny zachód. Wylot laboratorium leży po jego stronie skierowanej ku orbicie. Duża stacja ma czytelne moduły i korytarze podejścia do zewnętrznych terminali.
3. **Przywracanie zasilania.** F otwiera panel. Gracz odcina uszkodzoną gałąź, obraca połączenia i zasila chłodzenie, sterowanie oraz archiwum. Prąd i lampy pokazują skutki każdej decyzji. Bez limitu czasu, utraty surowców i kary za pomyłkę. Dopiero potwierdzenie poprawnego układu uruchamia stację. Ustawienia zostają zapisane po zamknięciu panelu.
4. **Powrót z archiwum.** Nawigacja prowadzi do lokalnego wyjścia, potem do Satuk 15. Dawny komunikat o kontakcie nie może pojawić się po bezpiecznym dokowaniu. Sama obecność jednostki na innej mapie nie oznacza ataku.
5. **Ekspedycja atmosferyczna.** Osobna sonda z anteną, osłoną i silnikiem leci do podejścia nad Wenus w środkowej części orbity. F rozpoczyna pięciosekundowe zejście wspólnym mechanizmem kamery z Księżyca. Powiększa się istniejąca Wenus z paralaksy; zachowujemy rzeczywisty statek i sondę. Gęstość atmosfery rośnie wraz ze zbliżaniem i maleje przy wznoszeniu. Pierwsza i ostatnia klatka zgadzają się z widokiem podczas normalnego lotu. Fizyczne przeniesienie odbywa się przed animacją, tak jak na Księżycu; w połowie nie zmieniamy układu współrzędnych. To osobny transfer pionowy, bez śluzy i przelotu do dalszej orbity. Osobny punkt wznoszenia pozwala odtworzyć przejście w odwrotnym kierunku. W atmosferze chmury całkowicie zasłaniają kosmos; burze mają czytelne granice. Trzy pomiary mają osobne miejsca i nazwy. Dane ukończonego pomiaru pozostają zapisane. Trafienie lub oddalenie eskorty wstrzymuje pracę, a usunięcie zagrożenia automatycznie ją wznawia.
6. **Horyzont i strażnik.** Zachowana sekwencja odkrywania informacji. Śluza SI przy północno-wschodniej krawędzi prowadzi do lokacji na północnym wschodzie. Sprawdzamy odblokowanie, walkę, wycofanie, powrót po pakiet i dostarczenie danych.

## Podział kodu

- `venusLayout`: położenia obszarów, śluz, pomiarów i burz; oba końce śluzy wynikają ze wzajemnego położenia map.
- `venusLaboratory`: wspólne wymiary modułów dla rysowania i kolizji.
- `venusPower`: logika obwodów, niezależna od Pixi i przebiegu lotu.
- `venusProbe`: lot sondy i zegar jej skanowania; aktualizacja trafień działa również podczas postoju.
- Osobne widoki przekaźnika, laboratorium, sondy i chmur. Widok aktu łączy warstwy, bez budowania całej grafiki i zasad w jednym konstruktorze.
- `venusTransfer`: dopasowanie wspólnej krzywej `lunarTransferPose` do początkowej paralaksy Wenus i gęstości atmosfery. `CelestialLayer` zachowuje tę samą instancję planety, a `Background` tę samą warstwę chmur i gwiazd. Osobna scena `VenusDescentView` została usunięta.

## Warunki odbioru

- Każda śluza znajduje się przy krawędzi swojego obszaru; wektor do drugiego końca prowadzi na zewnątrz. Powrót nie przecina własnej mapy.
- Nowy i wcześniejszy zapis Wenus zachowują wykonane zadania oraz ukończone transmisje. Stare pozycje sygnałów i wraków są przenoszone wraz z lokacjami.
- Trzymanie F nie naprawia laboratorium. Niepoprawna instalacja nie zalicza zadania; poprawna daje widoczny stan uruchomionej stacji.
- Sonda rzeczywiście otrzymuje trafienie w czasie badania, przeczekuje blokadę i wraca do pracy. Sprawdzamy też oddalenie gracza, zmianę mapy i ponowny wylot.
- Pełny przebieg używa prawdziwych śluz i interakcji. Widoki z teleportu służą wyłącznie oglądaniu grafiki.
- Ujęcia orbity, przekaźnika, stacji i atmosfery oraz wynik pełnego przejścia są częścią sprawdzenia. Skończenie kodowania nie oznacza zakończenia weryfikacji.
- Komunikat potwierdza się automatycznie po trzech sekundach od końca pisania. Podczas przejścia w atmosferę i pauzy jego zegar nie biegnie; ręczne zamknięcie nadal działa.
- Ciągłość renderowania jest sprawdzana w obu kierunkach, w 600 krokach na przejście: ta sama planeta, brak ukrywania warstwy, ciągła pozycja i skala, nieruchome kotwice tła oraz monotoniczna gęstość atmosfery. Pierwsza i ostatnia klatka odpowiadają zwykłemu lotowi. Statek i sonda zachowują stałe ekranowe położenie i rozmiar, bez tworzenia kopii.

## Sprawdzenie wykonania

- 85 testów powiązanych z Wenus, sterowaniem, komunikatami, grafiką, Keplerem, badaniami Marsa i odzyskiem: zaliczone. To wybrany zestaw regresji, nie wynik całego historycznego zestawu repozytorium.
- `tests/venus-flight.test.ts`: trzy wyprawy od początku aktu do dostarczenia końcowego pakietu. Pilot używa skrętu, ciągu, hamowania, zwykłych pocisków i F. Nie zmienia pozycji ani zdrowia, nie usuwa przeciwników. Łączy obwody przez te same akcje co panel.
- Ten sam przebieg wykonany przez Core, GameSession i MissionWorld w przeglądarce. Sześć zadań, trzy udane dokowania, transmisja 3/3, zapis poprawny i główna kampania nietknięta. Przyspieszono wyłącznie zegar QA; każdy krok fizyki pozostaje normalnym krokiem gry. Najniższy kadłub: około 43 HP.
- Ręczne otwarcie konsoli klawiszem F, odizolowanie przebicia, obracanie łączników, uruchomienie laboratorium i widoczna zmiana lamp oraz celu na archiwum: sprawdzone w przeglądarce.
- Dziesięć resetów i zmian lokacji: jedna aktywna scena, poprawny zapis, brak błędów JS. Po zwolnieniu scen pamięć wróciła do około 118 MB; chwilowy szczyt obejmował tworzenie i sprzątanie kolejnych scen.
- Wymuszona utrata WebGL w atmosferze: raport z ostatnią minutą próbek, przywrócenie tekstur chmur i geometrii, bezpieczna pauza po powrocie kontekstu. Raport potwierdza `restored: true`. To sprawdza odzyskiwanie, nie wyjaśnia przyczyny wcześniejszych spontanicznych utrat kontekstu.
- Ujęcia i dane kontroli znajdują się w `dist/qa-venus-polish/`. Widoki do oglądania grafiki są oddzielone od pełnego przelotu bez ułatwień.

Automatyczny przelot dowodzi, że etapy da się połączyć i ukończyć. Przyjemność oraz poziom trudności dla dzieci nadal trzeba oceniać w ręcznych sesjach graczy; nie zastępuje tego zielony wynik testu.
