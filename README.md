# Orbit · Asteroids

Prototyp gry 2D w PixiJS 8 i TypeScript, oparty na istniejącym boilerze. Zręcznościowy lot z fizyką Rapier 2D, wydobywanie rudy i komponentów, proceduralne sektory, baza, ulepszenia oraz piloci.

Wersja 0.2 dodaje mechanika stacji, kolejkę produkcji i naprawę uszkodzonego napędu podczas wyprawy.

Wersja 0.3 dodaje flotę do trzech statków, zakup kadłubów Swift i Mule, osobne moduły każdego statku oraz złomowanie rezerwy. Aktualne sterowanie bazowego Prospectora pozostaje bez zmian.

Wersja 0.4 dodaje ratunek pilotów i odzysk utraconych statków z wyposażeniem. Zakładka **Ratunek** pozwala wrócić do sektora straty, podjąć kapsułę lub wrak i dowieźć cel do Aurory.

Wersja 0.5 dodaje przekaźnik Lumen i obserwatorium Mnemos, skanowanie danych oraz dwa kontrakty eksploracyjne. Pierwszy odblokowuje się po udanym powrocie, drugi po wykonaniu Nasłuchu sektora i zbudowaniu warsztatu I. Kampania zapisuje liczbę wykonań każdego kontraktu.

Wersja 0.6 dodaje doświadczenie i rozwój pilotów: pięć poziomów oraz wybór premii do manewrowania, wydobycia lub procedur ewakuacji. Awans daje punkt do przydzielenia w bazie. Początkujący piloci zachowują dotychczasowe sterowanie.

Wersja 0.7 wprowadza wrogów AI: pięć dronów patrolujących wrak, bogatą żyłę i obserwatorium. Wykrywają statek, ścigają go, celują z wyprzedzeniem i strzelają po widocznym ładowaniu działka. Zniszczony dron pozostawia 3 rudy i 2 komponenty. Początkowe pole wydobywcze i przekaźnik pozostają bez patroli.

Sterowanie jest arcade: statek szybko skręca, osiąga prędkość przelotową w około pół sekundy, koryguje kierunek ruchu podczas skrętu i wyhamowuje po puszczeniu spacji w około sekundę. Zderzenia nadal obsługuje fizyka. Uszkodzony napęd ogranicza także prędkość maksymalną.

## Uruchomienie

```sh
npm install
npm start
```

Gra: http://localhost:3000. Tryb developerski przebudowuje kod i odświeża stronę. Odświeżenie podczas aktywnej wyprawy oznacza jej utratę, także w tym trybie.

```sh
npm run build-run
```

Buduje i uruchamia wersję produkcyjną, bez automatycznego odświeżania. Sam build: `npm run build`.

## Sterowanie

| Wejście | Działanie |
| --- | --- |
| Mysz | Szybkie kierowanie i celowanie |
| Spacja | Lot w kierunku kursora; po puszczeniu statek automatycznie wyhamowuje |
| Shift | Szybki hamulec, także gdy trzymasz spację |
| Przytrzymany LPM | Działko: wydobycie i walka |
| E | Przeszukanie pobliskiego wraku |
| Przytrzymany E | Dokowanie w strefie bazy przy prędkości poniżej 65 m/s |
| Przytrzymany E przy sygnale ratunkowym | Podjęcie kapsuły/wraku: 4 s poniżej 80 m/s, bez ciągu, strzelania i naprawy |
| Przytrzymany E przy miejscu badawczym | Skanowanie danych: 3 s w promieniu 180, przy prędkości do 60 m/s, bez ciągu, ognia i naprawy |
| Przytrzymany R | Naprawa napędu i 25 punktów kadłuba: 5 s lotu poniżej 80 m/s, bez ciągu, strzelania i interakcji; zużywa zestaw |
| 1–8 | Cel nawigacji: baza, pole rudy, pas, wrak, bogata żyła, sygnał ratunkowy, przekaźnik, obserwatorium |
| Esc | Pauza, sterowanie i głośność efektów |

