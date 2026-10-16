# Aktualny plan rozwoju

Stan: 2026-10-16, wersja 0.55.

Ten plik określa aktualny backlog. `plan-v0.1.md`, `roadmap-after-v0.19.md` oraz opisy `implementation-*` zachowują historię decyzji; ich dawne zdania „następny etap” nie oznaczają niezrealizowanych zadań.

## Polityka zapisu od 0.54

Decyzja autora: starsze zapisy są niekompatybilne i nie mogą być otwierane. Nie utrzymujemy migracji ani dziedziczenia floty. Parser przyjmuje tylko aktualny format; przy niezgodności pokazuje komunikat i tworzy nową kampanię. Historyczne opisy migracji nie są wymaganiem dla dalszych prac.

## Nowy kierunek po ukończeniu szkieletu

Autor przekazał zakres etapowej rozbudowy sektorów: dialogi i reżyseria, odblokowania floty, nowe misje i minigry, trudniejsza walka, rozbudowa stacji i gospodarki oraz nowa oprawa. [Pełny backlog, zależności, uwagi i proponowane pakiety](content-development.md). To nadrzędny kierunek dalszego rozwoju; historyczne ograniczenia poniżej nie wykluczają teraz wskazanych funkcji.

Nowy kanon: anomalie są wywołane obecnością obcej cywilizacji. Trzy strony konfliktu to wojsko Ziemi, wroga prywatna organizacja kosmiczna i obcy. Motywacje, relacje, boss i scenariusz ujawnień pozostają otwarte. Wersja 0.53 wdraża pierwszy pakiet: odprawy przy Ziemi i ujawnianie zadań. Pozostałe funkcje listy są backlogiem. Wersja 0.54 dodaje odblokowania i rozkazy zwiadu/walki z odwrotem. Wersja 0.55 wdraża pierwszy łańcuch gospodarki i segmenty magazynowe. Następny krok to tarcza Satuk 15, następnie pełniejsze misje aktu I.

## Zrealizowany zakres

- Pętla lobby → proceduralna wyprawa → powrót lub strata; trwała progresja i wersjonowany zapis.
- Wydobycie, chwytaki, rudy żelaza i miedzi, komponenty, moduły i konstrukcje; przetop, ulepszenia statków i stacji.
- Walka z AI, infiltracja, sabotaż, prototypy, fortyfikacje i eskorta Keplera.
- Tarcze kinetyczne, ratunek, fizyczny hol, wiele dostaw do Aurory bez kończenia rundy.
- Dwanaście kadłubów w stoczni i dwa odzyskiwane z wraków. Swift i Widmo są osobnymi specjalizacjami; Widmo ma dash i optyczny kamuflaż.
- Piloci i ich rozwój; mechanik i intendent pracują wyłącznie w stacji.
- Lifting lobby i HUD, grafika geometryczna, efekty trafień, radar i dźwięki CC0.

## Stabilizacja 0.33

[Zakres, poprawki i ograniczenia weryfikacji](stabilization-v0.33.md).

## Etap 0.34 — wdrożony

Odzysk technologii i wrogich kadłubów, Swift/Widmo, warianty uzbrojenia wszystkich statków, pasywne zakłócanie radarów, usunięcie personelu pokładowego, lifting modułów i wzmocnienie ścian. [Szczegóły](implementation-v0.34.md).

## Etap 0.35 — wdrożony

Czytelne parametry i podgląd modułów w stoczni, wyposażenie dopasowane do kadłubów, nieregularny Aegis oraz szersze Widmo z ulepszanym dashem, smugą i wychodzeniem z przeszkód do przodu. [Szczegóły](implementation-v0.35.md).

## Pancerz floty — wdrożony

Wszystkie kadłuby mają poszycie, pogrubione obramowania lub osobne płyty zamiast cienkich linii ulepszeń. [Zestawy, kontrola wizualna i propozycje dalszych kroków](hull-armor.md).

## Decyzja o kierunku prac

Aktualna mapa, kontrakty i pętla gry są testowym sandboxem do weryfikacji mechanik, statków i balansu. Nie utrwalamy ich jako docelowej kampanii. Lifting wyglądu statków jest zakończony; nie jest kolejnym priorytetem.

