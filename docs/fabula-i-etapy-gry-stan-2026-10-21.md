# Satuk 15 — aktualna fabuła i etapy gry

**Dokument roboczy do refaktoru dalszej kampanii**  
Stan na 21 października 2026 r., wersja gry 0.106.0.

Dokument opisuje obecną zawartość i jej zależności. Nie jest nowym scenariuszem ani listą funkcji do automatycznego wdrożenia. Powstał na podstawie definicji zadań, warunków odblokowania sektorów, dialogów i mechanik rozliczania misji oraz wcześniejszych ustaleń autora.

Zgodnie z oceną autora **Ziemia i Księżyc są względnie spójnym, ukończonym fundamentem**, a pozostałe akty stanowią **szkielet fabularny i gameplayowy do przebudowy**. „Wdrożone” oznacza tutaj obecność reguły lub celu w grze, a nie finalną jakość narracji, balans ani potwierdzenie pełnego przejścia kampanii w ramach przygotowania tego dokumentu.

## 1. Co jest ustalone w fabule

Gracz jest Admirałem Sił Kosmicznych Ziemi i obejmuje dowodzenie nad orbitalną stacją Satuk 15. Organizuje ekspedycje, przydziela pilotów i statki, rozwija zaplecze oraz bada narastające anomalie w Układzie Słonecznym.

W założeniach autora anomalie wynikają z obecności obcej cywilizacji. W konflikcie występują trzy strony:

- oficjalne wojsko Ziemi;
- wroga prywatna organizacja kosmiczna;
- obca cywilizacja, której obecność nie oznacza automatycznie wrogości.

**Nadal nieustalone:** nazwa i motywacja prywatnej organizacji, cele obcych, relacje obu stron, tożsamość głównego przeciwnika, mechanizm anomalii, treść odkrycia przy Jowiszu i prawda ujawniana w finale. Nie należy uznawać technicznych nazw celów, jednostek ani bossów za odpowiedź na te pytania.

Historia ma dziesięć aktów. Akt nie odpowiada zawsze jednej planecie: Mars powraca w aktach II i V, akt II zawiera odprawę przy Ziemi, a akt IX obejmuje Uran i Neptun.

## 2. Obecna pętla gry i sposób opowiadania

Na stacji gracz wybiera sektor na mapie Układu Słonecznego, przegląda zadania, przygotowuje pilota i statek, produkuje wyposażenie i wyrusza. Podczas lotu wydobywa, walczy, skanuje, hakuje, holuje i dostarcza ładunki. Zdobyte zasoby służą produkcji oraz rozwojowi stacji i floty.

Postęp zadań jest trwały. Zależności otwierają następne cele i dalsze rejony. Zadania dodatkowe nie są warunkiem ukończenia aktów. Wcześniej odblokowane sektory pozostają dostępne. Cele przyszłe są ukrywane do chwili udostępnienia; HUD pokazuje aktywne zadania.

Skany i wyniki walk mogą zostać zatwierdzone przez radio w trakcie wyprawy. Fizyczny ładunek trzeba rzeczywiście przekazać: sam komunikat nie przenosi surowców do bazy. W pobliżu Satuk 15 lub placówki docelowej działa transfer ładunku, uruchamiany przez C przy spokojnym statku. Niektóre wyprawy mają rozkaz wykonania celu przed zwykłym dokowaniem; dostępny jest odwrót opisany jako powrót bez ładunku i raportu.

**Istotna niespójność do uwzględnienia w refaktorze:** część opisów późniejszych zadań nadal mówi „wróć z raportem”, choć aktualny system potrafi rozliczyć ich telemetrię przez radio. Nowe trasy poza układem ziemsko-księżycowym są przygotowywane na kolejny wylot. Refaktor powinien rozdzielić: wykonanie celu, jego potwierdzenie, dostawę przedmiotu i zmianę sektora.

Wyprawa ziemsko-księżycowa ma połączoną orbitę, śluzy i przejście nad powierzchnię. Na mapie kampanii Księżyc nie jest po prostu kolejnym niezależnym aktem. Późniejsze sektory korzystają z osobnych obszarów akcji i powrotu do Satuk 15.

## 3. Mapa całej kampanii

| Akt | Miejsce | Obecna funkcja | Co otwiera dalszy etap |
|---|---|---|---|
| I | Ziemia i Księżyc | Nauka, zaplecze, paczka wyposażenia, budowa i obrona placówki | Wszystkie wymagane cele ziemskie i księżycowe aktu I |
| II | Mars, następnie Ziemia | Pościg, wykrycie przeszkody technologicznej, zmiana kierunku | Rozpoznanie granicy pasa i zatwierdzenie odprawy „Nowy kierunek” |
| III | Wenus | Placówka, osłona słoneczna, obrona przygotowań | Wszystkie wymagane cele Wenus, w tym osłona |
| IV | Merkury | Wyprawa przy Słońcu i zdobycie technologii przejścia | Zabezpieczenie technologii; potem powrót na Marsa |
| V | Ponownie Mars | Budowa bazy i osłona korytarza | Technologia Merkurego oraz wszystkie wymagane cele marsjańskie aktu V |
| VI | Pas asteroid | Rozpoznanie, trzy przeszkody i odczyt wyjścia | Ukończenie wymaganych celów pasa |
| VII | Jowisz | Badania, włamanie i pakiet obserwacyjny | Ukończenie wymaganych celów Jowisza |
| VIII | Saturn | Zaopatrzenie i przygotowanie dalszej drogi | Ukończenie wymaganych celów Saturna |
| IX | Uran i Neptun | Bazy przeciwnika, pierwsza walka z bossem | Najpierw komplet celów Urana, potem Neptuna |
| X | Pluton | Podejście i finałowe starcie | Zaliczenie finałowej walki; szczegółowy epilog pozostaje do napisania |

## 4. Akt I — Ziemia i Księżyc

### Przebieg historii

Admirał obejmuje dowodzenie nad Satuk 15. Naukowcy potrzebują danych z przekaźnika orbitalnego, a stacja wymaga pierwszego zaplecza. Początek łączy dwa sensowne cele: zapewnienie infrastruktury i przywrócenie łączności. Drugi Prospector z instruktorem pomaga w orientacji, ale nie jest warunkiem wykonania zadań.

Po kontakcie z satelitą otwiera się trasa księżycowa i odzysk satelit. Gracz dociera do orbity Księżyca, kontaktuje się z sondą, uzyskuje dostęp do powierzchni i trasy do bogatej asteroidy. Następnie organizuje fizyczne wyposażenie placówki, miejscowe wydobycie i rozbudowę. Odbiór techniczny kończy etap przygotowań. Atak przeciwnika zamienia przedsięwzięcie logistyczne w konflikt militarny; trop prowadzi ku Marsowi.

### Główne zadania

1. **Pierwsze zaopatrzenie** — zbiór materiałów i rozbudowa zaplecza Satuk 15 do poziomu I.
2. **Kontakt z satelitą** — przywrócenie łączności i otwarcie dalszych tras.
3. **Przelot na Księżyc** — dotarcie na orbitę Księżyca.
4. **Kontakt z sondą księżycową** — otwarcie powierzchni i dostępu do dalszego złoża.
5. **Wyposażenie stacji** — skompletowanie części, przygotowanie paczki i jej dostarczenie.
6. **Rozbudowa stacji księżycowej** — dostarczenie 160 jednostek żelaza.
7. **Węgiel do miejscowej produkcji** — dostarczenie 2 jednostek węgla.
8. **Odbiór techniczny** — kontakt z instalacjami po obu dostawach.
9. **Obrona stacji księżycowej** — odparcie trzech fal przeciwników.

Zadania 1 i 2 tworzą początkowe gałęzie. Przelot zależy od przekaźnika; sonda od przelotu. Dostawy żelaza i węgla zależą od wyposażenia, mogą być realizowane równolegle i zbiegają się w odbiorze technicznym. Obrona militarna następuje po odbiorze.

### Paczka i Muł — ważna mechanika tego etapu

Wyposażenie wymaga: 8 × Poszycie stalowe I, 4 × Maszyneria I, 3 × Elektronika I, 2 × Układ zasilania I i 2 × Podtrzymywanie życia I.

