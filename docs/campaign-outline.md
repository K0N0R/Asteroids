# Kampania — Satuk 15 i anomalie Układu Słonecznego

Stan: 2026-10-15. Podstawa: zarys autora gry. Dokument projektowy; wersja 0.42 obejmuje ciąg mechanik aktu I do odparcia ataku i powrotu z raportem, bez ustalania tożsamości przeciwnika ani wyjaśnienia anomalii. [Rzeczywisty zakres implementacji](implementation-v0.42.md) jest węższy od opisanego niżej planu całej kampanii.

## Założenia ustalone przez autora

Naukowcy z Ziemi obserwują narastające anomalie w Układzie Słonecznym. Gracz, jako Admirał Sił Kosmicznych Ziemi, obejmuje dowodzenie nad stacją **Satuk 15**, początkowo stacjonującą przy Ziemi. Rekrutuje pilotów, buduje i rozwija flotę, zarządza stacją oraz organizuje wyprawy badające źródło zjawisk. Anomalią interesują się również sojusznicy i wrogie siły. Stawką jest bezpieczeństwo Układu Słonecznego.

Gra łączy fazę stacji z fazą akcji: przygotowanie → wybór pilota i statku → wylot → realizacja celów → powrót i rozwój. Kampania ma **10 aktów**, rozgrywanych w sektorach Układu Słonecznego. Sektory występują w małym, średnim i dużym rozmiarze. Akt nie musi odpowiadać pojedynczemu sektorowi.

Sektor zawiera cele główne, zadania dodatkowe oraz interesujące miejsca niezwiązane z zadaniami. Cele dostępne na danym etapie można wykonywać w dowolnej kolejności. Realizacja zadań stopniowo udostępnia dalsze obszary sektora. Niektóre zadania wymagają specjalistycznego statku lub są bez odpowiedniego wyposażenia bardzo trudne. Wszystkie udostępnione zadania główne i dodatkowe muszą pozostawać wykonalne.

Gracz może wracać do wcześniejszych sektorów, z wyjątkiem jawnych blokad fabularnych. Rozwój kampanii nie usuwa sandboxa przeznaczonego do testów.

Mechaniki kampanii obejmują wydobycie i niszczenie asteroid, walkę z AI, hakowanie baz oraz nowy typ wypraw nad dużymi ciałami niebieskimi. Istniejące holowanie, ratunek, eskorta, skanowanie i odzysk mogą służyć realizacji tych celów.

## Proponowane doprecyzowania zasad

Poniższe rozstrzygnięcia porządkują projekt, ale nie są dodatkowymi ustaleniami autora:

- **Przejście dalej wymaga celów głównych.** Zadania dodatkowe i miejsca do odkrycia pozostają opcjonalne. To proponowana interpretacja zdania o ukończeniu wszystkich misji sektora; wymóg wykonania również zadań dodatkowych odebrałby im opcjonalność.
- Dowolna kolejność dotyczy aktualnie dostępnych zadań. Zależności między zadaniami są jawne: gracz widzi, co i dlaczego odblokowuje następny obszar.
- Zaliczone zadania, dostawy i odkrycia pozostają zapisane między wyprawami. Nie trzeba kończyć sektora jednym pilotem ani w jednym locie. Reguły utraty statku i pilota nadal obowiązują.
- Na stacji gracz podejmuje decyzje admirała, a podczas akcji bezpośrednio steruje statkiem wybranego pilota. Nie wprowadzamy z samego zarysu sterowania wieloma jednostkami jednocześnie.
- Stacja paliw na Księżycu jest projektem fabularnym i warunkiem podróży stacji. Nie dodaje licznika paliwa, tankowania ani zasięgu pojedynczych statków.
- Satuk 15 jest nazwą docelowej stacji kampanii. Sposób podróżowania stacji i relacja między nią a lokalnymi bazami wymagają specyfikacji przed implementacją. Bazy na Księżycu, Wenus i Marsie nie oznaczają jeszcze osobnego systemu swobodnego budowania wielu stacji.

