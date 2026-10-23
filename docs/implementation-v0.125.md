# 0.125 — płynność zwykłego lotu

Przyczyną okresowych przycięć po 0.124 było synchroniczne rysowanie okna anomalii oraz zastępowanie i wysyłanie do GPU dużej tekstury podczas przesuwania lub obracania kamery. Pomiar samego czasu przygotowania obrazu przy wylocie nie obejmował kosztu jego wymiany podczas lotu.

Anomalia jest teraz podzielona na małe fragmenty o rozmiarze 512 jednostek. Rysowanie odbywa się w Web Workerze na OffscreenCanvas; główny wątek otrzymuje bitmapę i publikuje najwyżej jedną niewielką teksturę w klatce. Dodatkowy obszar poza kadrem jest przygotowywany z wyprzedzeniem. Każdy fragment ma zapas 128 pikseli dla rozmycia, przycinany przy rysowaniu — bez nakładania i bez zmiany globalnego wzoru włókien. Rozdzielczość pozostaje 1 piksel na jednostkę świata. Gdy worker nie jest dostępny, małe fragmenty są rysowane osobnymi zadaniami, poza funkcją renderującą klatkę.

Nie ma cache odwiedzonych miejsc: fragmenty opuszczające bieżące otoczenie kamery zwalniają teksturę i bitmapę. Zamknięcie sceny kończy worker, usuwa przygotowany wynik oraz oczekujące zadanie. Test w przeglądarce potwierdził po przejściu na powierzchnię Fobosa: 0 bitmap, 0 pikseli i 0 workerów.

## Sprawdzenie

Test porównawczy obejmuje kontrolowane przesuwanie statku i obrót kamery przez 481 klatek, ze zwykłą pętlą symulacji i renderowania. Wersja 0.124 miała maksymalny czas pracy klatki około 75 ms, P99 odstępów między klatkami 83.5 ms, maksimum 428.5 ms oraz sześć odstępów powyżej 33 ms. Końcowa próba nowej wersji miała P99 odstępów 24.3 ms, maksimum 33.6 ms i jeden odstęp powyżej 33 ms. Maksymalny czas pracy klatki spadł do 26 ms. Są to lokalne pomiary kontrolnego podglądu, nie gwarancja jednakowego FPS na każdym komputerze.

79 testów obejmuje również pokrycie obracającego się kadru fragmentami przygotowanymi z wyprzedzeniem, ograniczenie do jednego zadania w toku, publikację tekstury dopiero w aktualizacji sceny i pełne zwalnianie bitmap, tekstur oraz workera, w tym spóźnionej odpowiedzi po zamknięciu sceny. Dotychczasowe testy Marsa, hipernapędu, ratunku, grafiki, surowców i sprzątania pozostają w zestawie regresji. Kontrola typów, ESLint i build przechodzą.
