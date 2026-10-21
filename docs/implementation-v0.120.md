# 0.120 — ładownie, spokojniejszy uzysk i sprzątanie scen

## Ładownie

Wszystkie 14 kadłubów ma bazową pojemność zwiększoną o 25%, zaokrągloną w górę do całej porcji. Moduł ładowni daje mnożniki bazowej pojemności: I ×1.25, II ×1.5, III ×2. Mnożniki nie kumulują się między poziomami. Prospector: 50 bazowo, 63 / 75 / 100 z modułem I / II / III. Wspólna funkcja wylicza pojemność w kampanii, locie i porównaniu modułów hangaru. Istniejące statki korzystają z nowych parametrów bez migracji zapisu.

## Surowce

Zmniejszono przesadzony uzysk z 0.119: żelazo i stały tlen do `ceil(promień / 17)` na fragment, bogate domieszki do połowy tej podstawy z minimum jedną porcją. Miedź i krzem mają po 4 porcje zamiast 6, wodór 4 zamiast 8, węzeł tytanowy 4 zamiast 6. Węgiel, zwykłe domieszki i dodatkowe pola Marsa pozostają. Test nadal wymaga na spokojnej orbicie co najmniej dwukrotności surowcowego kosztu tarcz Satuk 15 i dwóch zapasowych Prospectorów. Magazyn nie jest przeliczany, skład skał już trwającej wyprawy pozostaje ustalony.

## Pamięć

- Zamykany panel pokładu niszczy swoją zawartość i callbacki przycisków, które dotąd zatrzymywały ostatnią symulację aż do ponownego otwarcia panelu. Wspólny cykl popupów wywołuje teraz metodę `hide()`.
- Po usunięciu świata oraz HUD-u zwalniane są wolne bufory tekstur i canvasów Pixi. Zachowane zostają koszyki puli oraz aktualnie używane tekstury: publiczne `clear()` Pixi usuwa koszyki potrzebne do późniejszego zwrotu wypożyczonych tekstur. Wąski dostęp do pól wewnętrznych jest chroniony testem zwrotu żywej tekstury i wymaga ponownej weryfikacji przy aktualizacji Pixi.
- Wybór tego samego sektora i niezmienionego zestawu ciał niebieskich nie przebudowuje grafik i ich cache przy każdej czynności w bazie.
- Właściciel czterech współdzielonych kontekstów gwiazd zwalnia je przy zniszczeniu tła. Ustawienie identycznego tekstu nie uruchamia ponownie aktualizacji etykiety.

To konkretne poprawki cyklu życia zasobów, nie potwierdzenie całkowitego usunięcia zgłoszonego wzrostu pamięci Chrome do około 13 GB.

## Weryfikacja

63 testy przechodzą: ładownie wszystkich kadłubów i podgląd ulepszeń, wydobycie i budżet receptur, Akt II, hipernapęd, ciała niebieskie i sprzątanie zasobów. ESLint zmienianych plików, `npm run typecheck`, `npm run build` i `git diff --check` przechodzą. Nie oznacza to zielonego całego historycznego zestawu testów: wcześniejsze 10 błędów fixture'ów w story/mars-base odtworzono również na HEAD podczas wdrożenia 0.118.

Osobna przeglądarkowa próba 24 pełnych cykli GameSession obejmowała wylot, panel pokładu, powrót i ponowne wyświetlenie bazy. Po każdym powrocie: zero dzieci świata misji, dwa stałe kontenery UI, pusty panel pokładu, 87 aktywnych kontekstów grafiki. Odczyty sterty JS 89–250 MB z okresowym odzyskiwaniem pamięci. Dodatkowe próby obejmowały 24 bezpośrednie cykle świata/HUD-u oraz dłuższy lot.

Dłuższa seria ukończyła 60 pełnych cykli, każdy z 600 klatkami lotu i animacjami wylotu/powrotu. Po wszystkich powrotach zachowano te same liczby obiektów i kontekstów; wolna pula tekstur miała poniżej 1 MB. Sterta JS w pomiarach po powrocie wynosiła 149–645 MB, końcowo 508 MB; pomiędzy szczytami występowały spadki po GC (np. 602 → 242 MB w końcowej części). Nie należy utożsamiać stałej liczby obiektów grafiki ze stałą całkowitą pamięcią procesu. Robocze logi pomiarów i screenshot są w `dist/memory120-*-after.*`; testy regresyjne są w `tests/render-memory.test.ts`.

Testy przeglądarkowe korzystają z osobnej karty i wyłączonego dźwięku, przyspieszonego zegara symulacji i ręcznie kończonych wypraw. Nie odtwarzają wielogodzinnej gry ani pamięci wszystkich procesów Chrome/GPU/audio. Jeśli objaw pozostanie, konieczny będzie profil sterty i alokacji z rzeczywistej długiej sesji, szczególnie przed i po dokowaniu.
