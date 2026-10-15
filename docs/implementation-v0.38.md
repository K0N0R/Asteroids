# Wersja 0.38 — audyt i stabilizacja fundamentów

Data: 2026-10-15. Zakres: fundamenty sandboxa przed fabułą i kampanią.

## Wynik audytu

Pierwszy etap implementacji jest technicznie zamknięty: główne mechaniki mają sprawdzone cykle, narzędzia powtarzalnych prób działają, wykonano pierwsze porównanie statków, sprawdzono progresję ekonomii oraz zmierzono działające renderowanie. Audyt wykrył i usunął problem zwalniania grafiki po zmianach widoków oraz brak w pomiarach osłony Aegisa.

To baza do projektowania docelowych misji i kampanii. Obecny sektor i kontrakty pozostają sandboxem; kolejne iteracje balansu wynikające z gry ludzi będą częścią rozwoju, bez dokładania teraz nowych kadłubów i liftingów.

## Naprawy

1. **Zwalnianie grafiki.** W używanej wersji Pixi 8 wywołanie `destroy({ children: true })` nie zwalnia własnego kontekstu obiektu Graphics. Zastąpiono je przejściem po drzewie i domyślnym `destroy()` każdego obiektu. Zwalnia to własne konteksty statków, HUD, paneli, obrońców i twierdzy. Współdzielone konteksty asteroid pozostają własnością biblioteki i są zwalniane raz na końcu misji. Dwa testy regresji sprawdzają obie reguły.
2. **Osłona Aegisa w raporcie.** Obrażenia pochłonięte przez impuls obronny są teraz doliczane do osłon przed tarczą kinetyczną. Test obejmuje absorpcję impulsu, wyczerpanie tarczy i ograniczenie obrażeń do pozostałego kadłuba. Parametry walki nie zostały zmienione.

## Pomiary dostępne w grze

Raport F7 pokazuje średni FPS, p95 czasu klatki, najdłuższą klatkę, liczbę klatek ponad 33,34 ms oraz początkową, końcową i szczytową pamięć sterty JS, jeśli przeglądarka ją udostępnia. Przez pierwszą sekundę pomijamy rozgrzewkę. Pauza, TAB, wybór prototypu i ukryta karta nie doliczają przerwy do klatek. Krótka próba jawnie pokazuje brak próbek.

Pomiary pochodzą z rzeczywistych odstępów aktualizacji Pixi przed ograniczeniem delty symulacji. Obejmują pracę przeglądarki i renderera; nie są osobnym pomiarem czasu GPU. Histogram p95 ma rozdzielczość 1 ms i ostatni przedział od 2000 ms; maksymalna klatka pozostaje nieograniczona. Pamięć JS nie obejmuje całego procesu, GPU ani pełnej pamięci WASM. Nie wymuszamy odśmiecania i nie wyciągamy wniosków o wyciekach z pojedynczego odczytu sterty.

Pomiar produkcyjnego buildu w przeglądarce aplikacji, okno 1280 × 720, seed 71. Długiej próby końcowej nie wykonywano równocześnie z testami ani audytem Node.

| Próba | Czas symulacji | FPS | p95 / max klatki | Klatki >33,34 ms | JS początek → koniec / szczyt |
|---|---:|---:|---:|---:|---:|
| Prospector 0, pełny sektor, lot — przed poprawką sprzątania | 26,2 s | 143,9 | 8 / 21,7 ms | 0 | 30,2 → 39,3 / 146,4 MB |
| Aegis III, walka z dronem wsparcia — przed poprawką sprzątania | 28 s | 144 | 8 / 15,6 ms | 0 | 69,3 → 54,3 / 194,4 MB |
| Aegis III, dziesiąty restart, wersja 0.38 | 2,3 s | 144 | 7 / 7,1 ms | 0 | 106,8 → 110,4 / 121,8 MB |
| Aegis III, pełny sektor, przelot przez złoże i 25 s ostrzału, po serii restartów | 141,2 s | 143,7 | 8 / 27,1 ms | 0 | 130,9 → 142,8 / 369,1 MB |

Przed poprawką dłuższa sesja po restartach kończyła się odczytem 414,8 MB po 105,9 s (szczyt 449 MB). Po poprawce sterta w końcowej, dłuższej próbie wróciła do 142,8 MB. To obserwacja razem z potwierdzonym błędem sprzątania i testem zwalniania kontekstów; nie równoważny benchmark procentowej redukcji pamięci. Przebiegi różnią się długością i szczegółami sterowania.

W końcowej serii nie wystąpiły błędy ani ostrzeżenia konsoli. Powrót do bazy zachował normalnego Prospectora, Mirę Voss, zasoby 0/0/0 i jeden zestaw. Pomiary nie oznaczają gwarancji 144 FPS na innym sprzęcie.

## Pierwsza runda porównań

Uruchomienie: `npm run audit:sandbox`. Skrypt zapisuje JSON i CSV do `dist/audit/`. Snapshoty tej rundy: [224 próby](validation-v0.38/balance.csv) i [progresja kampanii](validation-v0.38/progression.json).

Macierz: 14 kadłubów × poziomy 0 i III × seedy 71 i 2026 × 4 próby. Każda trwa do 40 s symulacji: wydobycie małego pola, wydobycie powiększonego pola, dwa patrole i dwa Lancery. Większe pole dodaje 25 bogatych skał, a Lancery zastępują patrole w tych samych pozycjach. Startowe pozycje walki są stałe, więc dwa seedy nie stanowią dwóch różnych układów przeciwników. Wszystkie próby korzystają ze standardowego wariantu uzbrojenia.

