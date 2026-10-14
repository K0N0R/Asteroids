# Asteroids — plan pierwszej grywalnej wersji

Data: 2026-10-13. Plan zaktualizowany po odpowiedziach użytkownika; implementacja prototypu wydobywczego została rozpoczęta i jest grywalna. Aktualny zakres oraz uruchomienie opisuje README.md.

Wdrożono kolejny etap 0.2: mechanika stacji, kolejkę trzech zadań podczas lotu, produkcję komponentów i zestawów, awarię napędu oraz naprawę w locie. Szczegóły i weryfikacja znajdują się w `implementation-v0.2.md`. Dalsza rozbudowa załogi, praca offline i infiltracja pozostają poza obecnym prototypem.

Etap 0.3 dodaje zakup i przełączanie kadłubów oraz flotę z odrębnym wyposażeniem. Sterowanie początkowego Prospectora pozostaje na obecnym poziomie; jego docelowy nerf jest decyzją na późniejszy balans. Szczegóły: `implementation-v0.3.md`.

Etap 0.4 dodaje szansę przetrwania pilota i kadłuba oraz akcje ratunkowe do sektora straty. Podjęty cel trzeba dowieźć do bazy; powrót przywraca pilota i wyposażony statek. Szczegóły i roboczy balans: `implementation-v0.4.md`.

Etap 0.5 dodaje przekaźnik i obserwatorium, skanowanie danych, dwa kontrakty badawcze z odblokowaniami oraz trwałe liczniki wykonanych misji. Szczegóły: `implementation-v0.5.md`.

Etap 0.6 dodaje doświadczenie pilotów i wybór umiejętności po awansie: manewrowanie, wydobycie oraz procedury ewakuacji. Odzysk kapsuły zachowuje rozwój pilota. Szczegóły: `implementation-v0.6.md`.

Etap 0.7 wprowadza pierwszą walkę: patrole dronów przy cennych miejscach, wykrywanie z osłoną asteroid, pościg, ostrzał i łup po zniszczeniu. Strefa bazy jest chroniona, a lot gracza zachowuje obecny balans. Szczegóły: `implementation-v0.7.md`.

Etap 0.8 zastępuje sterowanie myszą i spacją przez WASD, obracane działka pod kadłubem, laser wydobywczy PPM oraz boost Shift. Kamera obraca świat z easingiem, a hol ma luźną linę i bezwładność. Szczegóły: `implementation-v0.8.md`.

Etap 0.9 (2026-10-14) dodaje sześć kadłubów zgodnych z konceptami użytkownika, łagodniejszy skręt i kamerę, rozwijalne dysze manewrowe, automatyczne chwytaki zbierające po jednej jednostce oraz kamuflaż pod C. Dotychczasowy Prospector przechodzi w zapisach na kadłub bojowy Bastion. Szczegóły: `implementation-v0.9.md`.

Etap 0.10 dodaje dwie skrytki na sektor, wybór jednego z trzech tymczasowych prototypów i nawigację pod 9. Siedem modułów daje różne kierunki rozwoju konfiguracji podczas wyprawy; premie wygasają po powrocie lub stracie, a wybór zatrzymuje symulację i załogę. Szczegóły: `implementation-v0.10.md`.

Etap 0.11 dodaje pierwszą infiltrację placówki Cerber: obrotowy skaner, kamuflaż, alarm z dwoma dronami, przechwyt danych i skrzyń oraz kontrakt Cichy przechwyt. Nawigacja pod 0 zachowuje dotychczasowe klawisze. Szczegóły: `implementation-v0.11.md`.

Etap 0.12 dodaje kontrakt Ochrona szlaku, licznik zniszczonych dronów, nawigację do ruchomego przeciwnika pod F oraz doświadczenie bojowe przyznawane po powrocie. Historia migruje do formatu 9. Szczegóły: `implementation-v0.12.md`.