Przygotowanie paczki jednorazowo zabiera komplet z magazynu. Powstaje przedmiot fabularny przypinany na hol przy wylocie. **Samo zapakowanie nie kończy zadania.** Paczka pozostaje w świecie po utracie statku i można ją ponownie podjąć. Dostarczenie do placówki na powierzchni rozlicza wyposażenie. Dopiero wtedy pojawia się miejscowy Muł pomagający w wydobyciu i dostawach. To nie jest to samo co odblokowanie projektu Muła do budowy we własnej Stoczni — projekt wymaga odbioru technicznego.

### Cele dodatkowe i ton

Odzysk trzech wraków satelit i montaż dowolnego ulepszenia statku są opcjonalne. Osobny cel „Ochrona budowy przed asteroidami” uruchamia trzy fale asteroid po wykonaniu fundamentów. Nie blokuje finałowej obrony przed wrogami; jeśli gracz go nie podjął, po późniejszej obronie przestaje być zaległym celem HUD.

Najmocniejsza cecha tego aktu to zależność między działaniem i następstwem: łączność otwiera trasę, sprzęt uruchamia placówkę i Muła, dostawy umożliwiają odbiór, a atak daje powód do pościgu. W dalszych aktach warto zachować tę logikę przyczynową.

## 5. Akt II — pościg ku Marsowi i powrót do Ziemi

**Rola w historii:** po ataku na Księżyc gracz szuka napastników. Pościg zatrzymuje brak technologii potrzebnej do dalszego przelotu przez pas asteroid.

Obecny ciąg:

1. **Ślad pościgu** — odczyt przekaźnika na trasie.
2. **Zabezpieczenie podejścia** — pokonanie dwóch patroli; może postępować równolegle ze zwiadem.
3. **Granica pościgu** — odczyt przy podejściu do pasa po wykonaniu obu wcześniejszych celów.
4. Powrót do ziemskiej stacji i **Nowy kierunek** — zatwierdzenie odprawy, która wskazuje technologię na Merkurym i konieczność przygotowania przy Wenus.

Dodatkowo: **Zatrzymaj produkcję** — zniszczenie rdzenia stoczni polowej; zatrzymuje tworzenie posiłków, lecz nie usuwa już wypuszczonych jednostek. **Zapasy ekspedycji** — opcjonalna wpłata 20 żelaza.

**Szkielet do rozwinięcia:** brak konkretnej sceny utraty tropu, rozpoznawalnego dowódcy przeciwnika i wiarygodnego uzasadnienia, skąd dowództwo wie o Merkurym. Obecny „pościg” to głównie sekwencja punktów pomiarowych i patroli, a nie dłuższe ściganie widocznego celu. Warto zacząć refaktor właśnie od tego przejścia, bo musi wynikać z finału Księżyca.

## 6. Akt III — przygotowania przy Wenus

**Rola w historii:** spokojniejszy etap odbudowy i logistyki przed trudną ekspedycją blisko Słońca.

Obecny ciąg: **Rozpoznanie orbity** → **Miejsce pod placówkę** i dostawy wyposażenia → **Budowa placówki**. Po budowie można równolegle przygotowywać **Osłonę słoneczną** i wykonać **Obronę przygotowań**.

Placówka wymaga: 8 poszyć stalowych I, 4 maszynerii I, 3 elektroniki I, 3 układów zasilania I i 3 systemów podtrzymywania życia I. Osłona wymaga kolejno: 6 lekkich poszyć I, 3 układów zasilania I i 2 elektroniki I. Dostawy są liczone jako osobne zadania. Montaż placówki odbywa się przy budowie, po opłaceniu materiałów. Obrona jest uruchamiana interakcją przy placówce.

Dodatkowo: **Zapas na dalszą drogę** — wpłata 16 żelaza. Merkury odblokowuje się po wszystkich wymaganych celach Wenus, więc samo wykonanie osłony nie wystarcza.

**Szkielet do rozwinięcia:** czym placówka różni się funkcjonalnie od księżycowej, kto ją obsadza, dlaczego przeciwnik atakuje właśnie teraz i czym osłona słoneczna jest w świecie gry. Obecna konstrukcja grozi powtórzeniem schematu „zwiad–dostawy–budowa–obrona” bez nowego konfliktu i decyzji.

## 7. Akt IV — Merkury i technologia przejścia

**Rola w historii:** ryzykowna ekspedycja, której zdobycz pozwala wrócić do pierwotnego pościgu.

Obecny ciąg: **Podejście do Słońca** — pomiary przy skale osłonowej → **Osłona wyprawy** — dwa kontakty AI, w tym Lancer → **Technologia przejścia** — odczyt węzła danych.

Sektor ma rozbłyski i nagrzewanie statku; skały pełnią rolę osłon umożliwiających chłodzenie. Ta mechanika daje mu wyraźniejszą tożsamość niż większości dalszych etapów.

Opcjonalnie: **Osłona kinetyczna Satuk 15**. Po zwiadzie można pozyskać Harpunem spiek merkuriański odporny na zwykły ostrzał, przewieźć go i użyć przemysłu warsztatu II do wykonania płyt oraz modułu osłonowego. Dalej następuje rozbudowa tarczy stacji. Osobny cel zapasów wymaga 24 żelaza.

**Szkielet do rozwinięcia:** pochodzenie i zasada działania technologii, jej związek z anomaliami, właściciel węzła, powód obecności wrogów i wydarzenie stanowiące przełom. Aktualnie „technologia” jest przede wszystkim flagą odblokowania kolejnego etapu, a nie szczegółowo opowiedzianym odkryciem.

## 8. Akt V — powrót na Marsa

**Rola w historii:** utworzenie przyczółka przed przekroczeniem pasa i nasilenie militarnej presji.

Po zdobyciu technologii pojawiają się dostawy do bazy marsjańskiej: 12 poszyć stalowych I, 6 maszynerii I, 4 elektroniki I, 4 układów zasilania I i 4 systemów podtrzymywania życia I. Następuje **Montaż bazy marsjańskiej**. Po montażu równolegle dostępne są **Obrona bazy marsjańskiej** oraz **Zabezpieczenie korytarza** — trzy patrole, w tym dwa Lancery. Dodatkowe **Pomiary dalszej trasy** nie blokują przejścia.

Warunkiem wejścia do pasa jest technologia Merkurego i komplet wymaganych celów marsjańskich aktu V.

**Szkielet do rozwinięcia:** znaczenie bazy dla ekspedycji, reakcja przeciwnika na zdobycie technologii oraz odróżnienie drugiej wizyty na Marsie od pierwszej. To kolejny etap budowy i obrony, który potrzebuje własnego wydarzenia i stawki.

## 9. Akt VI — przejście przez pas asteroid

**Rola w historii:** przekroczenie granicy oddzielającej przygotowania od wyprawy w zewnętrzny Układ Słoneczny.

Obecny ciąg: **Zwiad wejścia w pas** → trzy cele **Przeszkoda na trasie**, usuwane w dowolnej kolejności → **Zewnętrzna granica pasa**, czyli końcowy odczyt. Opcjonalnie **Osłona przejścia** wymaga dwóch kontaktów bojowych.

Na mapie Układu Słonecznego pas otacza Słońce po orbicie. Grywalny sektor oznacza konkretne przejście przez ten pas, a nie cały pierścień.

**Szkielet do rozwinięcia:** zdobyta technologia odblokowuje sektor, lecz główne czynności to nadal zwiad, rozbicie trzech skał i kolejny skan. Brakuje wyraźnej sytuacji, w której gracz rozumie, dlaczego bez technologii z Merkurego nie dałoby się przejść. Akt specjalny powinien mieć własną dramaturgię przeprawy i reguły odwrotu.

## 10. Akt VII — Jowisz

**Rola w pierwotnym zarysie:** odkrycie zmieniające rozumienie anomalii i dotychczasowego konfliktu.

Obecny ciąg: **Zwiad podejścia do Jowisza** → równolegle **Osłona rejonu pomiarów** i **Włamanie do węzła** → **Pakiet obserwacyjny**. Włamanie dotyczy chronionego terminala; gra ma mechaniki alarmu, skanerów, obwodów i sabotażu. Opcjonalnie **Sonda w skażonej anomalii** wymaga odholowania obiektu przez niebezpieczny teren, a **Zapasy rejonu Jowisza** — wpłaty 24 żelaza.

**Najważniejsza luka fabularna:** pakiet obserwacyjny jest wdrożonym celem, ale treść wielkiego odkrycia nie została ustalona. Nie ma podstaw, aby dopisywać tu potwierdzony pierwszy kontakt, zdradę lub ujawnienie tożsamości obcych. To miejsce wymaga decyzji autora przed rozpisaniem dalszych rozmów i finału.