## Dziesięć aktów

Nazwy robocze i przykłady wykorzystania mechanik poniżej są propozycjami projektowymi. Lokacje, kolejność i główne wydarzenia pochodzą z zarysu autora. Drugi zapis „Akt IV” w końcowej części zarysu jest uporządkowany jako **Akt IX**.

| Akt | Rejon i funkcja w kampanii | Główny przebieg | Warunek przejścia / kulminacja |
|---|---|---|---|
| I — Pierwsze sygnały | Ziemia i Księżyc; nauka podstaw | Rozwój Satuk 15, wydobycie, łączność, dostawy do księżycowego projektu paliwowego i ochrona przed asteroidami | Ukończenie stacji paliw; atak wrogich sił na bazę ujawnia, że wyprawa nie jest wyłącznie badawcza |
| II — Niedokończona pogoń | Trasa ku Marsowi, powrót w rejon Ziemi, skierowanie ku Wenus | Pościg po ataku, kilka misji, odkrycie ograniczeń technologicznych uniemożliwiających dalszy pościg przez pas asteroid | Kulminacyjne wydarzenie i odwrót; informacja, że potrzebna technologia znajduje się na Merkurym |
| III — Przygotowanie | Wenus; spokojniejszy odcinek i powrót do rozwoju | Utworzenie bazy, przygotowanie osłon na wyprawę w pobliże Słońca, odpieranie kilku ataków | Gotowość do wymagającej misji merkuriańskiej |
| IV — W cieniu Słońca | Merkury i otoczenie Słońca; trudna ekspedycja | Dotarcie do źródła potrzebnej technologii i jej zdobycie | Główny przełom technologiczny otwierający trasę poza pas asteroid |
| V — Przyczółek marsjański | Mars; nasilona walka | Utworzenie bazy na Marsie, kolejne starcia z siłami próbującymi zatrzymać ekspedycję | Zabezpieczenie przygotowań do przekroczenia pasa |
| VI — Przejście | Pas asteroid; akt specjalny | Przedzieranie się przez pas, wykorzystanie zdobytej technologii i dotychczasowych umiejętności | Dotarcie na zewnętrzną stronę pasa |
| VII — Odpowiedź Jowisza | Jowisz; ważne odkrycie i kulminacja | Badania anomalii prowadzą do ujawnienia głównego elementu zagadki | Odkrycie zmienia rozumienie wcześniejszych wydarzeń; jego treść pozostaje do zaprojektowania |
| VIII — Daleki szlak | Saturn; spokojniejsza odbudowa | Eksploracja, pozyskiwanie zasobów, rozwój i walki między większymi wydarzeniami | Przygotowanie floty do wyprawy w rejony baz przeciwnika |
| IX — Terytorium wroga | Uran i Neptun | Odkrycie baz wroga i pierwsze bezpośrednie starcie z głównym bossem | Wynik pierwszego spotkania i otwarcie drogi do finału; sposób zakończenia walki pozostaje otwarty |
| X — Źródło | Pluton; finał | Ujawnienie prawdy o anomalii oraz końcowa konfrontacja | Finałowa walka z bossem i zakończenie historii |

Akt II nie wymaga blokowania samego dotarcia w okolice Marsa: ograniczenie może dotyczyć dalszego pościgu przez pas między Marsem a Jowiszem. Dzięki temu późniejszy powrót na Marsa w akcie V służy utworzeniu przyczółka przed właściwym przejściem w akcie VI.

Wenus zostaje celem podróży pod koniec aktu II, a rozwój tamtejszej bazy stanowi główną część aktu III. Taki podział usuwa powtarzanie tego samego etapu budowy w obu aktach.

## Sektory, zadania i odblokowywanie obszaru

Proponowany model rozdziela trzy poziomy:

