# Prototyp 0.2 — załoga i naprawy

## Mechanik w bazie

Nowy panel Załoga pozwala zatrudnić Adę Vale za 12 rudy i kolejkować do trzech zadań. Rafinacja zamienia 8 rudy w komponent przez 45 sekund; produkcja zestawu kosztuje 6 rudy i komponent oraz trwa 30 sekund. Koszt rezerwujemy przed pracą. Materiały w kolejce nadal zajmują miejsce w magazynie, więc anulowanie może zawsze bezpiecznie zwrócić pełny koszt.

Praca korzysta z czasu faktycznie wykonanego przez symulację misji. Pobyt w bazie, pauza i brak uruchomionej gry nie przyspieszają kolejki. Zakończenie zadania przechodzi do kolejnego z zachowaniem pozostałego czasu kroku. Ukończenie zapisujemy od razu, a bieżący postęp co 5 sekund lotu. Mechanik i produkcja pozostają w bazie przy śmierci pilota. Zapas mieści 10 zestawów.

## Awaria napędu

Zderzenie zadające co najmniej 20 punktów obrażeń uszkadza napęd. Ciąg spada do 45%, a silniki migają na czerwono. Hamowanie pozostaje sprawne, dzięki czemu gracz może bez zestawu wrócić do bazy. HUD pokazuje awarię, zapas zestawów, postęp naprawy oraz pracę załogi.

Przytrzymanie R przez 5 sekund przy prędkości poniżej 80 m/s naprawia napęd oraz 25 punktów kadłuba. Naprawa zużywa jeden zestaw; ciąg, strzelanie, interakcja, zbyt szybki lot lub nowe obrażenia przerywają postęp. R może też naprawić sam uszkodzony kadłub. Naprawa nie działa po zakończeniu wyprawy ani na zniszczonym statku.

Na statek automatycznie przenosimy do dwóch zestawów z bazy. Niewykorzystane wracają po dokowaniu; odświeżenie lub zniszczenie usuwa zapas na pokładzie. Błąd inicjalizacji sektora zwraca zestawy i nie jest traktowany jako porażka.

## Zgodność zapisu

Klucz localStorage pozostaje `asteroids.campaign.v1`, a wewnętrzna wersja danych wzrasta do 2. Migracja zachowuje bank, pilotów, wyposażenie, stację, statystyki i aktywną wyprawę. Starsza kampania zaczynająca pierwszy lot otrzymuje zestaw startowy; stara aktywna wyprawa nie dostaje dodatkowych zestawów i nadal rozlicza się jako utracona przy wczytaniu. Kolejka, identyfikatory i zakresy postępu są walidowane przy odczycie.

## Weryfikacja

20 testów obejmuje dotychczasową pętlę oraz migrację, kolejkę, zwrot materiałów, miejsce zarezerwowane w magazynie, pracę podczas misji, jednorazowe wyniki, trwałość mechanika po stracie, obieg zestawów i naprawy w rzeczywistym świecie Rapier. Kontrola TypeScript, lint oraz build produkcyjny pozostają obowiązkowe.

Panel, zatrudnienie, kolejkę, anulowanie, ukończenie produkcji podczas misji, pauzę, HUD, awarię po zderzeniu, naprawę oraz powrót do bazy sprawdzono w osobnej kampanii przeglądarkowej na porcie 3001. Naprawa podniosła kadłub z 74 do 99 i zużyła jeden zestaw. Po dokowaniu w bazie pozostały oba wyniki produkcji. Testowe materiały nie zostały przyznane kampanii użytkownika na porcie 3000.

Walka, załoga na pokładzie, praca offline, ratowanie pilotów, odzyskiwanie wraków i wznowienie misji pozostają kolejnymi etapami.