## 11. Akt VIII — Saturn

**Rola w historii:** spokojniejsza odbudowa i zaopatrzenie po kulminacji przy Jowiszu.

Obecny ciąg: **Rozpoznanie pierścieni** → równolegle **Zaopatrzenie z pierścieni** — przywiezienie 36 żelaza, oraz **Zabezpieczenie rejonu** — jeden patrol → **Odczyt dalszej trasy**. Dodatkowa **Rezerwa dalszej ekspedycji** wymaga wpłaty 18 żelaza.

**Szkielet do rozwinięcia:** obecnie odpoczynek fabularny sprowadza się do wydobycia, walki i odczytu. Potrzebne są konsekwencje odkrycia Jowisza, rozmowy załogi i konkretny powód dalszej ekspedycji. Etap może zmienić tempo bez utraty napięcia, ale ta rola nie jest jeszcze opisana wydarzeniami.

## 12. Akt IX — Uran i Neptun

### Uran

**Rozpoznanie rejonu Urana** otwiera równoległe cele: **Dane chronionej bazy** i **Osłona obszaru baz**, wymagająca dwóch kontaktów. Po ich wykonaniu **Trasa do Neptuna** otwiera następny sektor. Opcjonalny zapas to 20 żelaza.

### Neptun

**Zwiad podejścia do Neptuna** → **Rozpoznanie bazy Neptuna** → **Pierwsze starcie** → **Odczyt zewnętrznej trasy**. Pierwsza walka z ciężką jednostką ma dwie fazy i kończy się zmuszeniem jej do odwrotu. Opcjonalnie można pokonać dwa dodatkowe patrole.

**Szkielet do rozwinięcia:** bazy są celami włamań i rozpoznania, ale ich właściciel i znaczenie dla konfliktu wymagają dopisania. Ciężka jednostka jest funkcjonalnym bossem; nie ma ustalonej tożsamości, osobowości ani motywu. Trzeba zaprojektować, co gracz odkrywa na Uranie, dlaczego spotyka przeciwnika na Neptunie i co oznacza jego odwrót poza otwarciem dalszej trasy.

## 13. Akt X — Pluton

**Rola w zarysie:** poznanie prawdy o anomalii i końcowa konfrontacja.

Obecny ciąg: **Zwiad Plutona** → równolegle **Dane końcowego podejścia** i **Osłona końcowego podejścia** → **Finałowe starcie**. Walka ma trzy fazy i kończy się unieszkodliwieniem jednostki. Dodatkowe **Zabezpieczenie odczytów** nie jest wymagane do finału.

Gra potrafi zaliczyć starcie i wysłać komunikat radiowy o zakończeniu walki oraz powrocie do domu. **Nie oznacza to gotowego fabularnego rozwiązania zagadki.** Nie ustalono ostatecznej prawdy, rozstrzygnięcia losów trzech stron ani pełnego epilogu.

## 14. Postacie i obecny zakres dialogów

| Postać | Funkcja | Obecna rola |
|---|---|---|
| Ada Serrin | Dowodzenie / operacje Satuk 15 | Wprowadzenie, logistyka, decyzje operacyjne i skierowanie pościgu na Marsa |
| dr Ivo Nadir | Badania | Anomalie, łączność, dane sond i interpretacja odczytów |
| Tomas Vale | Instruktor z eskadry szkoleniowej | Prowadzenie początku rozgrywki w drugim Prospectorze |
| Mira Voss | Pilotka początkowa | Pilotka sterowanego statku; nie jest tożsama z admirałem ani oficerem operacyjnym |

Zdefiniowane sekwencje rozmów fabularnych w bazie to: **Objęcie dowodzenia**, **Dalsza orbita**, **Kierunek: Księżyc** i **Pościg ku Marsowi**. Dalsze akty opierają się w większym stopniu na tekstach zadań, instrukcjach, odprawie zmiany kierunku i potwierdzeniach radiowych. Nie mają jeszcze porównywalnie rozpisanej ciągłej opowieści.

## 15. Rozwój floty jako część etapów

Początek udostępnia projekty Prospectora i Swifta. Kolejne projekty odblokowują określone wydarzenia, ale gracz musi jeszcze wyprodukować części i zbudować statek. Szczegółową listę obecnych blokad zawiera załącznik wygenerowany z definicji gry.

Moduły i części mają tiery I–III. Zaplecze I udostępnia części II, a zaplecze II części III. Nie należy mylić gotowości tych systemów z gotowym balansem aktów: obecne manifesty placówek Wenus i Marsa nadal opierają się na częściach I. W dalszym refaktorze trzeba świadomie określić moment wejścia kolejnych tierów, oczekiwaną flotę i możliwość odbudowy po stracie.

## 16. Najważniejsze problemy dalszego szkieletu

1. **Zależności techniczne zastępują motywację.** Odczyt otwiera następny odczyt, ale nie zawsze mówi graczowi, co właśnie odkrył i dlaczego ma to znaczenie.
2. **Powtarzalna konstrukcja aktów.** Zwiad, patrol, terminal i końcowy pakiet pojawiają się w podobnych układach. Wenus i drugi Mars dodatkowo powtarzają budowę oraz obronę.
3. **Nieopowiedziany przeciwnik.** Walka istnieje, lecz związek napastników, baz, stoczni polowej i bossów z trzema stronami konfliktu nie jest ustalony.
4. **Brak treści kluczowych odkryć.** Jowisz i Pluton mają miejsce na przełom, a nie gotowy przełom.
5. **Technologia jako klucz w grafie.** Merkury i pas wymagają fabularnego oraz grywalnego powiązania nagrody z pokonaniem przeszkody.
6. **Nieujednolicone raportowanie.** Starsze instrukcje powrotu kolidują z nowszym rozliczaniem przez radio.
7. **Rozwój gospodarki bez pełnej krzywej kampanii.** System części i kadłubów jest bogatszy niż część manifestów oraz nagród dalszych aktów.
8. **Nieokreślona podróż Satuk 15 w fabule.** Zmiana sektora jest obsługiwana przez grę, ale szczegółowa relacja mobilnej stacji, lokalnych placówek i dalekich ekspedycji potrzebuje spójnego wyjaśnienia.

## 17. Proponowany porządek pracy nad refaktorem

Poniższe punkty są propozycją warsztatu projektowego, nie nowymi ustaleniami fabularnymi.

Najpierw określić prawdę o anomaliach i cele trzech stron na poziomie autora. Oddzielnie rozpisać, co wie gracz po każdym akcie. Ustalić, co ujawnia Jowisz, czego dowiadujemy się na Uranie i Neptunie, a jaka odpowiedź zostaje na Pluton.

Następnie rozpisać akty II–VI jako jeden łańcuch przyczyn: napastnicy z Księżyca → ślad i porażka pościgu → potrzeba przygotowania przy Wenus → konkretna zdobycz na Merkurym → sens powrotu na Marsa → zastosowanie zdobyczy podczas przeprawy. Dopiero wtedy projektować dokładne listy zadań, koszty i dialogi.

Dla każdego aktu warto wypełnić tę samą kartę:

| Pole do ustalenia | Pytanie |
|---|---|
| Stan wejściowy | Co gracz wie, czego chce i jaką flotą dysponuje? |
| Konflikt | Kto lub co przeszkadza i dlaczego właśnie tutaj? |
| Odrębność rozgrywki | Jakie działanie odróżnia ten etap od poprzedniego? |
| Główne wydarzenia | Co zmienia sytuację poza rosnącym licznikiem zadania? |
| Informacja | Czego gracz dowiaduje się o świecie i przeciwniku? |
| Decyzja lub kulminacja | Co wymaga użycia zdobytej wiedzy i wyposażenia? |
| Następstwo | Dlaczego po finale naturalnie wyruszamy do kolejnego miejsca? |
| Logistyka i porażka | Co przewozimy, co możemy utracić i jak ponowić próbę? |
| Rozliczenie | Co potwierdza radio, co wymaga dostawy, co powrotu? |
| Cele dodatkowe | Co rozwija świat lub flotę bez blokowania głównej historii? |

**Zalecany pierwszy pakiet:** pełny refaktor aktu II i jego połączenia z finałem Księżyca. Równolegle rozstrzygnąć tajemnicę kampanii, aby nowe wskazówki prowadziły do zaplanowanej odpowiedzi. Ziemię i Księżyc traktować jako punkt odniesienia, zmieniając je tylko tam, gdzie trzeba przygotować dalszą historię.

## 18. Źródła i granice dokumentu

