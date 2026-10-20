# Wdrożenie 0.97 — muzyka w tle

Podłączono dostarczony `frontend/assets/sounds/cc0/music/theme_loop.mp3` (195,03 s) jako jedną natywną pętlę Pixi Sound/Web Audio. Ten sam głos pozostaje przez bazę, start, lot i powrót. Zastępuje nieużywane listy odrębnych utworów bazy i lotu; nie ma kolejnego startu z callbacku końca utworu.

Panel ustawień ma niezależny przycisk i suwak Muzyka. Dotychczasowe ustawienia są respektowane, w tym wyciszenie domyślne. Włączenie przy zapamiętanym zerze ustawia 25%. Wyciszenie lub zero pauzuje instancję; wznowienie kontynuuje ją. Bazowy mnożnik utworu wynosi 0,35, a suwak skaluje go niezależnie od efektów.

Wyłączono stare czterosekundowe wygaszanie końca dla muzyki z `loop: true`. Import rejestrujący parser `@pixi/sound` jest jawny w punkcie startowym `frontend/index.ts`: po usunięciu starego korektora bundler usuwał import używany wyłącznie jako typ. Plik pozostaje oryginalny, dekodowany podczas preloadu; nie zmieniono efektów ani źródła utworu.

W izolowanej przeglądarce sprawdzono wyciszony start, włączenie po załadowaniu, idempotentną inicjalizację, 100 naprzemiennych zdarzeń bazy/lotu, jedną instancję, natywną pętlę, skalowanie głośności, niezależność efektów, wyłączenie/wznowienie, zero i globalne wyciszenie. Rzeczywistą granicę pętli sprawdzono przy przyspieszonym, wyciszonym odtwarzaniu tego samego zdekodowanego pliku. Nie powstał nowy głos ani wygaszenie. Wizualnie sprawdzono dodatkowy suwak i odstępy panelu. Bez pełnej regresji oraz bez ingerencji w zapis gracza.

Wersja aplikacji 0.97.0. Format kampanii 64 i dziennika 29 bez zmian. Pozostały backlog, w tym warianty części II–III, pozostaje w bieżącym planie.

Kontrola typów, lint zmienionych plików, 12 celowanych testów audio i kompilacja release przeszły.

Zbieranie surowców: krótki, przytłumiony dźwięk fizycznego uderzenia zastępuje piskliwą notyfikację. Wariant z paczki CC0 ma obniżoną wysokość, filtr 80–1400 Hz i niższą głośność. Aktualizacja dotyczy tylko collect; manifest i receptura przetworzenia zachowują odtwarzalność.

Karty zadań w bazie są sortowane przed stronicowaniem: główne, potem dodatkowe, z zachowaniem kolejności wewnątrz każdej grupy. Dotyczy zakładek Aktywne i Ukończone. Sprawdzono stan po sondzie księżycowej: Wyposażenie stacji na stronie pierwszej, dwa cele dodatkowe na drugiej; typecheck, lint i build przeszły.
