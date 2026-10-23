# 0.131 — nowa gospodarka, progresja floty i sterowanie

Stan roboczy: 2026-10-23. Mechaniki zaimplementowane, walidacja całej kampanii i dostosowanie pełnej regresji pozostają otwarte. Punktem odniesienia są [plan gospodarki](station-progression-rebalance-plan.md) i [plan floty](fleet-progression-controls-plan.md).

## Zakłady, receptury i kampania

- Osobne `laboratoryLevel` i `workshopLevel`, zakres 0–3. Warsztat nie przekracza Laboratorium; Laboratorium nie przeskakuje więcej niż jednego poziomu nad Warsztatem. Koszt, blokada i transakcja montażu mają wspólną implementację w `stationProgression.ts`.
- Pierwszy quest Ziemi wymaga rzeczywistego montażu Laboratorium I z 8 Fe, 2 Cu i 2 Si. Sam zapas w magazynie nie zalicza zadania. Warsztat I pojawia się po `lunar-attack`, kosztuje 4 stali, 2 krzemionki i 2 Cu.
- Paczka księżycowa zawiera 8 stali, 4 krzemionki i 2 wody. Dalsza rozbudowa wymaga 80 Fe i 4 C. Prefabrykaty pozwalają ukończyć Księżyc bez produkcji części. Placówka wspiera obronę ogniem, a Prospector 0 przeszedł test obu typów obrony.
- Muł AI ma trwały stan `active/destroyed/transferred`. Po zakończeniu obrony i powrocie ocalały statek trafia raz do floty Satuk 15. Zniszczony nie wraca w kolejnej wyprawie; jego strata nie blokuje Warsztatu.
- Usunięto receptury i zasoby oczyszczonej Cu/Si, przygotowanego tlenu i przewodników. Osiem procesów laboratoryjnych obejmuje cztery podstawowe materiały, SiC, ceramikę, MA i KR. Wszystkie 21 receptur części korzysta bezpośrednio z materiałów, bez poprzednich tierów i innych gotowych części.
- Po technologii Merkurego dziennik prowadzi przez adapter, pierwszą dostawę, Laboratorium II i Warsztat II. Trzy oznaczone punkty na Marsie mają po 32 porcje na wyprawę. Narzędzie górnicze I lub wyższe daje 4 porcje za 2 s aktywnej pracy; Harpun wymaga rzeczywistego wysunięcia ramion. Prospector, Manta i Feniks nie wydobywają anomalii.
- Baza Marsa wymaga części II. Badania Jowisza otwierają Laboratorium III i Warsztat III. Koszty zakładów, tarcz, dronów, adaptera, budowli, napraw i części specjalistycznych odpowiadają tabelom planu.
- Test transakcji potwierdza 146 porcji surowców i 43 operacje dla obu zakładów II oraz 439 porcji i 85 operacji dla obu III, z wykorzystaniem nadwyżek partii. Adapter i wcześniejsze zakłady nie wchodzą do tych dwóch budżetów.

## Flota i sterowanie

- Warsztat I otwiera dokładnie pięć projektów, II kolejne trzy, III kolejne trzy. Usunięto indywidualne blokady questowe kadłubów; tarcze Marsa nie otwierają Manty ani Bastiona.
- Prospector 0 jest wyłączony z produkcji, zakupu modułów, płatnego uzbrojenia i premii modernizacyjnych odzysku. Skrytki nie ulepszają startera, a odzyskana płatna broń jest rozbierana na części. Procedura awaryjna zapewnia starter bez dawnego przepisu.
- Manta: tylne działko, zero laserów, EMP na PPM, od 2 do 5 niezależnych holi przez moduł sterowania. Pokład pozwala wybrać hol i odpiąć jeden lub wszystkie; J odpina wybrany.
- Sokół: EMP na Q. Widmo: dziobowe działko LPM, dash PPM, kamuflaż Q. Atlas: rakieta LPM, granaty PPM, shockwave Q.
- Aegis: energia LPM, dwa krótkie lasery PPM, bufor tarczy Q, shockwave E, dwa chwytaki. Nie tworzy pomocniczego drona. Żądło: rapid fire, rakieta, kamuflaż, EMP. Feniks: dwa działka, dwa podpalające promienie, rakieta Q, shockwave E. Promienie Feniksa nie wydobywają skał.
- Wspólny kontroler Q/E działa na nowe naciśnięcie. EMP blokuje ostrzał bez obrażeń asteroid, lecz je odpycha. Shockwave raz uszkadza wrogów i odpycha skały. Namierzanie rakiet działa także dla Feniksa i Żądła. Moduły amunicji Żądła nie wzmacniają kamuflażu/EMP, a projektor Manty wzmacnia tylko jej impuls. Kamuflaż przerywa atak, bufor tarczy wygasa, podpalenia od dwóch promieni nie kumulują się bez ograniczeń.
- Wszystkie interakcje i śluzy obsługuje F. Przytrzymanie wybiera jeden cel, blokuje go do zwolnienia i nie przełącza automatycznie po utracie zasięgu. Śluza wymaga 2 s, zachowuje animowany przelot i wymaga zwolnienia przed powrotem.
- K i Spacja nie emitują akcji klawiatury. Dialogi obsługuje Enter lub przycisk. Fizyczne F/Q/E działają niezależnie od układu klawiatury. Utrata fokusu czyści klawisze i mysz; naciśnięcie Q podczas transferu nie uruchamia zaległej zdolności po przylocie.