Opis wdrożonego przebiegu opiera się przede wszystkim na `frontend/game/state/story.ts`, `dialogues.ts`, `lunarShipment.ts`, `lunarConstruction.ts`, `orbitalConstruction.ts`, `fleetUnlocks.ts`, `missionOrders.ts` i `frontend/game/systems/mission.ts`. Założenia autora i otwarte kwestie pochodzą z `docs/campaign-outline.md`, `docs/content-development.md` i bieżących ustaleń w rozmowie.

Starsze dokumenty mieszają stan historyczny, propozycje i backlog. W razie rozbieżności opis bieżących warunków oparto na aktualnym kodzie. Przygotowanie dokumentu nie zmienia zadań, balansu ani zapisów gry.

Poniższy załącznik utrwala pełne nazwy i zależności celów w tej wersji. Identyfikatory są przydatne przy refaktorze; nie są tekstem przeznaczonym dla gracza.


## Załącznik A. Aktualny katalog zadań i zależności

Spis z definicji gry. „Brak wcześniejszego zadania” oznacza start po odblokowaniu sektora, a nie dostępność od początku kampanii. Warunki wejścia do sektorów opisano w tabeli kampanii. Cele wewnętrzne są wymienione osobno, ponieważ nie są niezależnymi misjami w interfejsie.

### Akt 1 — zadania widoczne

**Pierwsze zaopatrzenie** — główne; Ziemia.  
ID: `earth-supply`. Poprzedniki: brak wcześniejszego zadania.  
Warunek z definicji: Zbierz materiały i rozbuduj zaplecze stacji do poziomu I.  
Licznik celu: 1. Nagroda przypisana bezpośrednio: 40 PD dla pilota.

**Kontakt z satelitą** — główne; Ziemia.  
ID: `earth-relay`. Poprzedniki: brak wcześniejszego zadania.  
Warunek z definicji: Nawiąż kontakt z satelitą Ziemi, aby rozszerzyć obszar działań.  
Licznik celu: 1. Nagroda przypisana bezpośrednio: 1 × Podtrzymywanie życia I.

**Przelot na Księżyc** — główne; Ziemia.  
ID: `earth-route`. Poprzedniki: Kontakt z satelitą (`earth-relay`).  
Warunek z definicji: Dotrzyj na orbitę Księżyca.  
Licznik celu: 1. Nagroda przypisana bezpośrednio: 15 × Żelazo (Fe); 3 × Poszycie stalowe I.

**Kontakt z sondą księżycową** — główne; Księżyc.  
ID: `lunar-survey`. Poprzedniki: Przelot na Księżyc (`earth-route`).  
Warunek z definicji: Nawiąż kontakt z sondą księżycową, aby otworzyć lądowanie i trasę do bogatej asteroidy.  
Licznik celu: 1. Nagroda przypisana bezpośrednio: 15 × Żelazo (Fe); 2 × Poszycie stalowe I.

**Odzysk wraków satelit** — dodatkowe; Ziemia.  
ID: `earth-salvage`. Poprzedniki: Kontakt z satelitą (`earth-relay`).  
Warunek z definicji: Odzyskaj trzy wraki satelit.  
Licznik celu: 3. Nagroda przypisana bezpośrednio: brak przedmiotów lub PD w definicji zadania.

**Ulepszenie statku** — dodatkowe; Ziemia.  
ID: `earth-ship-upgrade`. Poprzedniki: brak wcześniejszego zadania.  
Warunek z definicji: Zamontuj dowolne ulepszenie statku w Hangarze.  
Licznik celu: 1. Nagroda przypisana bezpośrednio: 15 PD dla pilota.

**Wyposażenie stacji** — główne; Księżyc.  
ID: `lunar-equipment`. Poprzedniki: Kontakt z sondą księżycową (`lunar-survey`).  
Warunek z definicji: Zdobądź zestaw części do wyposażenia stacji na Księżycu.  
Licznik celu: 19. Nagroda przypisana bezpośrednio: brak przedmiotów lub PD w definicji zadania.

**Rozbudowa stacji księżycowej** — główne; Księżyc.  
ID: `lunar-foundation`. Poprzedniki: Moduł konstrukcyjny (`lunar-hull`); Linia przetwarzania (`lunar-machinery`); Sterowanie produkcją (`lunar-electronics`); Zasilanie placówki (`lunar-power`); Zaplecze życia (`lunar-life-support`).  
Warunek z definicji: Dostarcz żelazo do rozbudowy stacji księżycowej. Muł pomoże w miejscowym wydobyciu.  
Licznik celu: 160 × Żelazo (Fe). Nagroda przypisana bezpośrednio: brak przedmiotów lub PD w definicji zadania.

**Węgiel do miejscowej produkcji** — główne; Księżyc.  
ID: `lunar-installations`. Poprzedniki: Moduł konstrukcyjny (`lunar-hull`); Linia przetwarzania (`lunar-machinery`); Sterowanie produkcją (`lunar-electronics`); Zasilanie placówki (`lunar-power`); Zaplecze życia (`lunar-life-support`).  
Warunek z definicji: Dostarcz węgiel do miejscowej produkcji na stacji księżycowej.  
Licznik celu: 2 × Węgiel (C). Nagroda przypisana bezpośrednio: brak przedmiotów lub PD w definicji zadania.

**Odbiór techniczny** — główne; Księżyc.  
ID: `lunar-commission`. Poprzedniki: Rozbudowa stacji księżycowej (`lunar-foundation`); Węgiel do miejscowej produkcji (`lunar-installations`).  
Warunek z definicji: Po dostawach zeskanuj instalacje przez E. Satuk 15 potwierdzi odbiór techniczny przez radio.  
Licznik celu: 1. Nagroda przypisana bezpośrednio: 24 × Żelazo (Fe); 6 × Poszycie stalowe I.

**Ochrona budowy przed asteroidami** — dodatkowe; Księżyc.  
ID: `lunar-defense`. Poprzedniki: Rozbudowa stacji księżycowej (`lunar-foundation`).  
Warunek z definicji: Po fundamentach: przy budowie przytrzymaj G przez 2 s. Obroń konstrukcję przed trzema falami asteroid.  
Licznik celu: 1. Nagroda przypisana bezpośrednio: 20 × Żelazo (Fe); 4 × Poszycie stalowe I.

**Obrona stacji księżycowej** — główne; Księżyc.  
ID: `lunar-attack`. Poprzedniki: Odbiór techniczny (`lunar-commission`).  
Warunek z definicji: Po odbiorze technicznym wrogowie zaatakują stację. Odeprzyj trzy fale i wróć do Satuk 15 na rozmowę o pościgu ku Marsowi.  
Licznik celu: 1. Nagroda przypisana bezpośrednio: 40 × Żelazo (Fe); 8 × Poszycie stalowe I.


### Akt 2 — zadania widoczne

**Ślad pościgu** — główne; Mars.  
ID: `mars-trail`. Poprzedniki: brak wcześniejszego zadania.  
Warunek z definicji: Leć do przekaźnika na trasie pościgu. Zbierz odczyt przez E i poczekaj na potwierdzenie radiowe Satuk 15.  
Licznik celu: 1. Nagroda przypisana bezpośrednio: 16 × Żelazo (Fe); 4 × Poszycie stalowe I.

**Zabezpieczenie podejścia** — główne; Mars.  
ID: `mars-patrol`. Poprzedniki: brak wcześniejszego zadania.  
Warunek z definicji: Odeprzyj dwa patrole na podejściu. Wyniki walki potwierdza radio; możesz rozdzielić je na wyprawy.  
Licznik celu: 2. Nagroda przypisana bezpośrednio: 24 × Żelazo (Fe); 6 × Poszycie stalowe I.

**Granica pościgu** — główne; Mars.  
ID: `mars-belt`. Poprzedniki: Ślad pościgu (`mars-trail`); Zabezpieczenie podejścia (`mars-patrol`).  
Warunek z definicji: Leć do podejścia do pasa asteroid. Zbierz odczyt przez E i poczekaj na potwierdzenie radiowe. Dalszy przelot wymaga brakującej technologii.  
Licznik celu: 1. Nagroda przypisana bezpośrednio: 20 × Żelazo (Fe); 4 × Poszycie stalowe I.

