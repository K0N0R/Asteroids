# 0.130 — zasoby i orbita Fobosa

Zaznaczona na południe od Marsa grupa zasobów pochodziła ze złóż powierzchniowych Fobosa. Radar Marsa przeglądał wszystkie skały symulacji, w tym nieaktywne obiekty na innej warstwie. Wspólne filtrowanie skanu rozróżnia teraz orbitę i powierzchnię oraz ogranicza znaczniki do grywalnych map, także przy oddaleniu radaru. Skała, która chwilowo wydryfuje za granicę, nie jest pokazywana jako niedostępny zasób. Złoża na powierzchni Fobosa pozostają dostępne po lądowaniu.

Generator skał orbitalnych sprawdza, czy cały promień skały z dodatkowym zapasem 40 jednostek mieści się we właściwej mapie. Nie usuwa to przepływu asteroid, ale zapobiega tworzeniu pól poza obszarem gry.

Śluza Mars–Fobos ma na orbicie Fobosa nowe położenie `(28250, 1650)`, na południowym zachodzie względem środka `(30000, 0)`. Wspólna definicja aktualizuje oba kierunki podróży, radar, cele nawigacji i wolny od anomalii pas transportowy.

Usunięto skażenie z południowej części orbity Fobosa. Większa strefa obejmuje północ i północny zachód, ze zmiennym brzegiem. Przybliżone pokrycie Fobosa wzrosło z 25% do 35%; Mars pozostaje przy około 75%, a mapa asteroidy jest czysta. Nowe pole nadal wychodzi poza grywalną granicę nieregularnym obrzeżem.

## Weryfikacja

135 testów zakresu zmian przechodzą (`dist/verify130-results.txt`). Nowe przypadki sprawdzają generowanie zasobów wewnątrz map, brak przeciekania powierzchni na radar orbitalny, pomijanie skał za granicą, zachowanie złóż po lądowaniu, położenie śluzy na południowym zachodzie oraz czyste południe i skażoną północ Fobosa. Dotychczasowe testy obu tras nadal potwierdzają wolny pas w grafice i polu obrażeń.

W podglądzie przeglądarkowym radar Marsa pokazał 133 prawidłowe zasoby, zero znaczników poza mapą i zero znaczników z powierzchni. 88 złóż powierzchniowych nadal istniało (`dist/radar130-resources.json`). Widok Fobosa potwierdza nowe położenie śluzy i północną anomalię.

Nowa północna strefa ma niewielką bezpieczną zatokę wokół sondy, połączoną z otwartą częścią orbity. Testy potwierdzają dostęp do sondy, starego statku i lądowania.