Najpierw domykamy fundamenty i narzędzia testowe. Fabuła, kampania oraz kolejne etapy rozgrywki następują po ocenie tych fundamentów. Dawne propozycje dalszych liftingów i śladów uszkodzeń nie są obowiązkowym zakresem przed kampanią.

## Etap 0.36 — wdrożony

Indywidualny podgląd modułów 0–III oraz porównanie nominalnego parametru przed/po w hangarze i stoczni. Podgląd nie zmienia ekonomii ani konfiguracji wyprawy. [Zakres i weryfikacja](implementation-v0.36.md).

## Etap 0.37 — wdrożony

Osobny tryb Sandbox / testy z sześcioma scenariuszami, wszystkimi kadłubami, wariantami uzbrojenia, modułami 0–III i wyborem seeda. F6 ponawia konfigurację, F7 kończy próbę raportem. Lokalna kampania testowa nie zapisuje nagród ani strat do zwykłej kampanii. [Obsługa, pomiary i weryfikacja](implementation-v0.37.md).

## Etap 0.38 — wdrożony; fundamenty technicznie zamknięte

Wykonano audyt cykli mechanik, pierwszą rundę 224 porównań kadłubów i modułów, przejście zwykłej ekonomii od Prospectora do warsztatu II oraz pomiary rzeczywistego renderowania. Naprawiono zwalnianie własnych kontekstów grafiki w Pixi i pomiar osłony impulsowej Aegisa. Raport F7 pokazuje FPS, p95, długie klatki i dostępną pamięć JS. Zestaw regresji: 304 testy, w tym długie próby symulacji i rozliczenia sukcesu, porażki oraz odzysku.

**Pierwszy duży etap implementacji można uznać za technicznie zamknięty.** Nie ma ujawnionego blokera przed projektowaniem docelowych misji i kampanii. Wyniki, macierz weryfikacji, dane porównań i ograniczenia pomiarów: [raport 0.38](implementation-v0.38.md).

## Etap 0.39 — trwałe sektory i początek aktu I wdrożone

Autor określił kierunek fabularny: anomalie w Układzie Słonecznym, admirał Sił Kosmicznych Ziemi, stacja Satuk 15 i dziesięć aktów od Ziemi do Plutona. [Zarys kampanii, zasady sektorów i propozycja aktu I](campaign-outline.md) rozróżnia ustalenia autora od proponowanych doprecyzowań.

- Wdrożono osobny zapis Satuk 15, dziennik równoległych zadań głównych i dodatkowych, zależności i jednorazowe nagrody. Stary zapis testowy pozostaje dostępny z lobby.
- Grywalne: lokalne wydobycie, przekaźnik, warsztat I, rozszerzenie orbity Ziemi, odczyt dalszej trasy i zwiad na trasie księżycowej. Można wracać między odblokowanymi sektorami. [Zakres i weryfikacja](implementation-v0.39.md).

## Etap 0.40 — powierzchnia Księżyca i budowa stacji paliw wdrożone

Po zwiadzie trasy dostępne jest wejście na powierzchnię z własnym terenem, radarem i złożem. Gracz przewozi 48 rudy i 12 komponentów na budowę, zatwierdza częściowe dostawy i wraca z raportem odbioru. Osobny przycisk wylotu ładuje materiały z magazynu. Przejścia zachowują statek, ładunek i hol; zapis obsługuje także stratę oraz ratunek na powierzchni. [Zakres, migracja i weryfikacja](implementation-v0.40.md).

## Etap 0.41 — obrona budowy wdrożona

Po fundamentach dostępny jest równoległy cel Osłona budowy: trzy zapowiadane fale asteroid, 100 HP konstrukcji, widoczne zagrożenia i jednorazowa nagroda. Porażkę można ponowić bez utraty dostaw; wyjście na orbitę przerywa próbę. Starsze odebrane stacje zachowują swój stan, a nowy cel jest dopisywany jako niedokończony. [Zakres i weryfikacja](implementation-v0.41.md).

## Etap 0.42 — finał mechaniczny aktu I wdrożony

Obrona stacji księżycowej przed trzema kontaktami AI odblokowuje się po odbiorze i osłonie budowy. Napastnicy mogą ostrzeliwać stację lub statek. Bezpieczny powrót z raportem zamyka akt I, wypłaca jednorazową nagrodę i pokazuje dalszy kierunek — Mars. Tożsamość napastników i fabularna treść zwrotu pozostają otwarte. [Zakres i weryfikacja](implementation-v0.42.md).