**Zatrzymaj produkcję** — dodatkowe; Mars.  
ID: `mars-factory`. Poprzedniki: Ślad pościgu (`mars-trail`); Zabezpieczenie podejścia (`mars-patrol`).  
Warunek z definicji: Odszukaj stocznię polową. Zniszcz jej rdzeń, aby zatrzymać posiłki, i poczekaj na potwierdzenie radiowe. Wypuszczone jednostki pozostaną w walce.  
Licznik celu: 1. Nagroda przypisana bezpośrednio: 28 × Żelazo (Fe); 8 × Poszycie stalowe I.

**Zapasy ekspedycji** — dodatkowe; Mars.  
ID: `mars-reserve`. Poprzedniki: brak wcześniejszego zadania.  
Warunek z definicji: Przekaż 20 rudy na zaplecze pościgu. Zadanie dodatkowe nie blokuje rozpoznania pasa.  
Licznik celu: 20. Nagroda przypisana bezpośrednio: 10 × Żelazo (Fe); 4 × Poszycie stalowe I.

**Nowy kierunek** — główne; Ziemia.  
ID: `earth-debrief`. Poprzedniki: Granica pościgu (`mars-belt`).  
Warunek z definicji: Raport z pasa wymaga odprawy przy Ziemi. Przeczytaj plan wyprawy i zatwierdź trasę do Wenus w Satuk 15.  
Licznik celu: 1. Nagroda przypisana bezpośrednio: brak przedmiotów lub PD w definicji zadania.


### Akt 3 — zadania widoczne

**Rozpoznanie orbity** — główne; Wenus.  
ID: `venus-survey`. Poprzedniki: brak wcześniejszego zadania.  
Warunek z definicji: Leć do przekaźnika przy Wenus. Zbierz odczyt przez E i poczekaj na potwierdzenie radiowe Satuk 15.  
Licznik celu: 1. Nagroda przypisana bezpośrednio: 18 × Żelazo (Fe); 4 × Poszycie stalowe I.

**Miejsce pod placówkę** — główne; Wenus.  
ID: `venus-site`. Poprzedniki: Rozpoznanie orbity (`venus-survey`).  
Warunek z definicji: Po zwiadzie leć do punktu pomiarowego. Zbierz odczyt przez E i wróć, aby zatwierdzić miejsce pod przyszłą placówkę.  
Licznik celu: 1. Nagroda przypisana bezpośrednio: 16 × Żelazo (Fe); 4 × Poszycie stalowe I.

**Poszycie placówki Wenus** — główne; Wenus.  
ID: `venus-stockpile`. Poprzedniki: Rozpoznanie orbity (`venus-survey`).  
Warunek z definicji: Dostarcz 8 × Poszycie stalowe I. Załaduj manifest i przekaż części przy budowie.  
Licznik celu: 8 × Poszycie stalowe I. Nagroda przypisana bezpośrednio: brak przedmiotów lub PD w definicji zadania.

**Maszyneria placówki Wenus** — główne; Wenus.  
ID: `venus-machinery`. Poprzedniki: Rozpoznanie orbity (`venus-survey`).  
Warunek z definicji: Dostarcz 4 × Maszyneria I. Załaduj manifest i przekaż części przy budowie.  
Licznik celu: 4 × Maszyneria I. Nagroda przypisana bezpośrednio: brak przedmiotów lub PD w definicji zadania.

**Sterowanie placówki Wenus** — główne; Wenus.  
ID: `venus-electronics`. Poprzedniki: Rozpoznanie orbity (`venus-survey`).  
Warunek z definicji: Dostarcz 3 × Elektronika I. Załaduj manifest i przekaż części przy budowie.  
Licznik celu: 3 × Elektronika I. Nagroda przypisana bezpośrednio: brak przedmiotów lub PD w definicji zadania.

**Zasilanie placówki Wenus** — główne; Wenus.  
ID: `venus-power`. Poprzedniki: Rozpoznanie orbity (`venus-survey`).  
Warunek z definicji: Dostarcz 3 × Układ zasilania I. Załaduj manifest i przekaż części przy budowie.  
Licznik celu: 3 × Układ zasilania I. Nagroda przypisana bezpośrednio: brak przedmiotów lub PD w definicji zadania.

**Zaplecze życia przy Wenus** — główne; Wenus.  
ID: `venus-life`. Poprzedniki: Rozpoznanie orbity (`venus-survey`).  
Warunek z definicji: Dostarcz 3 × Podtrzymywanie życia I. Załaduj manifest i przekaż części przy budowie.  
Licznik celu: 3 × Podtrzymywanie życia I. Nagroda przypisana bezpośrednio: brak przedmiotów lub PD w definicji zadania.

**Zapas na dalszą drogę** — dodatkowe; Wenus.  
ID: `venus-reserve`. Poprzedniki: brak wcześniejszego zadania.  
Warunek z definicji: Dodatkowy przydział: przekaż 16 rudy na zapasy. Nie blokuje przygotowania placówki.  
Licznik celu: 16. Nagroda przypisana bezpośrednio: 8 × Żelazo (Fe); 3 × Poszycie stalowe I.

**Budowa placówki** — główne; Wenus.  
ID: `venus-build`. Poprzedniki: Miejsce pod placówkę (`venus-site`); Poszycie placówki Wenus (`venus-stockpile`); Maszyneria placówki Wenus (`venus-machinery`); Sterowanie placówki Wenus (`venus-electronics`); Zasilanie placówki Wenus (`venus-power`); Zaplecze życia przy Wenus (`venus-life`).  
Warunek z definicji: Po pomiarach i dostarczeniu części leć na plac budowy. Przytrzymaj E przez 2 s przy nieruchomym statku. Materiały są już opłacone.  
Licznik celu: 1. Nagroda przypisana bezpośrednio: brak przedmiotów lub PD w definicji zadania.

**Poszycie osłony słonecznej** — główne; Wenus.  
ID: `venus-shield-plating`. Poprzedniki: Budowa placówki (`venus-build`).  
Warunek z definicji: Dostarcz 6 × Poszycie lekkie I do osłony. Części przyjmuje zbudowana placówka.  
Licznik celu: 6 × Poszycie lekkie I. Nagroda przypisana bezpośrednio: brak przedmiotów lub PD w definicji zadania.

**Zasilanie osłony słonecznej** — główne; Wenus.  
ID: `venus-shield-power`. Poprzedniki: Budowa placówki (`venus-build`).  
Warunek z definicji: Dostarcz 3 × Układ zasilania I do osłony. Części przyjmuje zbudowana placówka.  
Licznik celu: 3 × Układ zasilania I. Nagroda przypisana bezpośrednio: brak przedmiotów lub PD w definicji zadania.

**Sterowanie osłoną słoneczną** — główne; Wenus.  
ID: `venus-shield-electronics`. Poprzedniki: Budowa placówki (`venus-build`).  
Warunek z definicji: Dostarcz 2 × Elektronika I do osłony. Części przyjmuje zbudowana placówka.  
Licznik celu: 2 × Elektronika I. Nagroda przypisana bezpośrednio: brak przedmiotów lub PD w definicji zadania.

**Osłona słoneczna** — główne; Wenus.  
ID: `venus-shield`. Poprzedniki: Poszycie osłony słonecznej (`venus-shield-plating`); Zasilanie osłony słonecznej (`venus-shield-power`); Sterowanie osłoną słoneczną (`venus-shield-electronics`).  
Warunek z definicji: Po dostarczeniu poszycia lekkiego, zasilania i elektroniki placówka potwierdzi gotowość osłony do podróży bliżej Słońca.  
Licznik celu: 1. Nagroda przypisana bezpośrednio: brak przedmiotów lub PD w definicji zadania.

**Obrona przygotowań** — główne; Wenus.  
ID: `venus-defense`. Poprzedniki: Budowa placówki (`venus-build`).  
Warunek z definicji: Po budowie: G przez 2 s przy placówce rozpoczyna atak AI. Odeprzyj trzy kontakty i poczekaj na potwierdzenie radiowe. Osłonę możesz przygotować równolegle.  
Licznik celu: 1. Nagroda przypisana bezpośrednio: 30 × Żelazo (Fe); 8 × Poszycie stalowe I.


### Akt 4 — zadania widoczne

**Podejście do Słońca** — główne; Merkury.  
ID: `mercury-survey`. Poprzedniki: brak wcześniejszego zadania.  
Warunek z definicji: Odszukaj punkt pomiarowy w cieniu dużej skały. Zbierz odczyt przez E i poczekaj na potwierdzenie radiowe. Podczas rozbłysków chłodź statek za asteroidami.  
Licznik celu: 1. Nagroda przypisana bezpośrednio: 20 × Żelazo (Fe); 6 × Poszycie stalowe I.