Pilot skryptowy kieruje kadłubem do najbliższego celu, hamuje, zbiera łup i używa obu akcji. Harpun i Widmo dostają ponawiane naciśnięcia wymagane przez ich broń. To mierzalna próba techniczna, nie optymalna taktyka gracza. Nie nadajemy jej statusu rankingu siły statków.

| Kadłub | Ładunek po 40 s, duże pole, średnia seedów, 0 / III | Dwa Lancery, czas s, seed 71, 0 / III |
|---|---:|---:|
| Prospector | 40 / 65 | 2.63 / 2.53 |
| Swift | 24 / 69 | 2.3 / 2.28 |
| Muł | 104.5 / 112 | 10.42 / 6.13 |
| Bastion | 30 / 75 | 2.22 / 2.53 |
| Manta | 60 / 99 | 2.6 / 2.32 |
| Sokół | 60 / 89 | 2.43 / 2.33 |
| Widmo | 0 / 0 | 24.1 / 4.07 |
| Atlas | 95.5 / 110.5 | 6.9 / 4.27 |
| Harpun | 55.5 / 94 | 5.08 / 3.08 |
| Aegis | 22.5 / 35 | 2.45 / 2.25 |
| Żądło | 20 / 29.5 | 1.8 / 1.37 |
| Feniks | 55 / 95.5 | 4.77 / 2.73 |
| Raider | 17 / 17 | 2.6 / 1.88 |
| Lancer | 17 / 17 | 2.58 / 1.73 |

Wyniki potwierdzają użyteczne różnice ról: Muł przewozi znacznie więcej niż Prospector, Żądło dobrze radzi sobie z ciężkimi celami, a wsparcie Aegisa i pancerz nie przekładają się automatycznie na najlepsze wydobycie. Na tej podstawie nie zmieniano cen ani obrażeń w ciemno.

Bazowe Widmo w próbie ze zwrotnymi patrolami ginie po zniszczeniu jednego; wersja III kończy walkę. W próbie Lancerów bazowe Widmo wygrywa. To konkretny punkt dalszych testów graczy: taktyka doskoku, wycofania i kamuflażu. Skrypt pomija taktyczne użycie kamuflażu. Nie zakwalifikowano tego jako niesprawnej mechaniki ani uzasadnienia automatycznego wzmocnienia statku.

## Ekonomia i zapis

Świeża, zwykła kampania z Prospectorem dotarła do warsztatu II po **12 udanych wyprawach**, łącznie **369,7 s symulacji**. Wykorzystano normalnie wygenerowane sektory (seedy 71–82), rzeczywiste wydobycie, lot, dokowanie, nagrody kontraktu, zatrudnienie mechanika, rafinację i przetop kryształów. Nie dodawano zasobów ani nie teleportowano statku. To sprawdzenie dostępności progresji, nie przewidywany czas przejścia przez człowieka.

Każdy powrót przechodzi zapis/odczyt i próbę ponownego rozliczenia, która nie może wypłacić nagrody. W trasie zakupiono magazyn I; jeden powrót miał 28 jednostek przepełnienia, jawnie zachowanych w raporcie. Po warsztacie II zostało 193 rudy i 8 komponentów. Dalsze magazyny i wybór zakupów pozostają decyzją gracza.

## Macierz cykli i regresji

| Obszar | Sprawdzone zachowanie | Dowody |
|---|---|---|
| Lot | boost, cofanie, hamowanie, kamera, kolizje, wszystkie kadłuby | `controls`, `hulls`, `stabilization` |
| Surowce | lasery i przeszkody, chwytaki, limity ładowni, trzy surowce, produkcja | `controls`, `crystals`, `quartermaster`, przebieg ekonomii |
| Walka | rzeczywiste emisje i trafienia, AI, broń specjalna, osłony, naprawy | `weapons`, `enemies`, `kinetic-shield`, `hulls`, `sandbox` |
| Infiltracja | skaner, zakłócenia, kamuflaż, przerwanie pobierania, dane i powrót | `outpost`, `hulls`, `equipment-visuals` |
| Dash | przebieg, trafienia, przeszkody i wyjście z fazy | `hulls`, `visual-gameplay` |
| Odzysk | podjęcie, zwolnienie, dwa hole, utrata, dostawa, śmierć po dostawie | `salvage`, `recovery` |
| Eskorta | rozpoczęcie, czekanie, omijanie skał, ostrzał, przerwane badania i ukończenie | `escort` |
| Prototypy | wybór, anulowanie, ograniczenia, wygaśnięcie po powrocie i śmierci | `prototypes` |
| Baza i flota | kupno, ulepszenia, odzysk, złomowanie, personel i limit magazynu | `stabilization`, `refit`, `recovery`, przebieg ekonomii |
| Trwałość | migracje, przerwana wyprawa, rozliczenie raz, izolacja sandboxa | `game`, `recovery`, `salvage`, `sandbox` |
| Widoki | pauza/TAB, F6/F7, ponowne wejścia, konteksty własne i współdzielone | kontrola przeglądarkowa, `display-cleanup`, `frame-diagnostics` |

Końcowe sprawdzenia: **304/304 testów**, TypeScript, ESLint, produkcyjny build oraz audyt ekonomii. Pełny zestaw zawiera także 30-minutową próbę symulacji i powtarzane cykle sterowania wszystkich kadłubów. Te długie testy nie są 30-minutowym pomiarem renderera.

## Granice zamknięcia etapu

Nie ma ujawnionego blokera technicznego wymagającego dokładania mechanik przed rozpoczęciem projektu kampanii. Balans jest wstępny, pomiary renderowania dotyczą tej przeglądarki i sprzętu, a długie sesje ludzi pozostają potrzebne przy rozwoju gry. Fabuła, docelowy układ misji i tempo rozwoju nie są częścią tego audytu. Wznowienie aktywnej wyprawy i produkcja przy zamkniętej grze pozostają świadomie odłożone.