| Poziom | Odpowiedzialność |
|---|---|
| Mapa Układu Słonecznego | Znane sektory, dostępne połączenia, wymagania podróży i fabularne blokady powrotu |
| Sektor | Mapa akcji o wybranym rozmiarze, lokalne obszary, baza/punkt powrotu, zadania i odkrycia |
| Instancja nad powierzchnią | Mniejsza mapa wewnątrz sektora, wejście i wyjście, własne cele i wariant tła |

Rozmiary S/M/L powinny wynikać z czasu dolotu i liczby interesujących miejsc, nie tylko promienia pustej mapy. Konkretne wymiary, liczba sektorów w aktach i długość wypraw wymagają osobnego strojenia.

Odblokowanie obszaru może oznaczać odkrycie współrzędnych, uruchomienie łączności lub otwarcie bezpiecznej drogi. Nie ustalono jeszcze, czy nieodblokowane regiony są fizycznie niedostępne, czy tylko nieznane. Projekt nie powinien traktować niewidocznej ściany jako domyślnego rozwiązania.

Każde zadanie potrzebuje identyfikatora, kategorii, warunków ujawnienia i dostępności, celów składowych, wymagań sprzętowych, rozliczenia, następstw oraz reguł porażki i ponowienia. Cele kończone w dowolnej kolejności wymagają grafu zależności, a nie pojedynczego numeru „aktualnej misji”.

Zadania dostaw powinny przyjmować częściowe wpłaty, jeśli całość przekracza możliwą ładownię. Przekazanie surowców, ukończenie zadania i odblokowanie przejścia muszą następować najwyżej raz. Projekt księżycowy nie może wymagać jednorazowego transportu większego niż dostępny statek.

Specjalizacja nie może prowadzić do trwałej blokady: wymagany statek lub technologia muszą być osiągalne przed zadaniem, a utrata jedynego egzemplarza musi pozostawiać drogę odbudowy. Interfejs powinien odróżniać wymaganie konieczne od zalecanego wyposażenia.

Zadanie dodatkowe z możliwością porażki wymaga jasnej reguły ponowienia albo trwałego rozstrzygnięcia. Nie może w nieskończoność blokować sektora. Wyjątkowe zamknięcia fabularne powinny uprzedzać o niedostępności wcześniejszych zadań.

## Lot nad powierzchnią — nowy typ instancji

Założenie autora: zachowujemy obecny sposób latania, niszczenia skał, walki i hakowania. Zmienia się otoczenie mapy oraz zestaw umieszczonych celów. Nie wynika z tego potrzeba implementacji lądowania, grawitacji, lotu atmosferycznego ani nowej fizyki pojazdu.

Instancja potrzebuje tematycznego tła powierzchni, wejścia i wyjścia, skał/obiektów, wieżyczek lub baz oraz lokalnych celów. Cele mogą należeć do zadania głównego, dodatkowego albo służyć samej eksploracji. Nad gazowymi olbrzymami oprawa może przedstawiać chmury i obiekty orbitalne; mapy ze stałą powierzchnią można wiązać również z ich księżycami.

Wejście i wyjście nie są powrotem do stacji ani końcem wyprawy. Proponowana reguła: ten sam pilot, statek, ładunek, uszkodzenia, zestawy i hol przechodzą między mapami bez duplikowania nagród. Powrót do sektora odtwarza jego stan. Dokładne zasady holu, wrogów przy wejściu, odwrotu i przerwanej sesji trzeba doprecyzować przed wdrożeniem tej warstwy.

Instancja powinna korzystać z tych samych komponentów celów i walki co kosmos. Nie budujemy osobnego zestawu zasad wydobycia i rozliczenia tylko z powodu zmiany tła.

## Proponowany pierwszy fragment kampanii: Akt I

Najpierw potrzebna jest grywalna, krótka sekwencja ziemsko-księżycowa. Poniższy zestaw jest szkicem misji, nie gotowym scenariuszem dialogowym ani ustaloną listą zasobów.

