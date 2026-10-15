# Aktualny plan rozwoju

Stan: 2026-10-15, wersja 0.44.

Ten plik określa aktualny backlog. `plan-v0.1.md`, `roadmap-after-v0.19.md` oraz opisy `implementation-*` zachowują historię decyzji; ich dawne zdania „następny etap” nie oznaczają niezrealizowanych zadań.

## Zrealizowany zakres

- Pętla lobby → proceduralna wyprawa → powrót lub strata; trwała progresja i wersjonowany zapis.
- Wydobycie, chwytaki, trzy surowce, przetop, ulepszenia statków i stacji.
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

## Następne kroki kampanii

- Przeprowadzić testy graczy całego aktu I, dopracować tempo, trudność i komunikowanie wymagań.
- Uzupełnić dialogi i oprawę fabularnego zwrotu aktu I po ustaleniu jego treści przez autora.
- Rozwinąć akt III: budowa placówki przy Wenus po zatwierdzeniu miejsca i zgromadzeniu materiałów, opracowanie osłony słonecznej oraz obrona przygotowań przed atakami. Następnie otwarcie trudnej wyprawy na Merkurego. Sandbox pozostaje niezależnym narzędziem regresji.

Zarys nie wprowadza mechaniki paliwa statków ani sterowania wieloma jednostkami jednocześnie. Prawda o anomalii, tożsamość przeciwnika i dokładna treść kluczowych zwrotów pozostają do napisania. Wersja 0.42 domknęła ciąg mechanik aktu I, a 0.44 domyka mechaniczny ciąg aktu II i otwiera pierwsze przygotowania przy Wenus. Akt III nie jest ukończony. Merkury i dalsze akty nie są jeszcze grywalne.

Balans pozostaje iteracyjny. Pierwsza runda pokazała różnice specjalizacji i dostępność ekonomii; kolejne testy graczy powinny szczególnie ocenić bazowe Widmo przeciw zwrotnym patrolom, wygodę broni wymagających ponawiania naciśnięć oraz tempo rozwoju. Będą też potrzebne dłuższe sesje renderowania i próby na słabszym sprzęcie. Nie są to automatyczne zgody na nowe statki, liftingi ani systemy części.

## Kierunki poza bieżącym zakresem

Wymienne modele części, nowe profesje personelu i kolejne placówki/role przeciwników pozostają propozycjami. Nie są warunkiem rozpoczęcia kampanii ani automatycznie zatwierdzonym zakresem najbliższego etapu. Ewentualny system części wymaga osobnej specyfikacji slotów, kompromisów, montażu i reguł odzysku.

## Świadomie odłożone

- Produkcja przy zamkniętej grze. Obecnie postępuje wyłącznie w czasie symulacji wyprawy.
- Wznowienie aktywnej wyprawy. Odświeżenie nadal rozlicza ją jako przegraną, zgodnie z przyjętą zasadą.

Kampania ma zarys autora, przechodnie mechanicznie akty I–II, początek aktu III i kolejność dalszych prac opisaną wyżej. Osobne systemy frakcji oraz multiplayer nie mają uzgodnionego zakresu wdrożenia.
