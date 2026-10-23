# 0.128 — anomalia i radar

Brzegi przejść mają silniejsze wieloskalowe odchylenia i zmienną szerokość, przy zachowaniu bezpiecznego rdzenia trasy. Pozostają pętle, rozwidlenia, polany i ślepe odnogi. Zmienione pole nadal pokrywa około 75% orbity Marsa i 25% orbity Fobosa.

Anomalia ma stałą warstwę delikatnej, miękko zakończonej mgły z tych samych wielokątów co granica zagrożenia. Pokazuje wnętrza między włóknami i podczas przygotowywania szczegółowych kafelków. Tekstura ma najwyżej 1024 piksele na dłuższym boku; nie powstaje ponownie podczas lotu. Siatki włókien odkształcają się mocniej i nieco szybciej, a jasność delikatnie pulsuje. Krawędzie sąsiednich kafelków mają wspólne współrzędne deformacji i tę samą fazę jasności. Animacja nie tworzy nowych rastrów ani wielkich buforów filtrów.

Radar ma promień 110 zamiast 88 pikseli (+25%). `]` przybliża, `[` oddala; skale to ×0.75, ×1, ×1.5, ×2, ×3, ×4. Przy zbliżeniu radar śledzi statek. Okrągła maska zapobiega rysowaniu obiektów poza radarem. Wskaźnik skali i opis celu mieszczą się pod większym okręgiem.

Mapa anomalii jest oznaczona stonowaną pomarańczą. Próbkuje to samo pole, którego używa mechanika obrażeń; koszt zależy od stałej liczby pikseli radaru, nie wielkości sektora. Powierzchnie nie dostają orbitalnej anomalii. Radar uwzględnia obie mapy podczas podróży przez śluzę.

Naprawiono pomijanie aktualizacji śladu w radarze Marsa i powierzchni oraz kasowanie historii przy każdej zmianie układu. Orbita i poszczególne powierzchnie mają osobne, ograniczone historie. Kropki zanikają przez 75 sekund; limit wynosi 240 pozycji na historię.

## Weryfikacja

- 127 testów zakresu zmian przechodzi: `dist/verify128-results.txt`. Obejmują drożność, pokrycie i zgodność granic, przejścia śluzami, rozmiar i zoom radaru, zanik śladu, sprzątanie grafiki i wcześniejsze scenariusze Marsa.
- W przeglądarce sprawdzono 2966 punktów niebezpiecznych oraz 1631 bezpiecznych, poza 120-jednostkową strefą miękkiej granicy: żadnego niewidocznego zagrożenia ani pomalowanej bezpiecznej próbki (`dist/radar128-coverage.json`).
- Zmiana układu zachowała wszystkie 58 punktów śladu. Fizyczne klawisze nawiasów zmieniają skalę w obie strony.
- Pomiar odkształcenia siatki wykazał maksymalnie około 47 jednostek przemieszczenia między dwoma ujęciami oddalonymi o 3 sekundy (`dist/radar128-motion.json`).
- Usunięcie sceny pozostawiło zero własnych bitmap, pikseli i workerów anomalii (`dist/radar128-cleanup.json`). To kontrola cyklu życia tej grafiki, nie dowód braku wszystkich możliwych wycieków podczas wielogodzinnej sesji.

- Kontrola typów, ESLint i build release przechodzą. W przeglądarce mediana odświeżenia HUD z mapą anomalii wyniosła 0.8 ms, P95 1.2 ms (120 prób; `dist/radar128-profile.json`). To koszt odświeżenia HUD, nie pomiar FPS całej gry.