Zniszcz asteroidy i zbliż się do pozostawionych kryształów. Łup przyciąga się automatycznie, dopóki jest miejsce w ładowni. Jasne bursztynowe skały zawierają komponenty. Kontrakt daje premię po powrocie, jeśli przywieziony ładunek spełnia wymagania. Możesz wrócić z częściowym ładunkiem.

Czerwone, kanciaste drony oznaczają zagrożenie; HUD i minimapa pokazują patrol oraz pościg. Asteroidy zasłaniają statek i zatrzymują pociski. Możesz zniszczyć przeciwnika albo zgubić go, oddalając się od patrolowanego miejsca lub chowając za skałami. Strefa Aurory w promieniu 850 jednostek chroni przed ostrzałem dronów; zderzenia ze skałami nadal są niebezpieczne. Trafienia przerywają naprawę, skanowanie i odzysk. Premie wydobywcze kadłuba, pilota i modułu działka działają na skały; obrażenia wrogim kadłubom pozostają stałe.

Kontrakty badawcze wymagają przywiezienia konkretnych danych: **Nasłuch sektora** — skan Lumen za 18 rudy i 3 komponenty; **Ślad dawnych gwiazd** — skany Lumen i Mnemos z jednej wyprawy za 30 rudy i 5 komponentów. Skan nie zajmuje ładowni, więc możesz również wydobywać. HUD wskazuje brakujące dane i kolejny cel. Nagroda jest dodatkiem do łupu i trafia do magazynu dopiero po dokowaniu. Częściowa wyprawa zachowuje łup, ale nie daje premii za niewykonany kontrakt.

W bazie kupujesz moduły silnika, ładowni, działka i pancerza, rozbudowujesz warsztat oraz magazyn i zatrudniasz pilotów z niewielkimi różnicami sterowania.

W **Piloci → Rozwój** wybierasz umiejętności aktywnego pilota. Manewrowanie daje +3% do obrotu i hamowania na poziom, wydobycie +5% do obrażeń skałom, a procedury ewakuacji +6 punktów procentowych do szansy kapsuły. Każda umiejętność ma dwa poziomy; pięć poziomów pilota daje łącznie cztery punkty, więc nie rozwiniesz wszystkiego do maksimum. Przydział jest trwały, dostępny wyłącznie w bazie i nie kosztuje surowców.

Doświadczenie zdobywa pilot lecący na misję, po bezpiecznym dokowaniu: za przywieziony ładunek, unikalne skany, wykonany kontrakt i udany odzysk. Puste powroty i samo czekanie nie dają PD. Progi awansu to 20, 50, 90 i 140 PD. Przegrana nie daje doświadczenia; uratowany pilot zachowuje zdobyte wcześniej PD i umiejętności. Zapasowi piloci nie zdobywają doświadczenia za cudze wyprawy.

W **Hangar → Flota / zakup** możesz kupić i wybrać statek. Swift jest szybszym, lżejszym zwiadowcą, a Mule ma większy kadłub, ładownię i moc wydobycia przy wolniejszym locie. Oba wymagają warsztatu I. Zakup nie kasuje poprzedniego kadłuba — pozostaje on w rezerwie z własnymi modułami. Zapasowe statki przetrwają stratę aktywnego statku. Złomowanie rezerwy wymaga potwierdzenia i miejsca w magazynie na zwrot materiałów.

W zakładce **Załoga** zatrudniasz mechanika za 12 rudy. Kolejka mieści trzy zadania: rafinacja 8 rudy w 1 komponent (45 s) lub produkcja zestawu naprawczego z 6 rudy i 1 komponentu (30 s). Praca postępuje podczas wyprawy; pauza, pobyt w bazie i zamknięta gra zatrzymują postęp. Materiały są rezerwowane od razu; anulowanie zadania zwraca je w całości.