Etap 0.13 dodaje intendenta, odzysk rudy z komponentów, równoległe kolejki pracowników, kontekstowe stanowiska w Załodze i rezerwację miejsca na produkty. Szczegóły: `implementation-v0.13.md`.

Etap 0.14 dodaje ciężkiego strażnika Lancer z własną sylwetką, dystansem, ładowaniem, pociskiem i łupem. Profile przeciwników współdzielą istniejącą fizykę i AI. Szczegóły: `implementation-v0.14.md`.


Etap 0.15 dodaje sabotaż skanera Cerbera: G przez 3 s, koszt jednego komponentu z ładowni, 20 s przerwy w skanowaniu. Aktywny alarm zostaje skasowany, ale drony pozostają zagrożeniem. Szczegóły: `implementation-v0.15.md`.

Z większych elementów wizji pozostają załoga pokładowa z zadaniami w locie, wymienne rodzaje broni i części, kradzież sprzętu oraz kolejne placówki i misje. Praca offline i wznowienie wypraw pozostają późniejszymi etapami. Pierwsza pętla wydobywcza, progresja, walka, infiltracja oraz ratunek są już grywalne.

## Cel i ustalenia

Gra 2D z widokiem z góry, kamerą śledzącą statek i dwiema fazami: spokojna baza oraz niebezpieczna wyprawa do proceduralnego sektora. Pierwsza wersja ma pozwolić wielokrotnie przejść pełną pętlę: przygotowanie → start → eksploracja/wydobycie/walka → powrót lub śmierć → rozliczenie → rozwój bazy → kolejny start.

Potwierdzone przez użytkownika:

- Docelowy projekt to `E:/Projects/asteroids`, oparty na znajdującym się tam boilerze Pixi.
- `Asteroids_old` jest punktem odniesienia dla perspektywy i sterowania. `astedroid` jest wcześniejszą próbą, z której można odzyskać użyteczne pomysły.
- Śmierć oznacza również trwałą utratę pilota; baza i jej rozwój pozostają.
- Aktualne sterowanie jest arcade: W przyspiesza, A/D skręcają, S hamuje i uruchamia wsteczny, Shift daje boost. Mysz celuje niezależnie od kadłuba, LPM strzela, a PPM obsługuje laser wydobywczy. Kamera obraca świat wokół statku. To zastępuje wcześniejsze sterowanie myszą i spacją.
- Priorytet v0.1 to wydobycie i eksploracja. Walka pojawi się później.
- Odświeżenie lub zamknięcie aktywnej wyprawy rozliczamy jako przegraną. Wznowienie stanu wyprawy jest przewidziane na później.
- Cechy pilotów na początek dają małe, czytelne zmiany sterowania. Później mogą wpływać na przeżywalność, statystyki i specjalne zdolności.
- Przyszła rozbudowa może pozwalać odzyskać wrak lub uratować pilota, zależnie od jego umiejętności i jakości statku. V0.1 rozlicza zniszczenie jako trwałą stratę.

Robocza interpretacja kary za śmierć: tracimy pilota, aktualnie używany statek z zamontowanym wyposażeniem, ładunek i modyfikacje znalezione podczas wyprawy. Magazyn bazy, inni zatrudnieni piloci, zapasowe części oraz rozwój stacji pozostają. Zakres straty wyposażenia jest propozycją do późniejszego doprecyzowania.

## Co wykorzystujemy z istniejących projektów

| Projekt | Wykorzystanie |
| --- | --- |
| Docelowy boiler, Pixi 8 | `Core`, `prepreload`, `preload`, generator manifestu, build esbuild, ustawienia, dźwięk, muzyka, efekty, komponenty UI, popupy, magistrala zdarzeń i podział czasu UI/świata. |
| `Asteroids_old`, Canvas2D | Zachowanie myszy, ciągu, strzelania, perspektywę, asteroidy i kamerę jako punkt odniesienia. Ruch zależny od liczby klatek i ręczne sprawdzanie wszystkich par kolizji zastępujemy nową symulacją. |
| `astedroid`, Pixi 7 + Matter.js | Wzorce osobnych światów lobby/misji, wersjonowania zapisu, konfiguracji przedmiotów i grup kolizji. Fragmenty przenosimy selektywnie po sprawdzeniu zależności i API. |

