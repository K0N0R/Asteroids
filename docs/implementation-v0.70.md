# Wersja 0.70 — skupiska i dryf asteroid

Data: 2026-10-18. Rozwinięcie ziemskiego pakietu nawigacji z 0.69. Format kampanii 43 i dziennika 20 pozostaje aktualny; nie dodano migracji starych formatów.

## Zmiany w rozgrywce

Początkowe ziemskie skały otrzymują nieregularne przesunięcia zamiast równych rzędów. Układ jest deterministyczny. Osobny strumień losowania nie przesuwa pozostałej zawartości sektorów.

Dalekie złoże przy Ziemi składa się z trzech nierównych skupisk. Generator odrzuca nakładające się skały i zostawia prześwity. Zachowuje dotychczasowy budżet: 12 bogatych skał, w tym cztery z miedzią, te same rozmiary i zasady wydobycia.

Dwanaście skał dalekiego pola porusza się w łagodnym, lokalnym przepływie. Każda ma inny zasięg i fazę; dwa okresy ruchu tworzą zmienny tor zamiast wspólnego obrotu całego pola. Przepływ ogranicza prędkość docelową do 6 m/s i przyspieszenie do 1,8 m/s². Impulsy są przekazywane ciałom Rapiera: skały mogą zderzać się ze sobą i statkiem, a uderzenie może je wytrącić z toru. Nie są teleportowane ani ustawiane na sztywnej animowanej ścieżce.

Przy generowaniu korytarzy uwzględniony jest promień skały, zasięg jej dryfu i dodatkowe 150 m. Śluzy nadal kontrolują rzeczywiste przeszkody przed startem. Mocne zewnętrzne odepchnięcie obiektu pozostaje fizycznym zagrożeniem; nie ma gwarancji niezniszczalności ani usuwania przeszkód podczas skoku.

## Weryfikacja

Pełna regresja: **472/472 testy**. Typecheck, lint, build i `git diff --check` przechodzą. Końcowy build usuwa tymczasowe strony QA z paczki wydania.

- Cztery nowe testy: 100 seedów generatora z kontrolą zasobów, rozstawu i miejsca na dryf; nieregularny start Ziemi; trzy minuty rzeczywistej symulacji pola z kontrolą obu śluz; odzyskanie lokalnego ruchu po fizycznym impulsie bez teleportowania.
- Testy nawigacji sprawdzają nadal zwykły dolot Prospectora, skok i powrót, paliwo oraz kolizje. Próby misji od nowego startu, księżycowej obrony i przejścia Jowisza przechodzą po oddzieleniu losowania nowego złoża.
- Ręcznie sprawdzono renderowanie pola, zmianę pozycji i obrotu skał, stan statku i prześwit przy śluzie w przygotowanej kampanii. Brak ostrzeżeń i błędów konsoli. Nie było to ciągłe przejście całej kampanii.

## Zakres i dalsze kroki

To pierwszy dryfujący obszar kampanii. Pozostałe sektory, bariera pasa, osłony Merkurego i przytwierdzone skały powierzchni nie otrzymały tego przepływu. Sandbox zachowuje istniejący ruch asteroid i orbitalne strumienie Perseidów.

Następny spójny pakiet: automatyczne raporty przez rozmowę z bazą i animowany transfer surowców poza dokiem. Wymaga wspólnej zmiany rozliczania celów, częściowych dostaw, nagród i reguł powrotu. Następnie można dodać prowadzącego Prospectora AI do tego docelowego cyklu. Rozbudowa kolejnych sektorów pozostaje równoległym kierunkiem.