| Zadanie robocze | Mechanika i rola | Co udostępnia |
|---|---|---|
| Objęcie dowodzenia | Satuk 15, wybór pilota i Prospectora; podstawy przygotowania wyprawy | Początkowy obszar przy Ziemi |
| Pierwszy transport | Wydobycie i bezpieczny powrót z dostawą | Pierwszy rozwój stacji i kolejne lokalne zadania |
| Sieć łączności | Dolot do punktów i skanowanie/uruchomienie przekaźnika | Odleglejszy obszar oraz dane potrzebne do otwarcia trasy księżycowej |
| Projekt księżycowy | Dostawy surowców w kilku wyprawach; wspólny, trwały postęp projektu | Kolejne etapy budowy i obszar działań przy Księżycu |
| Ochrona budowy | Niszczenie nadlatujących asteroid | Możliwość ukończenia infrastruktury |
| Atak na bazę | Obrona i pierwsza istotna walka z wrogimi siłami | Zakończenie aktu i cel pościgu z aktu II |

Pierwszy transport i łączność mogą być równoległymi gałęziami po wprowadzeniu. Projekt księżycowy i jego obrona zbiegają się przed finałem. Dokładna kolejność ukończenia budowy i ataku wymaga rozpisania: zarys ustala oba wydarzenia na końcu aktu, ale nie rozstrzyga ich sekwencji.

Przykłady zawartości opcjonalnej: ratunek pilota, odzysk wraku, bogate złoże, porzucona instalacja lub dodatkowy sygnał. Nie ustalono, które z nich trafią do finalnej wersji aktu. Cały obowiązkowy początek musi być wykonalny flotą dostępną na tym etapie.

## Zakres kolejnych prac implementacyjnych

1. **Stan kampanii i sektorów:** oddzielne definicje aktów, sektorów, zadań, zależności i trwałego postępu; wersjonowanie zapisu i niezależność sandboxa. Dotychczasowego zapisu testowej kampanii nie przepisujemy bez uzgodnionej reguły migracji.
2. **Pierwszy sektor kampanii:** Satuk 15, obszar przy Ziemi, pierwszy transport, łączność, równoległe cele i trwałe odblokowanie dalszej części mapy.
3. **Przejście Ziemia–Księżyc:** podróże, powroty, projekt dostaw, obrona oraz finał aktu I. Część księżycowa jest pierwszym kandydatem na instancję nad powierzchnią.
4. **Instancje:** przenoszenie stanu wyprawy, zachowanie sektora nadrzędnego i wznowienie go po wyjściu; oprawa powierzchni, wieżyczki i lokalne cele.
5. **Dalsze akty:** po sprawdzeniu całego aktu I uzupełnianie mapy kampanii i zawartości kolejnych etapów, z powrotem do znanych sektorów i blokadami fabularnymi.

To proponowana kolejność, nie wdrożone funkcje ani zobowiązanie do zbudowania wszystkich dziesięciu aktów w jednym kroku.

## Otwarte decyzje fabularne i systemowe

- Czym naprawdę jest anomalia, dlaczego narasta i jakie ślady jej natury pojawiają się przed aktami VII i X?
- Kim są przeciwnicy, sojusznicy i główny boss; czego chcą i dlaczego atakują bazę księżycową?
- Jakie dokładnie odkrycie na Jowiszu zmienia rozumienie sytuacji, a jaka część prawdy zostaje na Pluton?
- Czym jest technologia z Merkurego i dlaczego umożliwia przejście pasa? Jaki jest charakter kulminacji aktu II?
- Czy Satuk 15 podróżuje fizycznie razem z flotą, a bazy są lokalnymi punktami wypadowymi, czy podróże mają inny model?
- Jak rozstrzygamy śmierć i przerwaną grę wewnątrz instancji oraz utratę obiektów potrzebnych do zadania?
- Czy blokady fabularne mogą czasowo zamknąć zadania dodatkowe i jakie ostrzeżenie dostaje gracz?
- Ile sektorów i obowiązkowych wypraw ma każdy akt oraz jaki jest docelowy czas całej kampanii?

To lista do dalszego projektowania. Dokument nie dopisuje odpowiedzi jako ustalonego kanonu.