## Etap 0.43 — marsjański początek aktu II wdrożony

Mars odblokowuje się po końcowym raporcie aktu I. Zwiad przekaźnika i neutralizacja dwóch patroli to równoległe cele. Bezpieczne powroty zatwierdzają raporty walk, również pojedynczego kontaktu na wyprawę. Oba cele otwierają dalszy obszar z odczytem pasa asteroid i komunikatem brakującej technologii. Wcześniejsze sektory pozostają dostępne. [Zakres, migracja i weryfikacja](implementation-v0.43.md).

## Etap 0.44 — odprawa ziemska i otwarcie Wenus wdrożone

Powrót z raportem o blokadzie pasa udostępnia przy Ziemi odprawę Nowy kierunek. Zatwierdzenie planu wskazuje Merkurego jako cel pozyskania technologii, zamyka mechaniczny ciąg aktu II i otwiera Wenus. Początek aktu III: zwiad orbity, pomiary miejsca pod przyszłą placówkę oraz trwały projekt 32 rudy. Cele mają przypisane akty, więc późniejsze zadania na Ziemi nie blokują wcześniejszego ukończenia aktu I. [Zakres, zapis i weryfikacja](implementation-v0.44.md).

## Etap 0.45 — placówka Wenus i mechaniczne domknięcie aktu III wdrożone

W miejscu pomiarów powstaje orbitalna placówka: E przez 2 s po zatwierdzeniu miejsca i zgromadzeniu 32 rudy. Zbudowany obiekt jest trwały, a ruda nie jest pobierana ponownie. Potem można równolegle przygotować osłonę słoneczną za 12 komponentów i obronić placówkę przed trzema kontaktami AI. Obrona wymaga bezpiecznego powrotu z raportem. Jej ukończenie i gotowy projekt osłony domykają mechaniczny ciąg aktu III. Osłona jest trwałą gotowością ekspedycji; działanie w nowym środowisku termicznym będzie częścią Merkurego. [Zakres, zapis i weryfikacja](implementation-v0.45.md).

## Etap 0.46 — Merkury i mechaniczny ciąg aktu IV wdrożone

Gotowa i obroniona placówka Wenus wraz z osłoną słoneczną otwierają Merkurego. Sektor ma temperaturę, zapowiadane rozbłyski i cień rzeczywistych dużych asteroid. Osłona zmniejsza nagrzewanie; przegrzanie uszkadza kadłub i przerywa pracę. Pomiary podejścia, walka z patrolem i Lancerem oraz odzyskanie pakietu danych kończą się bezpiecznymi powrotami. Zabezpieczona technologia jest trwałą gotowością do dalszej drogi; nie określa jej fabularnej natury. [Zakres, zapis i weryfikacja](implementation-v0.46.md).

## Etap 0.47 — baza marsjańska i mechaniczny ciąg aktu V wdrożone

Po bezpiecznym odzyskaniu technologii powrót na Marsa otwiera nowe projekty: 40 rudy i 10 komponentów, montaż bazy, obronę przed trzema kontaktami oraz niezależne zabezpieczenie korytarza z patrolem i dwoma Lancerami. Oba cele bojowe można wykonywać w dowolnej kolejności. Są też opcjonalne pomiary dalszej trasy. Dziennik aktu II pozostaje dostępny na drugiej stronie, a wcześniejsze akty zachowują ukończenie. [Zakres, migracja i weryfikacja](implementation-v0.47.md).

## Etap 0.48 — przejście pasa i mechaniczny ciąg aktu VI wdrożone

Osobny sektor Pas odblokowuje się po technologii z Merkurego i zabezpieczeniu bazy marsjańskiej. Zwiad wejścia rozszerza obszar do 5,7 km; trzy rzeczywiste skały mają niezależne raporty i znikają trwale po ich dostarczeniu. Kolejność usuwania i liczba wypraw są dowolne. Po oczyszczeniu trasy można potwierdzić zewnętrzną granicę pasa. Ruchome odłamki tworzą zagrożenie środowiskowe, a dwa patrole są celem opcjonalnym. Wcześniejsze sektory pozostają dostępne. [Zakres, migracja i weryfikacja](implementation-v0.48.md).