W boilerze `WorldContainer` i `UiContainer` są obecnie szkieletem. `GameState` przełącza lobby/gameplay, ale nie realizuje jeszcze wypraw, pauzy i rozliczania. Backend służy plikom statycznym; v0.1 pozostaje lokalną grą dla jednego gracza.

Przed rozbudową sprawdzamy: kolejność świata/HUD/popupów, blokowanie sterowania przez UI, czyszczenie klawiszy i przycisków myszy po utracie fokusu, poprawne usuwanie subskrypcji i timerów oraz osobny transform kamery. Obecny `Core` dodaje świat i UI po kontenerze popupów, więc kolejność wymaga uporządkowania. Nie przenosimy warstw opartych na `@pixi/layers` z Pixi 7 bez adaptacji.

## Zakres v0.1

### Wyprawa

- Jeden ograniczony, generowany z seeda sektor na wyprawę. Ten sam seed odtwarza układ startowy do debugowania; nie obiecujemy identycznego przebiegu całej symulacji.
- Kamera śledząca statek, mysz sterująca kierunkiem obrotu, spacja dająca stały ciąg, LPM strzelający i proponowany Shift uruchamiający hamowanie silnikami. Siła ciągu nie zależy od odległości kursora.
- Krótki rozbieg, szybki obrót, asysta zmiany kierunku ruchu i wyhamowanie po zwolnieniu spacji. Shift działa jako szybki hamulec z pierwszeństwem przed ciągiem. Zderzenia nadal obsługuje fizyka Rapier.
- Jeden kadłub gracza, jedno działko wydobywcze oraz ulepszenia silnika, ładowni i pancerza. Modyfikacje zmieniają parametry i widoczne elementy statku.
- Asteroidy o kilku rozmiarach i składzie; rozbijanie większych na ograniczoną liczbę fragmentów, wydobycie i zbieranie łupu do ograniczonej ładowni.
- Dwa surowce: częsta ruda do podstawowych zakupów oraz rzadsze komponenty do lepszych modułów i stacji. Bez rozbudowanych łańcuchów produkcyjnych.
- Zagrożenia pierwszej wersji: zderzenia z asteroidami i promieniowanie poza granicą sektora. Drony i wieżyczki odkładamy.
- Trzy rodzaje miejsc: pole wydobywcze, ruchomy pas asteroid i wrak z łupem.
- Dwa kontrakty wydobywcze: dostarczenie samej rudy oraz rudy i komponentów. Nagrody wypłacamy automatycznie po udanym powrocie, jeśli przywieziony ładunek spełnia wymagania.
- Tymczasowe modyfikacje wyprawy odkładamy na później; obecny wrak dostarcza rzadkie komponenty.
- Powrót przez strefę dokowania przy bazie: odpowiednia odległość i mała prędkość. Krótka, widoczna procedura dokowania zamiast zakończenia wyprawy z dowolnego miejsca.

Cel balansu: typowa wyprawa trwa około 8–12 minut, ale bez obowiązkowego timera. Gracz może zawrócić wcześniej. Bogatsze miejsca są bardziej ryzykowne; nie stosujemy globalnej trudności rosnącej automatycznie tylko z czasem.

### Baza