## Widoki i zapis

Rozbudowa stacji ma własny moduł i stan nawigacji: listę urządzeń, podgląd poziomów, konkretne odblokowania, koszty i jedną akcję montażu. Z kosztów można przejść do receptury i wrócić. Ekran nieuruchomionej produkcji prowadzi do odpowiedniego projektu. Receptury wyższego poziomu oglądane z kosztów pokazują blokadę, zamiast przełączać się po cichu na wodę.

Poprawiono układ pięciu składników części III, ilustracje nowych materiałów, opisy modułów, oferty i podglądy floty, etykiety śluz, HUD oraz instrukcję sterowania. Sprawdzono wizualnie podglądy Laboratorium II/III i recepturę Elektroniki III. Zrzuty robocze znajdują się w `dist/progression-laboratory-iii.png` i `dist/progression-recipe-iii.png`.

Format kampanii **67**, dziennika **32**. Starsze zapisy są odrzucane zgodnie z dotychczasową polityką nowego formatu; wymagane rozpoczęcie nowej kampanii. Zaktualizowano wersję aplikacji do 0.131.0.

## Weryfikacja i pozostałe prace

`npm run typecheck` i `npm run build` przechodzą. **144/144 testy rozszerzonego zestawu akceptacyjnego przechodzą.** Zestaw obejmuje gospodarkę, niezależne zakłady, wszystkie tiery części, rzeczywistą ekstrakcję i dostawę, ograniczenia Prospectora, podstawowe zestawy walki, input, obie obrony Księżyca, trwałą paczkę, śluzy, pięć holi Manty z lądowaniem i stratą oraz regresję radaru/Fobosa.

Uruchomienie zestawu w PowerShell:

```powershell
$env:TEST_FILES='^new-|^progression-flow|^input-controls|^chemistry|^part-tiers|^lunar-(defense|assault|shipment)|^hyperdrive|^phobos-maze|^radar|^hulls|^refit'
$env:TEST_REPORTER='spec'
npm test
```

Pełna historyczna regresja nie jest zielona. Ostatni szeroki przebieg przed dostosowaniem dodatkowych testów floty: 523/741 pozytywnych, 218 błędów; szczegóły w `dist/progression-full-final.txt`. Dla porównania uruchomiono źródła z HEAD 0.130 w oddzielnym, ignorowanym katalogu `dist/progression-baseline-0130`: 590/707 testów przeszło, 117 nie; pominięto `pilots.test.ts` po zawieszeniu oryginalnej nieograniczonej pętli. Pozostałe testy wymagają rozdzielenia wcześniejszych błędów od oczekiwań zmienionych przez nowy kontrakt gry: produkowalnego/ulepszanego Prospectora, warsztatu przed Księżycem, starych paczek, E/H/Spacji i dawnych zestawów Aegisa/Widma/Feniksa.

Do domknięcia: dostosować pozostałą regresję, przejść ciągłą kampanię bez skrótów do stanu questów i stroić siłę walki wszystkich kadłubów na dostępnych poziomach modułów. Dotychczasowe próby fizyki i transakcji nie zastępują pomiaru czasu całej kampanii ani końcowego balansu walki.