## Etap 0.49 — operacyjny zakres aktu VII przy Jowiszu wdrożony

Przejście pasa otwiera Jowisza. Zwiad rozszerza obszar do 4,7 km, a raporty z patrolu i Lancera oraz włamania do węzła — do 6,1 km. Węzeł korzysta z rzeczywistego terminala, obrotowego skanera, alarmu, dwóch obrońców i opcjonalnego sabotażu za komponent z ładowni. Po wykonaniu obu równoległych celów można odzyskać dalszy pakiet obserwacyjny. Bezpieczne powroty zachowują raporty i jednorazowe nagrody. **To przygotowany ciąg operacyjny aktu VII; jego kluczowe ujawnienie fabularne nie zostało dopisane.** [Zakres, migracja i weryfikacja](implementation-v0.49.md).

## Etap 0.50 — Saturn i mechaniczny zakres aktu VIII wdrożony

Operacyjne cele Jowisza otwierają Saturna. Rozpoznanie pierścieni rozszerza sektor z 2,5 do 4,2 km, a przywiezienie 36 rudy oraz raport z jednego odległego patrolu otwierają obszar 5,4 km z odczytem dalszej trasy. Zaopatrzenie zalicza się z rzeczywistego ładunku udanych wypraw, może być rozdzielone na transporty i nie pobiera ponownie rudy z magazynu. Opcjonalne złoże kryształów zachęca do eksploracji; osobny projekt rezerwy nie blokuje celu głównego. [Zakres, migracja i weryfikacja](implementation-v0.50.md).

## Etap 0.51 — Uran, Neptun i pierwsze starcie w akcie IX wdrożone

Saturn otwiera Urana. Zwiad, dane chronionej bazy i dwa kontakty bojowe prowadzą do odczytu trasy do Neptuna. Tam zwiad i włamanie do drugiej bazy otwierają rejon pierwszego starcia. G przez 2 s uruchamia zapowiedź i dwufazową ciężką jednostkę, która wycofuje się przy 25% pancerza. Opuszczenie rejonu, limit czasu i strata statku przerywają próbę; raport wymaga bezpiecznego powrotu. Po nim dostępny jest odczyt zewnętrznej trasy. Opcjonalne cele nie blokują przejścia. [Zakres, migracja i weryfikacja](implementation-v0.51.md).

## Etap 0.52 — Pluton i mechaniczny finał aktu X wdrożone

Neptun otwiera Plutona. Zwiad udostępnia bazę i dwa kontakty na podejściu; raporty tych równoległych celów otwierają rejon finału. G przez 2 s uruchamia zapowiedź i trzyfazową jednostkę: pojedyncze pociski, wachlarz trzech, potem pięciu. Bezpieczny powrót rozlicza finał i jednorazową nagrodę, pozostawiając wcześniejsze sektory oraz cele dodatkowe dostępne. To domknięcie operacyjnego ciągu, bez dopisywania prawdy o anomalii i fabularnego zakończenia. [Zakres i weryfikacja](implementation-v0.52.md).

## Etap 0.53 — dialogi i odkrywanie zadań wdrożone

Trzy odprawy ziemskie mają portrety, ręczne przechodzenie i trwałą historię. Ostatnią można powtórzyć. Panel wyprawy, HUD i TAB ukrywają przyszłe cele, zachowując dostępne zadania równoległe, dodatkowe oraz historię ukończonych. Starsze zapisy zachowują postęp i pomijają spóźnione odprawy. [Zakres i weryfikacja](implementation-v0.53.md). Następny pakiet: wybrana wyprawa, zasady przerwania i odblokowania floty.

## Etap 0.54 — flota i rozkazy wypraw wdrożone

Prospector i Swift są dostępne od początku, pozostałe projekty otwierają raporty kampanii. Można wybrać zwiad, patrol lub bossa jako cel przed startem; wykonanie celu otwiera dokowanie, a raport rozlicza dopiero powrót. TAB umożliwia potwierdzany odwrót bez nagrody, raportu i ładunku. Swobodne loty pozostają dostępne. Starsze formaty są odrzucane, bez migracji. [Zakres i weryfikacja](implementation-v0.54.md).

## Etap 0.55 — wdrożony