- Spokojny widok geometrycznej stacji i zadokowanego statku. Klikalne sektory otwierają hangar, tablicę kontraktów i panel pilotów. W v0.1 nie budujemy osobnego sterowania postacią chodzącą po stacji.
- Magazyn, rozliczanie łupu i kontraktów, zakup oraz montaż kilku modułów, zakup zastępczego kadłuba tego samego typu.
- Dwa ulepszenia stacji: pojemność magazynu i poziom warsztatu odblokowujący lepsze części. Rozbudowa ma zmieniać również wygląd bazy.
- Minimalny nabór pilotów: lista imion, po jednej cesze wpływającej na lot/walkę, cena zatrudnienia oraz wybór pilota przed startem. Brak drzewek doświadczenia i rozbudowanych relacji w v0.1.
- Trwała śmierć aktywnego pilota i ekran strat.
- Ochrona przed zablokowaniem gry: jeżeli nie mamy środków ani zestawu pozwalającego wystartować, dostępny jest słaby zestaw awaryjny ze stażystą. Bez darmowego odnawiania wartościowych modułów.
- Zapis lokalny z wersją formatu, walidacją danych i bezpiecznym powrotem do działającego stanu przy błędnym zapisie. Zapisujemy po zakupach, zatrudnieniu, starcie oraz rozliczeniu wyprawy.

### Poza v0.1

Pełne zatrudnianie załogi, kolejki zadań i produkcja, naliczanie pracy przy zamkniętej grze, wiele klas statków, rozbudowany crafting, walka, tymczasowe modyfikacje wyprawy, kamuflaż i infiltracja, naprawianie podsystemów podczas lotu, odzyskiwanie wraków i ratunek pilotów, frakcje, rozbudowana kampania i multiplayer.

Zrealizowane rozszerzenia: v0.2 — mechanik i kolejka zadań oraz naprawa awarii; v0.3 — flota i nowe kadłuby; v0.4 — ratunek pilotów i odzysk wraków; v0.5 — badania i kontrakty eksploracyjne; v0.6 — rozwój pilotów; v0.7 — walka i wykrywanie przez patrole AI; v0.8 — WASD, niezależne celowanie i hol; v0.9 — sześć kadłubów, chwytaki i kamuflaż; v0.10 — skrytki z tymczasowymi prototypami; v0.11 — infiltracja wrogiej placówki; v0.12 — kontrakt bojowy, nawigacja do dronów i doświadczenie za walkę; v0.13 — druga profesja bazy i równoległe kolejki; v0.14 — ciężki strażnik i profile przeciwników. Dalszy kierunek to więcej typów przeciwników i uzbrojenia, profesje załogi i gospodarka. Rozwinięcie infiltracji może objąć sabotaż i kradzież wyposażenia.

## Grafika i fizyka

Grafika powstaje z figur Pixi: kadłuby z wielokątów, dysze i działka z prostych modułów, asteroidy z wariantów nieregularnego obrysu, stacje z pierścieni i segmentów. Paleta i światła rozróżniają funkcje i strony konfliktu. Sylwetka oraz oznaczenia muszą również rozróżniać zagrożenia bez polegania wyłącznie na kolorze.

Geometrię tworzymy raz. Powtarzalne obiekty współdzielą `GraphicsContext`; bardziej złożone dekoracje można zamienić na tekstury generowane w czasie inicjalizacji. Nie potrzebujemy do tego zewnętrznych grafik. Gwiazdy, kilka warstw paralaksy, generowane mgławice i odległe planety budują głębię, a otoczenie bojowe pozostaje czytelne. Widok geometryczny wymaga zaprojektowania spójnego stylu, nie tylko losowania kształtów.

Rekomendacja: Rapier 2D, na start `@dimforge/rapier2d-compat`. Wariant compat osadza WASM i upraszcza integrację z obecnym buildem; wymaga asynchronicznej inicjalizacji i zwiększa rozmiar pakietu. Wersję wybieramy i przypinamy podczas implementacji po próbie integracyjnej. Matter.js pozostaje sensowną alternatywą, lecz nie przenosimy starego adaptera fizyki bez weryfikacji.

Plan symulacji:

