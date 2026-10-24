# 0.137 — testowanie aktów od początku

W ESC przyciski sektorów zastąpiono punktami startowymi aktów. Wybranie przycisku tworzy od nowa osobny zapis testowy, kończy bieżącą wyprawę technicznie i przenosi do Satuk 15 przed pierwszym wylotem danego etapu. Przycisk „Resetuj bieżący akt / etap” wykonuje tę samą operację dla aktualnego etapu.

## Punkty startowe

I: Ziemia oraz dodatkowe wejście na Księżyc. II: Mars. III: Wenus. IV: Merkury. V: powrót na Marsa. VI: Pas. VII: Jowisz. VIII: Saturn. IX: Uran oraz dodatkowe wejście na Neptuna. X: Pluton. Mars jest rozróżniany według zdobytej technologii, więc reset aktu V nie uruchamia ponownie aktu II.

Każdy punkt jest generowany ze świeżej kampanii, z ukończonymi wymaganymi wcześniejszymi zadaniami i ich zależnościami. Wcześniejsze budowy zakładów są zaliczone, stare odprawy zapamiętane, a odprawa wybranego aktu pozostaje do odegrania. Misje bieżącego i przyszłych aktów nie są zaliczone. Dodatkowe wejścia księżycowe/neptunowe kończą odpowiednią wcześniejszą część swojego aktu.

Nie ma flagi omijającej blokady fabularne. Wyposażenie i zapas części odpowiadają poziomowi dostępnych zakładów: Swift na I, Sokół na II i Aegis na III; rezerwowy Muł, od aktu IV również Harpun. Dostępne są umiarkowane zapasy materiałów i punktów pilota. Początek aktu I jest identyczny ze zwykłą nową kampanią. Księżyc zaczyna się przed Warsztatem I. Akt II nie ma jeszcze tarcz, zbadanych punktów ani zaliczonych wydarzeń Fobosa. Akt V ma technologię Merkurego, lecz wymaga samodzielnego zbudowania ekstrakcji i zakładów II.

Nowy start usuwa z testu późniejsze technologie, statki, zasoby, wraki, sygnały ratunkowe, przesyłki i aktywną wyprawę. Zamyka również stare komunikaty, ich kolejkę, podglądy i nakładki, także gdy reset następuje w lobby.

## Oddzielenie zapisów

Klucze zapisu testowego i zwykłej kampanii pozostają osobne. Przejście z aktywnego lotu rozlicza techniczny powrót istniejącą ścieżką; dalsze starty i resetowanie postępu zapisują tylko tryb testowy. „Wróć do zwykłej kampanii” ponownie wczytuje zwykły profil. Test można wznowić po odświeżeniu strony. Format kampanii 67 i dziennika 32 pozostaje bez zmian.

## Weryfikacja

- 294/294 testów zakresu akceptacyjnego (`dist/act-start-acceptance.txt`), w tym kontrola wszystkich 12 początków, ich zapisów, dostępności celów oraz uruchomienia rzeczywistej symulacji i fizyki. To zestaw obejmujący zmieniane systemy, a nie deklaracja przejścia całej historycznej regresji.
- Każdy początek przechodzi synchronizację fabuły i walidację zapisu, nie zaliczając bieżących lub przyszłych misji. Powtórny reset generuje identyczny stan mimo dodanych późniejszych technologii, zasobów i komunikatów.
- Przeglądarka: rzeczywiste Core, GameSession i menu ESC. Wybrano akt II, zmieniono jego postęp, zresetowano go, wybrano akt V, uruchomiono wyprawę, zresetowano podczas lotu i wrócono do zwykłej kampanii. Po każdym kroku zwykły zapis był identyczny bajtowo. Reset usunął starą kolejkę radiową i aktywny świat; profil Plutona został poprawnie przywrócony. Brak ostrzeżeń i błędów konsoli.
- Dowody: [menu](validation-v0.137/act-start-menu.png), [obserwacje](validation-v0.137/browser-check.txt). Podgląd zastępuje localStorage pamięcią strony, więc nie odczytuje ani nie zapisuje kampanii gracza.
- Kontrola typów, pełny lint oraz build produkcyjny przechodzą. Bundle działającego lokalnego serwera deweloperskiego przebudowano.

Podgląd: `node scripts/qa-act-starts.mjs`, następnie `http://localhost:3002/qa-act-starts.html` na działającym serwerze deweloperskim. Przyciski diagnostyczne pozwalają zmienić stan Marsa, uruchomić lot i sprawdzić izolację zapisu.