Pierwszy łańcuch przemysłowy: wydobycie Cu → przewodniki → moduły zasilania → segmenty magazynowe. Panel Stacja → Przemysł, wspólna kolejka mechanika i trzy dodatkowe segmenty po +200 miejsca. Format kampanii 35 odrzuca starsze zapisy. [Zakres i weryfikacja](implementation-v0.55.md).

## Następne kroki kampanii

- Dokończyć pakiet gospodarki i stacji: odblokowywana tarcza Satuk 15 z praktycznym zastosowaniem modułów zasilania.
- Następnie rozwinąć akt I o minigrę łączności i eskortę wydobywczą Muła.

- Przeprowadzić testy graczy całego aktu I, dopracować tempo, trudność i komunikowanie wymagań.
- Uzupełnić dialogi i oprawę fabularnego zwrotu aktu I po ustaleniu jego treści przez autora.
- Uzupełnić kluczowe ujawnienie aktu VII po ustaleniu jego treści przez autora. Zabezpieczony pakiet obserwacyjny daje punkt zaczepienia do tej sceny.
- Przeprowadzić ciągłe przejście całej kampanii od nowego zapisu: ekonomia, czas wypraw, wymagania wyposażenia, poziomy pilotów i narastanie trudności. Dotychczasowe testy zwykłych wypraw sprawdzają sektory z przygotowanym wejściem, nie zastępują takiej sesji.
- Dopracować różnice sektorów i starć na podstawie testów graczy.
- Uzupełnić fabularny finał aktu X: mechanizm anomalii powodowanych obecnością obcych, motywacje stron, tożsamość bossa i scenariusz ujawnienia. Sandbox pozostaje niezależnym narzędziem regresji.

Zarys nie wprowadza mechaniki paliwa statków ani sterowania wieloma jednostkami jednocześnie. Obecność obcych jako źródło anomalii jest już ustalona; ich mechanizm, motywacje stron, tożsamość bossa i dokładna treść kluczowych zwrotów pozostają do napisania. Wersja 0.42 domknęła ciąg mechanik aktu I, 0.44 aktu II, 0.45 przygotowania i obronę aktu III, 0.46 wyprawę aktu IV, 0.47 bazę i walki aktu V, a 0.48 przejście pasa w akcie VI. Dialogi, sceny oraz tempo aktów wymagają dalszego opracowania. Wersja 0.49 dodaje operacyjne cele Jowisza, lecz nie zamyka fabularnego ujawnienia aktu VII. Wersja 0.50 dodaje spokojniejszy operacyjny odcinek Saturna. Wersja 0.51 dodaje operacyjny ciąg Urana i Neptuna oraz pierwszą dwufazową walkę. Wersja 0.52 dodaje Plutona i trzyfazowy mechaniczny finał aktu X.

Balans pozostaje iteracyjny. Pierwsza runda pokazała różnice specjalizacji i dostępność ekonomii; kolejne testy graczy powinny szczególnie ocenić bazowe Widmo przeciw zwrotnym patrolom, wygodę broni wymagających ponawiania naciśnięć oraz tempo rozwoju. Będą też potrzebne dłuższe sesje renderowania i próby na słabszym sprzęcie. Nie są to automatyczne zgody na nowe statki, liftingi ani systemy części.

## Kierunki poza bieżącym zakresem

Wymienne modele części, nowe profesje personelu i kolejne placówki/role przeciwników pozostają propozycjami. Nie są warunkiem rozpoczęcia kampanii ani automatycznie zatwierdzonym zakresem najbliższego etapu. Ewentualny system części wymaga osobnej specyfikacji slotów, kompromisów, montażu i reguł odzysku.

## Świadomie odłożone

- Produkcja przy zamkniętej grze. Obecnie postępuje wyłącznie w czasie symulacji wyprawy.
- Wznowienie aktywnej wyprawy. Odświeżenie nadal rozlicza ją jako przegraną, zgodnie z przyjętą zasadą.

Kampania ma zarys autora, przechodnie mechanicznie akty I–VI i operacyjne zakresy aktów VII–X. Trzy strony konfliktu są ustaleniem fabularnym; osobna reputacja, dyplomacja lub symulacja relacji nie wynikają z tego automatycznie. Multiplayer pozostaje poza zakresem. Nową kolejność rozwoju zawartości opisuje dokument podlinkowany na początku planu.
