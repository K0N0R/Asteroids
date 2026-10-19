# Wdrożenie 0.87 — przemysł lokalny na Księżycu

## Dostęp do placówki

Po dostarczeniu pięciu modułów startowych można otworzyć lokalny panel przez przytrzymanie E przez 2 sekundy przy bazie na powierzchni. Statek musi zwolnić, nie może prowadzić ognia, wydobycia ani naprawy. Zagrożenie, uszkodzenie, obrona placówki, hiperskok i przejście orbitalne blokują dostęp. Dostawy aktualnej fazy i skan odbioru mają pierwszeństwo.

Panel wstrzymuje symulację i dźwięki lotu. Przycisk powrotu zamyka go bez rozliczenia wyprawy, zmiany statku i teleportacji. Ponowne otwarcie wymaga zwolnienia klawisza E. Każda transakcja ponownie sprawdza fizyczny dostęp i zgodność kampanii z symulacją.

## Magazyn i transport

Placówka ma osobny, nieograniczony magazyn zasobów oraz osobny licznik zestawów naprawczych. Zapas Satuk 15 nie jest współdzielony. Magazyn pokazuje pełne nazwy, ilustracje i kolumny stanu bazy oraz ładowni. Można odłożyć 1, 5 lub wszystko i zabrać 1, 5 lub maksimum mieszczące się na statku.

Transfer jest atomowy: sprawdza ilość, dostępny zapas, bezpieczne liczby całkowite i pojemność ładowni. Pobrane zasoby otrzymują oznaczenie frachtu. Ponowne odkładanie i przywożenie własnych zapasów nie nalicza doświadczenia za wydobycie. Wcześniej odłożony zapas pozostaje w bazie po utracie statku.

## Laboratorium i Warsztat

Dwie osobne zakładki korzystają ze wspólnych widoków receptur i ilustracji, ale pobierają składniki wyłącznie z magazynu księżycowego. Wynik trafia do tego samego magazynu. Produkcja działa ręcznie w partiach 1, 5, 10 lub maksimum; nie pracuje podczas lotu. Zwykłe wywołania produkcji Satuk 15 nadal blokują wytwarzanie podczas aktywnej wyprawy.

Poziom lokalny wynosi 0 po dostarczeniu modułów i 1 po końcowych dostawach żelaza oraz węgla. Poziom zaplecza Satuk 15 nie podnosi automatycznie poziomu placówki. Pozostają wymagania badań oraz blokady bardziej zaawansowanych receptur. Lokalne ulepszenia do poziomu 2 nie należą do tego pakietu.

Wyprodukowane zestawy naprawcze pozostają w placówce do ręcznego zabrania. Limit wyposażenia statku wynosi 2. Muł nie pobiera zestawów, ponieważ zachowuje darmową samonaprawę.

## Zapis i weryfikacja

Kampania ma format 55 i przechowuje lokalny magazyn oraz zestawy. Starsze formaty są odrzucane. Format dziennika pozostaje 22.

Typecheck, lint i kompilacja produkcyjna przechodzą. Pełna regresja: 568/568 testów. Siedem nowych testów sprawdza lokalne składniki, poziomy technologii, dostęp fizyczny, atomowe transfery, fracht i doświadczenie, pojemność, przepełnienia liczb, zapis po stracie, zestawy i przytrzymanie E.

Sprawdzono rzeczywisty widok na danych testowych w przeglądarce: odłożenie miedzi, syntezę wody, wykonanie i odebranie zestawu oraz pobranie surowca do ładowni. Brak błędów konsoli. Podglądy: `dist/qa-lunar-industry-lab.jpg` oraz `dist/qa-lunar-industry-warehouse.jpg`. To kontrola komponentu i transakcji; pełny przebieg kampanii od nowej gry nie był ponownie rozgrywany ręcznie.

## Dalej

Manifesty i koszty placówek Marsa oraz Wenus wymagają przejścia na konkretne części. Warianty materiałowe, części II–III, cztery obszary Ziemi i zapętlona muzyka pozostają w aktualnym planie.
