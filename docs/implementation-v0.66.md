# 0.66: mieszane obrony placówek

Stan: 2026-10-17.

## Przegląd pracy Copilota

Sprawdzono pakiety 0.64 i 0.65: hangar trzech dronów, lokalny patrol i naprawy, płatną odbudowę oraz cztery role przeciwników, ich ostrzał, leczenie i miny. Przejrzano integrację z symulacją, obrażeniami, powierzchniami, zapisem i marsjańską stocznią. Wyjściowa regresja: 439/439 testów. W przejrzanym zakresie nie stwierdzono blokera. Nie oznacza to ciągłego przejścia całej kampanii ani zakończenia balansu.

## Zmiany

Trzy fale w każdej obronie; skład zależy od placówki:

| Placówka | Fala 1 | Fala 2 | Fala 3 |
| --- | --- | --- | --- |
| Księżyc | patrol, przechwytujący | patrol, przechwytujący | Lancer, Serwisant |
| Wenus | patrol, przechwytujący | Lancer, Serwisant | Pancernik, stawiacz min |
| Mars | dwa patrole, przechwytujący | Lancer, Serwisant, przechwytujący | Pancernik, stawiacz min, Serwisant |

Łącznie 6, 6 i 9 przeciwników zamiast po trzech. Pomiędzy falami pozostaje sześć sekund, limit walki wynosi 120 sekund na falę. Placówka ma nadal 180 punktów wytrzymałości; gracz musi chronić ją i dobierać priorytety. Następna fala rusza dopiero po pokonaniu całej poprzedniej.

Punkty podejścia uwzględniają obrót i skalę rzeczywistej kamery, pełny promień statku, margines interpolacji, granice sektora i istniejące przeszkody. Wrogowie muszą fizycznie dolecieć. Nie ma linii ani znacznika uprzedzającego kierunek ataku AI. Radar pokazuje rzeczywiste kontakty; zapowiedzi salw broni i ostrzeżenia przed asteroidami pozostają. Jeśli nie ma poprawnego miejsca, wdrożenie czeka; po 12 sekundach próba kończy się komunikatem i możliwością ponowienia. Częściowo wpuszczone jednostki nie są powielane.

Zakończenie lub przerwanie próby usuwa jej pociski i miny, bez kasowania zagrożeń innych jednostek. Przerwanie, strata, odświeżenie i nagrody zachowują wcześniejsze reguły. Tarcza oraz drony Satuk 15 chronią tylko lokalne otoczenie stacji; nie otrzymują sztucznego zasięgu do odległych placówek.

Nie dodano trwałych pól: kampania 41, dziennik 19. Brak migracji. Zaktualizowano też backlog o nowe ustalenia autora: towarzysza w drugim Prospectorze, hipernapęd i paliwo, animację śmierci, raportowanie przez łączność, transfer ładunku, teren anomalii oraz przegląd paczek dźwiękowych. Te funkcje są zaplanowane, nie wdrożone w 0.66.

## Weryfikacja

Pięć nowych testów sprawdza kamerę przez niezależną transformację Pixi, rzeczywiste wejście pierwszej fali na powierzchni, składy i oczekiwanie na całą falę, zablokowane podejścia i ponowienie oraz sprzątanie wyłącznie min własnej obrony. Test zwykłego Prospectora na Księżycu chroni placówkę, wybierając napastnika najbliższego bazy, bez podnoszenia statystyk gracza. Istniejące scenariusze sprawdzają pełną obronę i raporty Wenus oraz Marsa.

Pełna regresja: **444/444 testów**, bez pominięć. `npm run typecheck`, `npm run lint`, `npm run build` i `git diff --check` zakończone poprawnie. Brak ręcznego przejścia nowych obron w przeglądarce; końcowy balans wymaga testów graczy.