Przed startem automatycznie zabierasz maksymalnie dwa zestawy z zapasu bazy. Nowa kampania dostaje jeden zestaw. Mocne zderzenie może uszkodzić napęd i ograniczyć ciąg do 45%; hamulec nadal działa. Naprawa przywraca pełny ciąg. Niewykorzystane zestawy wracają po dokowaniu, a zestawy na utraconym statku przepadają. Mechanik i ukończona produkcja pozostają w bazie po porażce.

## Zapis

Postęp pozostaje lokalnie w przeglądarce. Zniszczenie statku lub odświeżenie aktywnej wyprawy zabiera aktywnego pilota i statek z hangaru; łup, dane i zabrane zestawy przepadają. Pilot może przetrwać w kapsule, a kadłub z modułami może nadawać się do odzysku. Szansa zależy od pilota, modelu statku i pancerza; aktualne wartości widać pod stacją w bazie. Baza, jej magazyn, historia wykonanych kontraktów i pozostali piloci pozostają. Przy braku środków można odebrać brakujące wyposażenie awaryjne i kontynuować grę.

W **Ratunek → Wybierz → Rozpocznij akcję ratunkową** wracasz do początkowego układu sektora straty. Klawisz 6 wskazuje kapsułę/wrak. Podjęty cel podróżuje na holu i jest zabezpieczony dopiero po dokowaniu. Pilot wraca do załogi, a statek z własnymi modułami do rezerwy. Pełny hangar zamienia odzyskany kadłub na połowę zainwestowanych materiałów; nadwyżka magazynu przepada. Hol nie zajmuje ładowni i nie zmienia obecnego sterowania.

Nieudana akcja lub odświeżenie podczas niej traci jej pierwotny cel. Udany powrót bez podjęcia celu zachowuje sygnał na później. Baza pamięta do trzech sygnałów; czwarty wypiera najstarszy. Piloci w kapsułach rezerwują miejsce w limicie załogi, a licznik utraconych pilotów obejmuje straty trwałe.

Zapisy v0.1–v0.5 są automatycznie migrowane do formatu 6, z zachowaniem kampanii. Historia kontraktów jest naliczana od v0.5; wcześniejsze powroty nadal odblokowują Nasłuch sektora. Piloci ze starszego zapisu, także w kapsułach, zaczynają rozwój z 0 PD i zachowują tożsamość oraz cechę. Znacznik aktywnej wyprawy zachowuje swoją politykę straty także podczas migracji. Postęp pracy mechanika i ostatnia pozycja statku są zapisywane co 5 s lotu i natychmiast po ukończeniu zadania; nie naliczamy pracy offline ani nie wznawiamy stanu fizyki. Odzysku nie losujemy ponownie przy odświeżaniu.

## Sprawdzenie kodu

```sh
npm run typecheck
npm run lint
npm test
npm run build
```

Efekty dźwiękowe są oryginalnymi plikami WAV wygenerowanymi przez `node scripts/generate-sounds.mjs`. Obrazy gry powstają z figur Pixi, bez pobierania grafik z internetu.

Plan: [docs/plan-v0.1.md](docs/plan-v0.1.md). Implementacja i ograniczenia: [docs/implementation-v0.1.md](docs/implementation-v0.1.md).

Aktualne rozszerzenia załogi i napraw: [docs/implementation-v0.2.md](docs/implementation-v0.2.md).

Aktualne sterowanie arcade: [docs/arcade-controls.md](docs/arcade-controls.md).

Flota i kadłuby: [docs/implementation-v0.3.md](docs/implementation-v0.3.md).

Ratunek i odzysk: [docs/implementation-v0.4.md](docs/implementation-v0.4.md).

Eksploracja i kontrakty badawcze: [docs/implementation-v0.5.md](docs/implementation-v0.5.md).

Doświadczenie i umiejętności pilotów: [docs/implementation-v0.6.md](docs/implementation-v0.6.md).

Patrole AI i pierwsza walka: [docs/implementation-v0.7.md](docs/implementation-v0.7.md).