**Osłona wyprawy** — główne; Merkury.  
ID: `mercury-patrol`. Poprzedniki: Podejście do Słońca (`mercury-survey`).  
Warunek z definicji: Po zwiadzie odeprzyj dwa kontakty AI, w tym Lancera. Raporty wymagają powrotu; można podzielić walki na wyprawy.  
Licznik celu: 2. Nagroda przypisana bezpośrednio: 28 × Żelazo (Fe); 8 × Poszycie stalowe I.

**Technologia przejścia** — główne; Merkury.  
ID: `mercury-technology`. Poprzedniki: Podejście do Słońca (`mercury-survey`); Osłona wyprawy (`mercury-patrol`).  
Warunek z definicji: Po zabezpieczeniu sektora leć do węzła danych. Zbierz pakiet przez E i wróć. Dopiero bezpieczny powrót zabezpiecza technologię pasa.  
Licznik celu: 1. Nagroda przypisana bezpośrednio: 35 × Żelazo (Fe); 10 × Poszycie stalowe I.

**Osłona kinetyczna Satuk 15** — dodatkowe; Merkury.  
ID: `mercury-shield`. Poprzedniki: Podejście do Słońca (`mercury-survey`).  
Warunek z definicji: Odszukaj spiek za skałą osłonową. Harpunem wyrwij złoża; ostrzał ich nie uszkadza. Wróć z ładunkiem, w warsztacie II wytwórz płyty i moduł osłonowy, następnie rozbuduj tarczę Satuk 15.  
Licznik celu: 1. Nagroda przypisana bezpośrednio: 20 × Żelazo (Fe); 4 × Poszycie stalowe I.

**Zapas ekspedycji** — dodatkowe; Merkury.  
ID: `mercury-reserve`. Poprzedniki: brak wcześniejszego zadania.  
Warunek z definicji: Przekaż 24 rudy na zaplecze wyprawy. Zadanie dodatkowe nie blokuje odzyskania technologii.  
Licznik celu: 24. Nagroda przypisana bezpośrednio: 12 × Żelazo (Fe); 5 × Poszycie stalowe I.


### Akt 5 — zadania widoczne

**Poszycie bazy marsjańskiej** — główne; Mars.  
ID: `mars-base-ore`. Poprzedniki: Technologia przejścia (`mercury-technology`).  
Warunek z definicji: Dostarcz 12 × Poszycie stalowe I. Załaduj manifest i przekaż części przy budowie.  
Licznik celu: 12 × Poszycie stalowe I. Nagroda przypisana bezpośrednio: brak przedmiotów lub PD w definicji zadania.

**Maszyneria bazy marsjańskiej** — główne; Mars.  
ID: `mars-base-parts`. Poprzedniki: Technologia przejścia (`mercury-technology`).  
Warunek z definicji: Dostarcz 6 × Maszyneria I. Załaduj manifest i przekaż części przy budowie.  
Licznik celu: 6 × Maszyneria I. Nagroda przypisana bezpośrednio: brak przedmiotów lub PD w definicji zadania.

**Sterowanie bazy marsjańskiej** — główne; Mars.  
ID: `mars-base-electronics`. Poprzedniki: Technologia przejścia (`mercury-technology`).  
Warunek z definicji: Dostarcz 4 × Elektronika I. Załaduj manifest i przekaż części przy budowie.  
Licznik celu: 4 × Elektronika I. Nagroda przypisana bezpośrednio: brak przedmiotów lub PD w definicji zadania.

**Zasilanie bazy marsjańskiej** — główne; Mars.  
ID: `mars-base-power`. Poprzedniki: Technologia przejścia (`mercury-technology`).  
Warunek z definicji: Dostarcz 4 × Układ zasilania I. Załaduj manifest i przekaż części przy budowie.  
Licznik celu: 4 × Układ zasilania I. Nagroda przypisana bezpośrednio: brak przedmiotów lub PD w definicji zadania.

**Zaplecze życia na Marsie** — główne; Mars.  
ID: `mars-base-life`. Poprzedniki: Technologia przejścia (`mercury-technology`).  
Warunek z definicji: Dostarcz 4 × Podtrzymywanie życia I. Załaduj manifest i przekaż części przy budowie.  
Licznik celu: 4 × Podtrzymywanie życia I. Nagroda przypisana bezpośrednio: brak przedmiotów lub PD w definicji zadania.

**Montaż bazy marsjańskiej** — główne; Mars.  
ID: `mars-base-build`. Poprzedniki: Poszycie bazy marsjańskiej (`mars-base-ore`); Maszyneria bazy marsjańskiej (`mars-base-parts`); Sterowanie bazy marsjańskiej (`mars-base-electronics`); Zasilanie bazy marsjańskiej (`mars-base-power`); Zaplecze życia na Marsie (`mars-base-life`).  
Warunek z definicji: Po dostawach leć do bazy. Przytrzymaj E przez 2 s przy spokojnym statku. Materiały zostały już opłacone.  
Licznik celu: 1. Nagroda przypisana bezpośrednio: brak przedmiotów lub PD w definicji zadania.

**Obrona bazy marsjańskiej** — główne; Mars.  
ID: `mars-base-defense`. Poprzedniki: Montaż bazy marsjańskiej (`mars-base-build`).  
Warunek z definicji: Po montażu: G przez 2 s przy bazie rozpoczyna trzy kontakty AI. Obroń obiekt i poczekaj na potwierdzenie radiowe Satuk 15.  
Licznik celu: 1. Nagroda przypisana bezpośrednio: 30 × Żelazo (Fe); 8 × Poszycie stalowe I.

**Zabezpieczenie korytarza** — główne; Mars.  
ID: `mars-corridor`. Poprzedniki: Montaż bazy marsjańskiej (`mars-base-build`).  
Warunek z definicji: Po montażu neutralizuj trzy patrole w dalszym obszarze, w tym dwa Lancery. Możesz wracać po każdym kontakcie.  
Licznik celu: 3. Nagroda przypisana bezpośrednio: 40 × Żelazo (Fe); 12 × Poszycie stalowe I.

**Pomiary dalszej trasy** — dodatkowe; Mars.  
ID: `mars-route`. Poprzedniki: Montaż bazy marsjańskiej (`mars-base-build`).  
Warunek z definicji: Dodatkowy zwiad: po montażu bazy leć do dalszego punktu. Zbierz pomiary przez E i wróć. Nie blokuje przygotowania przejścia pasa.  
Licznik celu: 1. Nagroda przypisana bezpośrednio: 18 × Żelazo (Fe); 5 × Poszycie stalowe I.


### Akt 6 — zadania widoczne

**Zwiad wejścia w pas** — główne; Pas.  
ID: `belt-survey`. Poprzedniki: brak wcześniejszego zadania.  
Warunek z definicji: Leć do wejścia w pas. Zatrzymaj statek, zbierz pomiary przez E i wróć do Satuk 15, aby otworzyć dalszą trasę.  
Licznik celu: 1. Nagroda przypisana bezpośrednio: 18 × Żelazo (Fe); 4 × Poszycie stalowe I.

**Przeszkoda 1 na trasie** — główne; Pas.  
ID: `belt-clear-0`. Poprzedniki: Zwiad wejścia w pas (`belt-survey`).  
Warunek z definicji: 3 wskazuje skałę blokującą trasę. Usuń ją laserem lub uzbrojeniem i poczekaj na potwierdzenie radiowe. Przeszkody można usuwać w dowolnej kolejności.  
Licznik celu: 1. Nagroda przypisana bezpośrednio: 10 × Żelazo (Fe); 2 × Poszycie stalowe I.

**Przeszkoda 2 na trasie** — główne; Pas.  
ID: `belt-clear-1`. Poprzedniki: Zwiad wejścia w pas (`belt-survey`).  
Warunek z definicji: 4 wskazuje skałę blokującą trasę. Usuń ją laserem lub uzbrojeniem i poczekaj na potwierdzenie radiowe. Przeszkody można usuwać w dowolnej kolejności.  
Licznik celu: 1. Nagroda przypisana bezpośrednio: 10 × Żelazo (Fe); 2 × Poszycie stalowe I.

**Przeszkoda 3 na trasie** — główne; Pas.  
ID: `belt-clear-2`. Poprzedniki: Zwiad wejścia w pas (`belt-survey`).  
Warunek z definicji: 5 wskazuje skałę blokującą trasę. Usuń ją laserem lub uzbrojeniem i poczekaj na potwierdzenie radiowe. Przeszkody można usuwać w dowolnej kolejności.  
Licznik celu: 1. Nagroda przypisana bezpośrednio: 10 × Żelazo (Fe); 2 × Poszycie stalowe I.

