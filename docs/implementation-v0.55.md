# Implementacja 0.55 — przemysł i segmenty magazynowe

Stan: 2026-10-16. Pierwsza część pakietu gospodarki i stacji.

## Grywalny zakres

Panel **Stacja → Przemysł** pokazuje zapasy według kategorii, trzy nowe receptury, wspólną kolejkę mechanika i montaż segmentów magazynowych. Dotychczasowa ruda otrzymała nazwę „Ruda żelaza”, a części — „Komponenty konstrukcyjne”. Kryształy pozostają osobną kategorią minerałów.

Miedź pochodzi z miedzianych żył w bogatych asteroidach. Dwie dostępne od początku żyły znajdują się przy ziemskim złożu Fe / Cu. Ostatni rozbity fragment żyły daje dodatkowo rudę miedzi, zbieraną zwykłymi chwytakami. Inne sektory mogą zawierać miedziane odmiany bogatych asteroid. Miedź zajmuje miejsce w ładowni; do magazynu trafia po bezpiecznym powrocie. Odwrót i utrata statku tracą ładunek.

| Receptura | Koszt | Wynik | Czas |
| --- | --- | --- | --- |
| Przetop żelaza — istniejący | 8 Fe | 1 komponent konstrukcyjny | 45 s |
| Przewodniki miedziane | 4 Cu | 2 przewodniki | 45 s |
| Moduł zasilania | 3 komponenty + 2 przewodniki | 1 moduł | 60 s |
| Segment magazynowy | 12 Fe + 4 komponenty + 2 moduły | 1 segment | 90 s |

Nowe receptury wymagają warsztatu I i mechanika. Produkcja działa podczas symulowanego lotu, korzystając z istniejącej kolejki do trzech zleceń. Czas w stacji i przy zamkniętej grze nie przyspiesza pracy. Kolejka rezerwuje miejsce na zwrot składników lub produkt; anulowanie oddaje cały koszt raz. Pozostałe receptury zachowują działanie.

Montaż kosztuje **1 gotowy segment + 20 Fe + 2 komponenty**, wymaga mechanika i warsztatu I. Każdy z trzech segmentów zwiększa magazyn o 200. To rozszerzenie istniejących poziomów magazynu; łączna maksymalna pojemność wynosi 1050. Wszystkie nowe przedmioty liczą się do zajętości. Przy przepełnieniu po powrocie pierwszeństwo mają konstrukcje, moduły, przewodniki, kryształy, komponenty, miedź i żelazo.

## Zapis

Format kampanii **35**, dziennika fabularnego **15**. Zgodnie z decyzją autora parser akceptuje wyłącznie bieżący format. Starsze zapisy są odrzucane z komunikatem; brak migracji. Ilości nowych przedmiotów i limit segmentów są walidowane.

## Weryfikacja

- **392/392 testy**, bez pominięć; w tym 8 nowych testów przemysłu.
- Test zwykłej symulacji: bazowy Prospector rzeczywiście dolatuje, rozbija żyły, zbiera Cu chwytakami i dokuje. Zebrana miedź przechodzi cały łańcuch produkcji do montażu magazynu. Wejście przygotowuje warsztat, mechanika oraz żelazo i komponenty; nie dodaje miedzi. Nie jest to pełne przejście kampanii od nowego zapisu.
- Sprawdzone koszty, anulowanie przy pełnym magazynie, czas pracy, zapis produktów, przepełnienie, strata i odwrót oraz limit montażu.
- Typecheck, ESLint i produkcyjny build przeszły.
- Przeglądarka, 1280×720: układ panelu, pobranie 4 Cu przy zleceniu, zwrot po anulowaniu, montaż i pojemność 150 → 350, zachowanie stanu po ponownym otwarciu. Brak błędów konsoli. Próba UI korzystała z przygotowanego bieżącego zapisu.

Dowody: [panel](validation-v0.55/industry.png), [kolejka](validation-v0.55/queued.png), [zamontowany segment](validation-v0.55/installed.png).

## Dalszy zakres

To pierwszy łańcuch, a nie zakończenie balansu gospodarki. Następny krok: odblokowywana tarcza Satuk 15, wykorzystująca moduły zasilania. Następnie pełniejsze zadania aktu I, minigra łączności i eskorta wydobywcza Muła. Drony strażnicze, dodatkowe rudy, surowiec merkuriański i pozostały backlog nie są częścią 0.55.

## Poprawka HUD po budowie stacji księżycowej

HUD nie zakłada już stałej liczby celów z chwili startu. Przy odświeżaniu dopasowuje pola do aktualnie odkrytych zadań i usuwa niepotrzebne widoki. Usuwa to wyjątek `Cannot read properties of undefined (reading 'setText')` po dostawie materiałów odsłaniającej kolejne cele.

Regresja: rzeczywisty MissionHud z symulacją lotu i celami księżycowymi, ujawnienie zadań po fundamentach i instalacjach, zmniejszenie listy, zwalnianie pól oraz wielokrotne odświeżanie bez narastania widoków. Łącznie 13/13 testów HUD, Księżyca i dialogów; typecheck, lint i build przeszły. Format zapisu bez zmiany.