- Brak globalnej grawitacji, jawna skala jednostek świata/fizyki.
- Stały krok 1/60 s z akumulatorem, ograniczeniem nadrabiania po długiej przerwie i interpolacją obrazu.
- Fizyczne kadłuby i asteroidy; uproszczone hitboxy niezależne od detali grafiki. Masa, siły i moment obrotowy wpływają na manewrowanie.
- Kolizje i uszkodzenia są osobnymi zagadnieniami: mocniejszy kontakt przy dużej prędkości względnej zadaje większe obrażenia, delikatne otarcie nie zabija.
- Dla szybkich pocisków badamy tor od poprzedniej pozycji do nowej przez ray/shape cast; dla szybkich fizycznych kadłubów rozważamy CCD. Sprawdzamy osobno trafianie w ruchome cele; CCD nie jest uniwersalną gwarancją braku przenikania.
- Zdarzenia kolizji, maski i sensory obsługują zbieranie łupu, dokowanie i przyszłe wykrywanie.
- Statki pozostają dynamiczne; kontroler obrotu realizuje zamiar gracza, nie nadpisuje bezwarunkowo pozycji i prędkości.

## Podział kodu

Rozszerzamy istniejący `frontend/core`, a kod gry dodajemy w `frontend/game`:

```text
frontend/game/
  config/      definicje kadłubów, modułów, pilotów, kontraktów i balansu
  state/       CampaignState, RunState, SaveRepository
  worlds/      LobbyWorld, MissionWorld, generator sektora
  systems/     fizyka, kamera, walka, łup, AI, rozliczanie wypraw
  entities/    statek, asteroida, pocisk, wrak, stacja
  graphics/    fabryki kształtów i zasobów generowanych
  ui/          HUD, hangar, kontrakty, piloci, ekran wyniku
```

`CampaignState` trzyma majątek bazy, pilotów, statki i odblokowania. `RunState` trzyma aktywnego pilota/statku, stan kadłuba, ładunek, modyfikacje wyprawy, cele i seed. Zapis zawiera zwykłe dane oraz identyfikatory konfiguracji, bez obiektów Pixi i fizyki.

Dotychczasowy `GameState` steruje fazą, pauzą i przejściami. Pauza/wynik są podstanami, więc nadal mamy dwa główne światy. `Core` pozostaje gospodarzem aplikacji. Magistrala zdarzeń służy wejściu, UI i powiadomieniom; systemy symulacji mogą wywoływać się bezpośrednio zamiast rozsyłać każdą zmianę pozycji przez bus.

Przejście misja → wynik → baza zwalnia ciała fizyczne, widoki, subskrypcje, timery i zasoby należące do wyprawy. Zasoby współdzielone mają osobnego właściciela. Rozliczenie wykonuje się raz: ponowne kliknięcie lub wczytanie nie może drugi raz przyznać łupu albo nagrody.

W v0.1 nie zapisujemy pełnej misji do wznowienia. Zapis startu oznacza aktywną wyprawę; wczytanie gry z takim znacznikiem rozlicza ją jako utraconą. To proponowana polityka chroniąca trwałą śmierć przed prostym odświeżeniem strony, do potwierdzenia przed implementacją zapisu. Pełne wznowienie z snapshotu może pojawić się później.

## Etapy wdrożenia i kryteria ukończenia

