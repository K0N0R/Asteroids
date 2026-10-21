# 0.118 — Akt II: Mars

## Źródło i analiza

Oryginał planu autora zapisano bez zmian w `SATUK15_Akt_II_Mars_plan_v0.4.md`. Zastępuje on dawny krótki łańcuch: przekaźnik → dwa patrole → rozpoznanie pasa. Najistotniejsze zależności to równoległy początek, ujawnianie przejść po zdarzeniach, rozdzielenie neutralizacji bazy od dostawy jej pamięci i trwałe usuwanie przeciwników. Wiedza autora o pochodzeniu SI i przyszłym Deimosie pozostaje w dokumencie projektowym, poza dialogami Aktu II.

## Realizacja faz A–D

- A: osobne regiony orbity Marsa, orbity i powierzchni Fobosa oraz asteroidy; warunkowe hiperśluzy; brak początkowych wrogów; dwa równoległe zadania; Bastion i Manta po tarczach; jedno aktualizowane zadanie zabezpieczenia sektora. Stan granic anomalii działa również w locie. Niedozwolony wlot do nieodblokowanego obszaru cofa statek do ostatniej dozwolonej pozycji.
- B: jednorazowa zasadzka trzech jednostek, odkrywana instalacja wśród złóż Fobosa, cichy terminal od zachodu lub alarm i ostrzał rdzenia. Zakład przy asteroidzie ma 12 wymaganych przeciwników w trzech skupiskach po cztery i produkuje posiłki. Zniszczenie produkcji pozostawia żywe jednostki. Tożsamości patroli i posiłków oraz uszkodzenia instalacji przechodzą między wyprawami.
- C: osobna fizyczna skrzynia pamięci wymaga podłączenia holu H i dostarczenia do Satuk 15. Radio nie przyjmuje danych zamiast skrzyni. Pamięć zachowuje ostatnią pozycję po stracie statku; jest chroniona przed zniszczeniem jak istniejąca kluczowa przesyłka, aby nie tworzyć blokady kampanii. Analiza kończy się po zamknięciu wyprawy na stacji. Dopiero wtedy otwiera się asymilacja i śluza do asteroidy. Przed analizą wraki dają tylko materiały.
- D: Kepler przechodzi przez trzy kolejne miejsca pomiarów wyłącznie przy Marsie; trzy skończone fale 2/3/4 przeciwników mają trwałe tożsamości. Utrata eskorty nie usuwa ukończonych pomiarów ani nie odnawia wyeliminowanych fal. Nowa wyprawa dostarcza następczą jednostkę. Trzeci pomiar otwiera odprawę Nowy kierunek i Wenus. Odprawę można zatwierdzić w Satuk 15 zarówno przy Marsie, jak i po powrocie w okolice Ziemi.

Fobos korzysta z istniejącej grafiki księżyca jako przyciemnionego podłoża; pamięć ma oddzielny symbol, a instalacje odrębne podpisy. Anomalie zachowują miękkie granice i pojedynczą sieć. Rozmiar ich tekstury ograniczono do 2048 pikseli na dłuższym boku, aby rozległy sektor nie tworzył wielkich buforów graficznych.

## Decyzje robocze

- Koszt tarcz zatwierdzony przez autora: 6 poszyć stalowych I, 2 maszynerie I, 3 elektroniki I i 3 układy zasilania I — istniejący `SHIELD_CONSTRUCTION`.
- Lądowanie na Fobosie korzysta z połączenia śluzowego K nazwanego „Lądowanie na Fobosie”. To osobny obszar tej samej mapy, z własnym podłożem i złożami; nie jest instancją powierzchni Księżyca.
- Współrzędne i rozstaw regionów są propozycją wdrożeniową. Nie ustanawiają rzeczywistych odległości astronomicznych.
- Ciche włamanie: 5 s przy terminalu, bez ostrzału, pracy lasera, ruchu i alarmu; 80 PD. Instalacja wykrywa podejście od frontu lub bliski ostrzał. Alarm i uszkodzenia pozostają po odwrocie.
- Instalacje wykorzystują istniejące 900 HP, start posiłków po 6 s, kolejne co 14 s, maksymalnie cztery aktywne jednostki produkcyjne. Zachowywany rejestr produkcji ma techniczny limit 1000 jednostek na kampanię.
- Asymilacja wykorzystuje dotychczasowy odzysk Raidera i Lancera: 30% szansy przy dostawie kwalifikującego się wraku, w granicach pojemności floty. Odblokowanie po analizie obejmuje również adaptacje modułów z odzysku.
- Kepler wykorzystuje istniejącą fizykę, nawigację wokół skał, 140 HP i 12 s spokojnego pomiaru. Nie rozpocznie eskorty przed zabezpieczeniem sektora.
- Opcjonalna ziemska sonda nie blokuje aktu. Druga sonda i stara instalacja mają dekoracyjne ilustracje i pozostają oznaczonym kontaktem za anomalią bez interakcji; nie są zadaniem Act II.
- Nazwa ARGOS, geneza SI, Rogue AI, siły na Deimosie i technologia przekopywania nie są wprowadzane do fabuły tego aktu.

## Zapis

Format kampanii 66, dziennik 30. Parser migruje dziennik 29: zachowuje bank, pilotów, wyposażenie i późniejsze akty. Dawny nieukończony łańcuch marsjański jest zastępowany nowymi zadaniami bez wypłacania ponownie dawnych nagród. Dawne ukończenie `mars-belt` zabezpiecza stan nowego Aktu II, aby nie odbierać dostępu do Wenus i kolejnych sektorów. Nieznane lub uszkodzone stany nadal podlegają walidacji.

## Testy i dalsza weryfikacja

15 testów nowego Aktu II obejmuje oba porządki początku, ujawnianie przejść, trwałość trzech patroli, fizyczną dostawę i odzyskanie pamięci, analizę po dokowaniu, ciche włamanie, alarm i produkcję posiłków, pełne trzy pomiary w symulacji, wymaganych przeciwników oraz migrację obu wariantów starego dziennika. Łącznie 56 testów przechodzi; obejmują również dialogi, hipernapęd, kadłuby, tarcze, paralaksę i granice anomalii. Typecheck, ESLint i build poprawne. Podgląd w odizolowanej przeglądarce: dziennik początkowy, powierzchnia Fobosa i zakład przemysłowy.

Szersze testy ujawniły 10 wcześniejszych awarii w zestawach `story.test.ts` i `mars-base.test.ts`; wszystkie dziesięć odtworzono także na kodzie HEAD sprzed wdrożenia. Dotyczą starych przygotowań kampanii, dawnych celów księżycowych i oczekiwania promienia 7500 zamiast 12000. Nie są traktowane jako zaliczone. Test zlecenia patrolowego został przeniesiony na nadal istniejący patrol Merkurego, ponieważ stary `mars-patrol` usunięto zgodnie z nowym projektem.

Faza E jest rozpoczęta testami automatycznymi i podglądem graficznym. Wymaga jeszcze ręcznego balansu ekonomii, czasu wydobycia, walk na wielu kadłubach i autorskiej oceny układu sektora. Bieżące liczby są punktem wyjścia, nie finalnym balansem.
