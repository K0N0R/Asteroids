# Kierunki rozwoju floty — sześć konceptów użytkownika

Obraz jest inspiracją do sylwetek i ról, a nie specyfikacją obowiązkowych statystyk. Modele pozostają figurami Pixi, z materiałami obecnej floty, jasnoniebieskim szkłem i wyraźnymi mocowaniami wyposażenia. Eskorta i tarcze kinetyczne są wdrożone. Pierwsze dwa kadłuby, Atlas i Harpun, dodano w [etapie 0.27](implementation-v0.27.md); pozostałe cztery są konceptami.

| Koncept | Referencja liczbowa | Proponowana specjalizacja i uwagi |
| --- | --- | --- |
| Widmo | HP 55, cargo 18, speed 700, turn 2.60, boost 1.85, cloak .75; 1 działo / 1 krótki laser / 1 krótki chwytak | Wąski kadłub i zakrzywione skrzydła; infiltrator z wysokim kamuflażem. Musi wyróżniać się od Swifta działaniami skrytymi, nie samą szybkością. |
| Atlas | HP 200, cargo 150, speed 220, turn .75, boost 1.20, bez cloak; 1 działo / 2 średnie lasery / 4 długie chwytaki | Modułowy ciężki transport z zewnętrznymi kontenerami. Rozważyć wolniejszy załadunek lub koszt utrzymania, aby nie zastępował Muła w każdej roli. |
| Aegis | HP 170, cargo 45, speed 390, turn 1.30, boost 1.35, cloak .15; 2 działa / 2 krótkie lasery / 2 średnie chwytaki | Szeroka tarcza/sylwetka obrońcy, naturalna platforma do eskorty i tarcz kinetycznych. Nazwa koliduje z twierdzą Aegis: przed dodaniem kadłuba wybrać czytelne rozróżnienie lub inną nazwę. |
| Żądło | HP 80, cargo 20, speed 680, turn 2.85, boost 1.95, cloak .50; 2 działa / 1 krótki laser / 1 krótki chwytak | Smukły przechwytujący myśliwiec, mocny sprint i zwrotność, mała ładownia. Balans kamuflażu i ognia powinien oddzielić go od Widma i Sokoła. |
| Harpun | HP 110, cargo 75, speed 430, turn 1.55, boost 1.40, cloak .35; 1 działo / 1 średni laser / 4 długie chwytaki | Widoczne przegubowe ramiona, specjalizacja odzysku: kontrola holu i bezpieczne manewry z ładunkiem. Różnica od Manty powinna wynikać z narzędzi, a nie wyłącznie większych statystyk. |
| Feniks | HP 95, cargo 35, speed 540, turn 1.95, boost 1.70, cloak .45; 2 działa / 2 średnie lasery / 1 krótki chwytak | Ostre skrzydła i ciepłe akcenty, uniwersalny szturm. Do rozważenia umiejętność awaryjna po implementacji tarcz; unikać kadłuba lepszego od wszystkich obecnych. |

Podane wartości służą do późniejszych porównań. Kolejna paczka kadłubów potrzebuje cen, wymagań progresji, statystyk tarcz, masy/kolizji i czytelnej przewagi oraz słabości każdej roli. Najpierw mogą wejść Atlas i Harpun jako wyraźne warianty użytkowe, następnie obrońca powiązany z tarczami, a na końcu wyspecjalizowane szybkie kadłuby.

Aktualne ustalenie dla Harpuna zastępuje referencyjne działko i laser dwiema bojowymi szczękami: LPM zaciska, przytrzymanie PPM wysuwa ramiona ku celowi, a nieużywane ramiona składają się do kadłuba. Kontakt samych ramion nie uszkadza statku ani tarczy. Szczegóły obrażeń i specjalnych ulepszeń: [etap 0.27](implementation-v0.27.md).