| Etap | Prace | Warunek ukończenia |
| --- | --- | --- |
| 0. Fundament | Uruchomienie boilera, kontrola TypeScript/lint/build, poprawki cyklu życia i wejścia, kolejność warstw, adapter Rapier i inicjalizacja. | Działa build developerski i produkcyjny; popup jest nad światem, blokuje sterowanie, pauza zatrzymuje symulację. |
| 1. Przyjemność lotu | Geometryczny statek, ciąg, obrót, dryf, hamulec, kamera, pole gwiazd i wskaźnik wektora prędkości. | Kilkuminutowy lot i dokowanie są zrozumiałe; zachowanie przy 30/60/144 FPS jest porównywalne, celowanie działa po zmianie rozmiaru okna. |
| 2. Wydobycie | Strzelanie, asteroidy, trafienia, fragmenty, surowce, ładownia i HUD. | Można wydobywać i zbierać; szybkie pociski trafiają, liczba fragmentów jest ograniczona, pełna ładownia ma jasny komunikat. |
| 3. Pierwsza kompletna pętla | Minimalna baza, start, powrót, śmierć, ekran wyniku i jeden zakup. | Można wykonać kilka wypraw z rzędu; powrót zachowuje łup, śmierć go usuwa, zakup zmienia następną wyprawę. |
| 4. Proceduralna wyprawa | Seed, skończony sektor, strefy ryzyka, pas asteroid, wrak i nawigacja do bazy/celu. | Spawn jest bezpieczny, cele mają dostępną trasę, świat się nie zawija i układ startowy można odtworzyć z seeda. |
| 5. Eksploracja i kontrakty | Ruchomy pas asteroid, zasobne pole, wrak i dwa kontrakty wydobywcze. | Można wybrać cel nawigacji, zebrać wartościowy ładunek, rozliczyć kontrakt lub wrócić wcześniej. |
| 6. Progresja i piloci | Hangar, moduły, ulepszenia stacji, nabór, trwała śmierć, zestaw awaryjny i wersjonowany zapis. | Porażka nie blokuje dalszej gry, zakup/strata są poprawnie zapisywane, misje i łup nie rozliczają się podwójnie. |
| 7. Jakość prototypu | Dźwięki, kontrast, podpowiedzi, odczucia trafień, balans, profilowanie i limity obiektów. | Pełna sesja 20–30 minut działa stabilnie; po serii wypraw nie rosną liczby subskrypcji, timerów i ciał fizycznych. |

Najpierw oceniamy etap 1: jeżeli obracanie, dryf i hamowanie nie dają satysfakcji, korygujemy lot przed dokładaniem gospodarki. Etap 3 jest pierwszym testem kompletnej gry; etapy 4–7 nadają jej charakter planowanej v0.1.

Weryfikacja obejmuje testy logiki generatora, kosztów, strat i jednokrotnego rozliczania, kontrolę TypeScript, lint/build oraz ręczne sprawdzenie lotu, kamery, UI i kolejnych wypraw. Cel wydajnościowy to stabilne 60 FPS na komputerze użytkownika po ustaleniu reprezentatywnej liczby aktywnych obiektów. Samo ukrywanie odległych obiektów nie wyłącza fizyki; streaming i usypianie wprowadzamy, jeśli pomiary skończonego sektora pokażą taką potrzebę.

## Dalsze decyzje projektowe

- Jak pilot i jakość kadłuba wpływają na szansę ratunku? Czy powstaje osobna misja ratunkowa z limitem czasu?
- Czy odzyskujemy cały kadłub, pojedyncze części, czy surowce z wraku? Jak oznaczamy jego położenie między proceduralnymi wyprawami?
- Czy wznowienie misji opiera się na snapshotach fizyki, czy serializacji własnego stanu świata?
- Jak rozwinąć walkę po pierwszych patrolach v0.7: kontrakty bojowe, odrębne uzbrojenie, czy kolejne role przeciwników? Wydobycie nadal pozostaje bezpiecznym sposobem rozpoczęcia kampanii.

## Źródła techniczne

- Pixi Graphics, współdzielenie geometrii i cykl życia: https://pixijs.com/8.x/guides/components/scene-objects/graphics
- Pixi — wydajność i tekstury generowane z kształtów: https://pixijs.com/8.x/guides/concepts/performance-tips
- Rapier — inicjalizacja i wariant compat: https://rapier.rs/docs/user_guides/javascript/getting_started_js/
- Rapier — CCD i ograniczenia: https://rapier.rs/docs/user_guides/javascript/rigid_body_ccd/
- Alternatywa Matter.js: https://brm.io/matter-js/docs/classes/Engine.html