**Zewnętrzna granica pasa** — główne; Pas.  
ID: `belt-exit`. Poprzedniki: Przeszkoda 1 na trasie (`belt-clear-0`); Przeszkoda 2 na trasie (`belt-clear-1`); Przeszkoda 3 na trasie (`belt-clear-2`).  
Warunek z definicji: Po zatwierdzeniu usunięcia trzech przeszkód leć do zewnętrznej granicy pasa. Zbierz odczyt przez E i poczekaj na potwierdzenie radiowe Satuk 15.  
Licznik celu: 1. Nagroda przypisana bezpośrednio: 30 × Żelazo (Fe); 8 × Poszycie stalowe I.

**Osłona przejścia** — dodatkowe; Pas.  
ID: `belt-patrol`. Poprzedniki: Zwiad wejścia w pas (`belt-survey`).  
Warunek z definicji: Po zwiadzie odeprzyj dwa kontakty w pasie. Możesz raportować każdy osobno. Ich neutralizacja nie blokuje przejścia.  
Licznik celu: 2. Nagroda przypisana bezpośrednio: 22 × Żelazo (Fe); 6 × Poszycie stalowe I.


### Akt 7 — zadania widoczne

**Zwiad podejścia do Jowisza** — główne; Jowisz.  
ID: `jupiter-survey`. Poprzedniki: brak wcześniejszego zadania.  
Warunek z definicji: Leć do przekaźnika pomiarowego. Zbierz odczyt przez E i wróć do Satuk 15, aby otworzyć dalszy obszar.  
Licznik celu: 1. Nagroda przypisana bezpośrednio: 20 × Żelazo (Fe); 4 × Poszycie stalowe I.

**Osłona rejonu pomiarów** — główne; Jowisz.  
ID: `jupiter-patrol`. Poprzedniki: Zwiad podejścia do Jowisza (`jupiter-survey`).  
Warunek z definicji: Po zwiadzie neutralizuj patrol i Lancera. Możesz wracać z raportem po każdym kontakcie.  
Licznik celu: 2. Nagroda przypisana bezpośrednio: 28 × Żelazo (Fe); 8 × Poszycie stalowe I.

**Włamanie do węzła** — główne; Jowisz.  
ID: `jupiter-uplink`. Poprzedniki: Zwiad podejścia do Jowisza (`jupiter-survey`).  
Warunek z definicji: Leć do terminala chronionego węzła. Przytrzymaj E przez 4 s bez alarmu. G wyłącza skaner na 20 s. Wróć z danymi.  
Licznik celu: 1. Nagroda przypisana bezpośrednio: 24 × Żelazo (Fe); 6 × Poszycie stalowe I.

**Pakiet obserwacyjny** — główne; Jowisz.  
ID: `jupiter-observations`. Poprzedniki: Osłona rejonu pomiarów (`jupiter-patrol`); Włamanie do węzła (`jupiter-uplink`).  
Warunek z definicji: Po raportach z walk i węzła leć do dalszego punktu obserwacyjnego. Zbierz pakiet przez E i poczekaj na potwierdzenie radiowe Satuk 15.  
Licznik celu: 1. Nagroda przypisana bezpośrednio: 36 × Żelazo (Fe); 10 × Poszycie stalowe I.

**Sonda w skażonej anomalii** — dodatkowe; Jowisz.  
ID: `jupiter-recovery`. Poprzedniki: Zwiad podejścia do Jowisza (`jupiter-survey`).  
Warunek z definicji: Wybierz sondę i podłącz hol przez H. Dostarcz ją do Satuk 15 bezpieczną trasą, omijając skażone pasma.  
Licznik celu: 1. Nagroda przypisana bezpośrednio: 32 × Żelazo (Fe); 10 × Poszycie stalowe I.

**Zapasy rejonu Jowisza** — dodatkowe; Jowisz.  
ID: `jupiter-reserve`. Poprzedniki: Zwiad podejścia do Jowisza (`jupiter-survey`).  
Warunek z definicji: Dodatkowe przygotowanie: przekaż 24 rudy w stacji. Możesz dzielić wpłaty; zapas nie blokuje odzyskania pakietu.  
Licznik celu: 24. Nagroda przypisana bezpośrednio: 12 × Żelazo (Fe); 5 × Poszycie stalowe I.


### Akt 8 — zadania widoczne

**Rozpoznanie pierścieni** — główne; Saturn.  
ID: `saturn-survey`. Poprzedniki: brak wcześniejszego zadania.  
Warunek z definicji: Leć do przekaźnika na podejściu do pierścieni. Zbierz odczyt przez E i wróć do Satuk 15, aby otworzyć dalszy obszar.  
Licznik celu: 1. Nagroda przypisana bezpośrednio: 18 × Żelazo (Fe); 4 × Poszycie stalowe I.

**Zaopatrzenie z pierścieni** — główne; Saturn.  
ID: `saturn-supply`. Poprzedniki: Rozpoznanie pierścieni (`saturn-survey`).  
Warunek z definicji: Po zwiadzie przywieź 36 rudy z wypraw w pierścienie, korzystając z bliskiego złoża. Możesz dzielić transporty; ruda trafia do zwykłego magazynu.  
Licznik celu: 36 × Żelazo (Fe). Nagroda przypisana bezpośrednio: 24 × Żelazo (Fe); 8 × Poszycie stalowe I.

**Zabezpieczenie rejonu** — główne; Saturn.  
ID: `saturn-patrol`. Poprzedniki: Rozpoznanie pierścieni (`saturn-survey`).  
Warunek z definicji: Po zwiadzie odeprzyj odległy patrol i poczekaj na potwierdzenie radiowe. Walkę i zaopatrzenie możesz wykonać w dowolnej kolejności.  
Licznik celu: 1. Nagroda przypisana bezpośrednio: 16 × Żelazo (Fe); 5 × Poszycie stalowe I.

**Odczyt dalszej trasy** — główne; Saturn.  
ID: `saturn-route`. Poprzedniki: Zaopatrzenie z pierścieni (`saturn-supply`); Zabezpieczenie rejonu (`saturn-patrol`).  
Warunek z definicji: Po zaopatrzeniu i raporcie z walki leć do dalszego punktu. Zbierz dane przez E i poczekaj na potwierdzenie radiowe Satuk 15.  
Licznik celu: 1. Nagroda przypisana bezpośrednio: 28 × Żelazo (Fe); 8 × Poszycie stalowe I.

**Rezerwa dalszej ekspedycji** — dodatkowe; Saturn.  
ID: `saturn-reserve`. Poprzedniki: Rozpoznanie pierścieni (`saturn-survey`).  
Warunek z definicji: Dodatkowy projekt: przekaż 18 rudy z magazynu stacji. Wpłaty mogą być częściowe. Rezerwa nie blokuje odczytu trasy.  
Licznik celu: 18. Nagroda przypisana bezpośrednio: 8 × Żelazo (Fe); 4 × Poszycie stalowe I.


### Akt 9 — zadania widoczne

**Rozpoznanie rejonu Urana** — główne; Uran.  
ID: `uranus-survey`. Poprzedniki: brak wcześniejszego zadania.  
Warunek z definicji: Leć do pomiarów podejścia. Zbierz odczyt przez E i wróć do Satuk 15, aby otworzyć obszar baz.  
Licznik celu: 1. Nagroda przypisana bezpośrednio: 20 × Żelazo (Fe); 5 × Poszycie stalowe I.

**Dane chronionej bazy** — główne; Uran.  
ID: `uranus-base`. Poprzedniki: Rozpoznanie rejonu Urana (`uranus-survey`).  
Warunek z definicji: Po zwiadzie leć do terminala bazy. E pobiera dane bez alarmu; G wyłącza skaner na 20 s. Wróć z danymi.  
Licznik celu: 1. Nagroda przypisana bezpośrednio: 24 × Żelazo (Fe); 7 × Poszycie stalowe I.

**Osłona obszaru baz** — główne; Uran.  
ID: `uranus-patrol`. Poprzedniki: Rozpoznanie rejonu Urana (`uranus-survey`).  
Warunek z definicji: Odeprzyj patrol i Lancera w rejonie baz. Możesz raportować kontakty osobno. Włamanie i walki wykonujesz równolegle.  
Licznik celu: 2. Nagroda przypisana bezpośrednio: 30 × Żelazo (Fe); 8 × Poszycie stalowe I.

