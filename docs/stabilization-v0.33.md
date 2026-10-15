# Stabilizacja wersji 0.33

Data: 2026-10-15. Bez nowych mechanik, zmiany formatu zapisu i arbitralnego przestawiania parametrów kadłubów.

## Poprawki

1. Zużycie zestawu naprawczego aktualizuje zapas zapisany w aktywnej wyprawie. Wytworzenie zestawu również zapisuje rzeczywisty stan zamiast historycznego maksimum. Naprawa, kolejka stacji, kontrola limitu i rozliczenie powrotu korzystają z tego samego aktualnego zapasu. Starsze zapisy pozostają czytelne; przerwane wyprawy nadal są rozliczane jako strata.
2. Okno złomowania pokazuje również odzyskiwane kryształy. Dostępność przycisku i wykonanie transakcji używają wspólnego `canScrapShip`, uwzględniającego wszystkie trzy surowce i rezerwacje magazynu. Eliminuje to aktywny przycisk przy faktycznie niewystarczającym miejscu.
3. Powstał [aktualny backlog](plan-current.md), odróżniony od historycznych zapowiedzi w starszym planie.

## Dodatkowe testy regresji

`tests/stabilization.test.ts` obejmuje:

- Zakup wszystkich 11 kadłubów, wszystkie sześć ulepszeń do poziomu III, odmowę dalszych zakupów bez pobrania opłaty, zapis i recykling. Zwrot odpowiada połowie wydanych surowców; niewystarczający magazyn blokuje transakcję bez usuwania statku.
- Granicę pojemności magazynu przy zwrocie kryształów.
- Zużycie zestawu w locie, produkcję trzech kolejnych w stacji, poprawność aktywnego zapisu i zapasu po powrocie.
- Do dwóch minut cykli ciągu, boostu, skrętu, hamowania i obu przycisków uzbrojenia dla każdego kadłuba. Normalne zniszczenie statku jest dopuszczalnym wynikiem; oceniamy poprawność symulacji, rozliczenia i zapisu, a nie nieśmiertelność. Ocalałe statki kończą dokowaniem.
- 30 minut symulowanego działania pełnego sektora przy Aurorze, z dryfem asteroid, patrolami i ciągłym użyciem broni. Kontrola skończonych współrzędnych, limitów pocisków/łupu i liczby ciał fizycznych. Sprzątanie oraz ponowne wywołanie `dispose` nie pozostawiają aktywnych kolekcji.

Efekty symulacji w testach są odbierane co krok, tak jak podczas renderowania. Nie jest to pomiar zużycia pamięci GPU ani rzeczywistej liczby FPS. Długi test chroni przed wzrostem kolekcji i błędami logiki; wykonuje się szybciej niż rzeczywiste 30 minut.

Wynik końcowy: `npm test` — 277/277, bez pominiętych testów (około 105 s łącznie); `npm run typecheck`, `npm run lint` i `npm run build` — zakończone poprawnie. `git diff --check` nie wykazał błędów białych znaków.

## Ograniczenia i dalsza kontrola

Próba otwarcia osobnego podglądu pod `localhost:3001` i `127.0.0.1:3001` zakończyła się timeoutem narzędzia przeglądarkowego. Nie potwierdzono w tej sesji wyglądu poprawionego okna, brzmienia audio, płynności renderowania ani odczuć sterowania.

Do ręcznej sesji pozostają: progresja od pustej kampanii do warsztatu II, opłacalność różnych zajęć, częstość utraty załogi, czytelność specjalizacji floty i pomiar FPS w najbardziej obciążonych miejscach. Dotychczasowe testy automatyczne nie uzasadniają ogólnego nerfu statku początkowego. Obecny Prospector ma już 300 prędkości i 1,15 skrętu wobec 620 / 2,35 Widma oraz 680 / 2,85 Żądła.