**Trasa do Neptuna** — główne; Uran.  
ID: `uranus-route`. Poprzedniki: Dane chronionej bazy (`uranus-base`); Osłona obszaru baz (`uranus-patrol`).  
Warunek z definicji: Po raportach z bazy i walki leć do dalszego węzła. Odczyt przez E i potwierdzenie radiowe otwierają sektor Neptuna.  
Licznik celu: 1. Nagroda przypisana bezpośrednio: 24 × Żelazo (Fe); 6 × Poszycie stalowe I.

**Zapas na dalszą trasę** — dodatkowe; Uran.  
ID: `uranus-reserve`. Poprzedniki: Rozpoznanie rejonu Urana (`uranus-survey`).  
Warunek z definicji: Dodatkowo przekaż 20 rudy w stacji. Wpłaty mogą być częściowe; zapas nie blokuje trasy do Neptuna.  
Licznik celu: 20. Nagroda przypisana bezpośrednio: 10 × Żelazo (Fe); 5 × Poszycie stalowe I.

**Zwiad podejścia do Neptuna** — główne; Neptun.  
ID: `neptune-survey`. Poprzedniki: brak wcześniejszego zadania.  
Warunek z definicji: Leć do przekaźnika. Odczyt przez E i bezpieczny powrót otwierają rejon kolejnej bazy.  
Licznik celu: 1. Nagroda przypisana bezpośrednio: 22 × Żelazo (Fe); 5 × Poszycie stalowe I.

**Rozpoznanie bazy Neptuna** — główne; Neptun.  
ID: `neptune-base`. Poprzedniki: Zwiad podejścia do Neptuna (`neptune-survey`).  
Warunek z definicji: Leć do chronionego terminala. Pobierz dane przez E bez alarmu i wróć. G wyłącza skaner na 20 s.  
Licznik celu: 1. Nagroda przypisana bezpośrednio: 28 × Żelazo (Fe); 8 × Poszycie stalowe I.

**Pierwsze starcie** — główne; Neptun.  
ID: `neptune-boss`. Poprzedniki: Rozpoznanie bazy Neptuna (`neptune-base`).  
Warunek z definicji: Po raporcie z bazy leć do rejonu starcia. G przez 2 s rozpoczyna dwufazową walkę. Zmuś ciężką jednostkę do odwrotu i poczekaj na potwierdzenie radiowe.  
Licznik celu: 1. Nagroda przypisana bezpośrednio: 50 × Żelazo (Fe); 16 × Poszycie stalowe I.

**Odczyt zewnętrznej trasy** — główne; Neptun.  
ID: `neptune-route`. Poprzedniki: Pierwsze starcie (`neptune-boss`).  
Warunek z definicji: Po bezpiecznym raporcie ze starcia leć do dalszego punktu. Zbierz odczyt i poczekaj na potwierdzenie radiowe Satuk 15.  
Licznik celu: 1. Nagroda przypisana bezpośrednio: 30 × Żelazo (Fe); 10 × Poszycie stalowe I.

**Dodatkowa osłona podejścia** — dodatkowe; Neptun.  
ID: `neptune-patrol`. Poprzedniki: Zwiad podejścia do Neptuna (`neptune-survey`).  
Warunek z definicji: Dodatkowo odeprzyj dwa patrole. Możesz wracać z raportami pojedynczo. Nie blokują pierwszego starcia ani dalszej trasy.  
Licznik celu: 2. Nagroda przypisana bezpośrednio: 24 × Żelazo (Fe); 6 × Poszycie stalowe I.


### Akt 10 — zadania widoczne

**Zwiad Plutona** — główne; Pluton.  
ID: `pluto-survey`. Poprzedniki: brak wcześniejszego zadania.  
Warunek z definicji: Leć do pomiarów podejścia. Zbierz odczyt przez E i wróć do Satuk 15, aby otworzyć dalszy obszar.  
Licznik celu: 1. Nagroda przypisana bezpośrednio: 24 × Żelazo (Fe); 6 × Poszycie stalowe I.

**Dane końcowego podejścia** — główne; Pluton.  
ID: `pluto-base`. Poprzedniki: Zwiad Plutona (`pluto-survey`).  
Warunek z definicji: Leć do chronionego terminala. Pobierz dane przez E i wróć. G wyłącza skaner na 20 s. Cel równoległy do osłony.  
Licznik celu: 1. Nagroda przypisana bezpośrednio: 30 × Żelazo (Fe); 10 × Poszycie stalowe I.

**Osłona końcowego podejścia** — główne; Pluton.  
ID: `pluto-patrol`. Poprzedniki: Zwiad Plutona (`pluto-survey`).  
Warunek z definicji: Odeprzyj patrol i Lancera. Raporty możesz przywozić pojedynczo. Dane bazy i osłonę realizujesz w dowolnej kolejności.  
Licznik celu: 2. Nagroda przypisana bezpośrednio: 36 × Żelazo (Fe); 10 × Poszycie stalowe I.

**Finałowe starcie** — główne; Pluton.  
ID: `pluto-boss`. Poprzedniki: Dane końcowego podejścia (`pluto-base`); Osłona końcowego podejścia (`pluto-patrol`).  
Warunek z definicji: Po obu raportach leć do rejonu starcia. G przez 2 s rozpoczyna walkę z trzema fazami. Unieszkodliw jednostkę i wróć bezpiecznie do Satuk 15.  
Licznik celu: 1. Nagroda przypisana bezpośrednio: 60 × Żelazo (Fe); 20 × Poszycie stalowe I.

**Zabezpieczenie odczytów** — dodatkowe; Pluton.  
ID: `pluto-record`. Poprzedniki: Zwiad Plutona (`pluto-survey`).  
Warunek z definicji: Leć do odległego punktu pomiarowego. Zbierz dane i wróć. Dodatkowy odczyt nie blokuje finałowego starcia.  
Licznik celu: 1. Nagroda przypisana bezpośrednio: 18 × Żelazo (Fe); 8 × Poszycie stalowe I.


### Cele wewnętrzne i indywidualne wraki

Służą rozliczeniu celu nadrzędnego lub pojedynczego obiektu. Nie należy liczyć ich jako dodatkowych osobnych wypraw.

| ID | Cel | Warunek poprzedzający |
|---|---|---|
| `earth-materials` | Materiały do zaplecza | — |
| `earth-workshop` | Zaplecze stacji | earth-supply |
| `earth-satellite-0` | Odzysk satelity | earth-relay |
| `earth-satellite-1` | Odzysk satelity | earth-relay |
| `earth-satellite-2` | Odzysk satelity | earth-relay |
| `lunar-hull` | Moduł konstrukcyjny: 8 × Poszycie stalowe I | lunar-survey |
| `lunar-machinery` | Linia przetwarzania: 4 × Maszyneria I | lunar-survey |
| `lunar-electronics` | Sterowanie produkcją: 3 × Elektronika I | lunar-survey |
| `lunar-power` | Zasilanie placówki: 2 × Układ zasilania I | lunar-survey |
| `lunar-life-support` | Zaplecze życia: 2 × Podtrzymywanie życia I | lunar-survey |

## Załącznik B. Odblokowania projektów statków

Prospector I i Swift są dostępne od początku. Poniższe odblokowania dotyczą projektów; nie są automatycznym przyznaniem gotowego statku. Kadłuby wyłącznie z odzysku podlegają osobnej zasadzie.

| Projekt | Zdarzenie odblokowujące |
|---|---|
| Mule | Odbiór techniczny (`lunar-commission`) |
| Manta | Kontakt z sondą księżycową (`lunar-survey`) |
| Bastion | Odbiór techniczny (`lunar-commission`) |
| Sokół | Nowy kierunek (`earth-debrief`) |
| Widmo | Budowa placówki (`venus-build`) |
| Harpun | Osłona słoneczna (`venus-shield`) |
| Aegis | Technologia przejścia (`mercury-technology`) |
| Atlas | Montaż bazy marsjańskiej (`mars-base-build`) |
| Żądło | Zewnętrzna granica pasa (`belt-exit`) |
| Feniks | Pakiet obserwacyjny (`jupiter-observations`) |

Kontrola kompletności: 78 definicji zadań widocznych oraz 10 definicji wewnętrznych / pojedynczych wraków; łącznie 88. Liczba definicji nie jest liczbą wymaganych wypraw ani liczbą questów widocznych jednocześnie.
