# Aktualny plan rozwoju

Stan: 2026-10-24, wersja robocza 0.137.

Ten plik określa aktualny backlog. `plan-v0.1.md`, `roadmap-after-v0.19.md` oraz opisy `implementation-*` zachowują historię decyzji; ich dawne zdania „następny etap” nie oznaczają niezrealizowanych zadań.

## Start aktów od początku 0.137

Narzędzia ESC zastępują swobodne przełączanie sektora świeżymi początkami aktów I–X. Poprzednie wymagane zadania są ukończone, a wybrany etap ma wyzerowane misje, świat, łączność i odpowiednie zakłady oraz flotę. Normalne blokady odkrywania pozostają aktywne. Dostępny jest reset bieżącego etapu, osobny Akt V na Marsie i dodatkowe wejścia na Księżyc oraz Neptuna. Wszystko działa w oddzielnym zapisie testowym. [Zakres i testy](implementation-v0.137.md).

## Ekspedycja naukowa Marsa 0.136

Kepler wykonuje trzy pomiary przy brzegach anomalii, po czym fizycznie wraca do Satuk 15. Ostatni nalot następuje na kursie powrotnym; sukces wymaga doprowadzenia jednostki z danymi do stacji. Statek i drony korzystają z tras sprawdzanych względem pola anomalii i skał. Naloty powstają tylko poza aktualnym obróconym widokiem kamery i w bezpiecznych korytarzach, bez pojawiania się przy punkcie badania. Skanowanie ma ruchomą wiązkę, stożek sensora i impulsy na rzeczywistym brzegu anomalii. [Szczegóły i walidacja](implementation-v0.136.md).

## Stabilność WebGL i poprawki Fobosa 0.135

Usunięto transfer ImageBitmap z rasteryzacji anomalii. Pula ma maksymalnie 48 ponownie używanych tekstur 320×320 i zachowane piksele do odtworzenia po awarii GPU. Ten sam widok obsługuje powroty między mapami Marsa. Utrata kontekstu zatrzymuje symulację i dźwięk, zapisuje znacznik ochrony wyprawy, a odtworzenie otwiera pauzę. Brak nowego resetu formatu zapisu. Pojedynczy obrys F/H mierzy fizyczny model celu; stare łuki postępu usunięto. Kepler nie dostaje rozkazu kończenia poprzedniej misji. Baza Fobosa ma jeden wolny patrol i poprawnie podłączony terminal; zasadzka rozpoczyna się atakiem, komunikat następuje po walce. [Dowody i zakres testów](implementation-v0.135.md).

## Stopniowe odkrywanie i oprawa urządzeń 0.134

**Wiedza z planu projektowego nie jest wiedzą gracza.** Nowe teksty i widoki mają opisywać odkryte fakty, bieżący cel oraz dostępne działanie. Nie zapowiadają przyszłej planety, technologii, kadłuba ani pełnej liczby tierów tylko dlatego, że istnieją w planie. Koszt materiałów może blokować znany projekt; brak fabularnej wiedzy ukrywa projekt. Istniejące instalacje pozostają dostępne. Wspólne reguły: `frontend/game/state/discovery.ts`.

Zastosowano je w Rozbudowie stacji, produkcji, stoczni, modułach, tarczach, bazie księżycowej i mapie podróży. Ekstrakcja ujawnia się po zakończeniu aktu II jako badania; jej projekt montażowy pojawia się po zdobyciu technologii. Nowe ilustracje urządzeń odpowiadają funkcji i poziomowi. Odprawy nie zdradzają już Merkurego przed zakończeniem przygotowań Wenus. [Szczegóły i testy](implementation-v0.134.md).

## Poprawki HUD i stabilności 0.133

Usunięto nieistniejący laser Lancera i Raidera, powielone podpisy przy ikonach oraz stary tekst zdolności Widma. Wyśrodkowano oznaczenia i odnowienie. Kamuflaż ma przezroczystą sylwetkę i ograniczoną smugę. Naprawiono narastanie subskrypcji tekstów po restartach, zwalnianie metadanych buforów oraz zatrzymywanie aktualizacji przy klatkach ponad 100 ms. Ciągłe trafienia mają ograniczoną częstość dodatkowych iskier. [Weryfikacja i ograniczenia](implementation-v0.133.md).

## Poprawki po testach 0.132

H obsługuje wszystkie rodzaje holu; F pozostałe interakcje. Wspólne przytrzymanie 1 s i okrąg postępu obejmują śluzy, bazy, dokowanie, skany, połączenia terminali i holowanie. Nowy HUD zdolności, trwała łączność bez pauzy, odróżnienie informacji chwilowych, odświeżone znaczniki podróży, poprawione widoki zamontowanych zakładów i prowadzenie do kolejnego aktu. Anomalia ma limit kafelków, miękkie łączenia i odzyskiwanie kolejki po awarii workera; silniki mają barwę zależną od tieru oraz wygaszanie pętli po zatrzymaniu aktualizacji. [Szczegóły i ograniczenia walidacji](implementation-v0.132.md).

## Wdrożenie robocze 0.131 — gospodarka, flota i sterowanie

Ustalenia z 2026-10-23: pierwszy quest buduje Laboratorium I z pierwiastków; misja księżycowa działa przed Warsztatem i może dać ocalałego Muła. Dopiero po niej budujemy Warsztat I i otwieramy produkcję części oraz wszystkich statków I. Laboratorium i Warsztat rozwijamy osobno; usuwamy oczyszczanie Cu/Si, przygotowanie tlenu i przewodniki. Wyższe części wymagają materiałów anomalii po technologii z Merkurego. Proponowane granice: II po Merkurym, III po Jowiszu. [Pełne receptury, koszty, przebieg misji i refaktor Rozbudowy stacji](station-progression-rebalance-plan.md).

Prospector: tier 0, bez produkcji i ulepszeń. Tier I: Swift, Muł, Manta, Bastion, Harpun. II: Sokół, Widmo, Atlas z Q. III: Aegis, Żądło, Feniks z Q/E. Projekty zależą od tieru, bez osobnych questów; tarcze Marsa nie otwierają Bastiona/Manty. Nowe role i zdolności, EMP oraz wielohol Manty: [plan floty i sterowania](fleet-progression-controls-plan.md).

Interakcje oraz śluzy przechodzą na **F**. **Spacja i K są całkowicie odpięte**, etykiety śluz bez K. Q/E służą zdolnościom odpowiednich tierów. Mechaniki są zaimplementowane. Build produkcyjny i kontrola typów przechodzą; pełna regresja nadal wymaga pracy. [Stan wdrożenia, weryfikacja i pozostałe zadania](implementation-v0.131.md).

Poniższe wpisy wdrożeń opisują historię; ich zasady produkcji Prospectora, questowych odblokowań statków, paczki części księżycowych i sterowania nie są wymaganiami nowego planu.

## Wdrożenie 0.130 — zasoby na radarze i nowy układ Fobosa

Radar orbity Marsa nie pokazuje złóż z powierzchni Fobosa ani skał poza grywalnym obszarem. Orbitalne pola są generowane z zapasem wewnątrz granic map. Śluza powrotna z Fobosa jest na południowym zachodzie; południowa anomalia została usunięta, a większa strefa zajmuje północ i północny zachód. Aktualny układ zastępuje wcześniejsze założenie o 25% pokrycia Fobosa. 135 testów zakresu zmian przechodzą. [Szczegóły](implementation-v0.130.md).

## Wdrożenie 0.129 — radar, bezpieczne śluzy i obrzeża anomalii

Naprawiono jednolite czerwone wypełnienie radaru w czystym obszarze i przy zmianie skali. Obie trasy śluz Mars–Fobos–asteroida mają wolny pas w grafice i polu obrażeń. Anomalia ma nieregularny zasięg poza granicą gry, a statek zachowuje kierunek przelotu również po ostatniej klatce. 132 testy zakresu zmian przechodzą. [Szczegóły](implementation-v0.129.md).

## Wdrożenie 0.128 — czytelna, ruchoma anomalia i radar

Zwiększono nieregularność brzegów labiryntu i amplitudę płynnej deformacji włókien. Stała, mała warstwa mgły pokazuje niebezpieczne wnętrza również podczas doczytywania szczegółów. Radar jest większy o 25%, ma zanikający ślad lotu, kolorowe pole anomalii i zoom pod `[` / `]` (×0.75–×4). Przejścia i powierzchnie zachowują właściwą historię śladu. 127 testów zakresu zmian przechodzi; podgląd przeglądarkowy potwierdza pokrycie zagrożeń, ruch siatki, klawisze zoomu i zwolnienie zasobów. [Szczegóły](implementation-v0.128.md).

## Wdrożenie 0.127 — organiczny labirynt, płynne śluzy i narzędzia testowe

[Plan aktu II v0.6](SATUK15_Akt_II_Mars_plan_v0.6.md) uzupełnia poprzedni układ. Moduł pamięci nadal wymaga dostawy, natomiast odzysk wraków statków jest opcjonalny. Labirynt ma zakrzywione, rozgałęzione przejścia i falującą grafikę; obiekty i radar działają w trakcie przelotu śluzą. Ograniczono aktywną fizykę i pamięć grafiki, dodano techniczny powrót i osobny zapis testowy z dowolnym sektorem. Prospector zawsze rozpada się po utracie sygnału. [Raport i weryfikacja](implementation-v0.127.md).

## Wdrożenie 0.126 — lądowanie Fobosa i ruch podczas animacji

Szeroki kadr lądowania filtruje obiekty według bieżącego obszaru. Nie pokazuje Satuk 15, jej dronów, asteroid z innych map ani warstwy ziemskiego Księżyca. Podczas wylotu, dokowania i transferów fizyka otoczenia nadal działa; statek i hol pozostają pod kontrolą animacji, bez obrażeń i uruchamiania walki. [Szczegóły i testy](implementation-v0.126.md).

## Wdrożenie 0.125 — płynność zwykłego lotu

Rysowanie anomalii przeniesiono do workera i podzielono na małe fragmenty przygotowywane z wyprzedzeniem. Zastępuje to synchroniczną wymianę dużego okna grafiki z 0.124. Zachowano szczegółowość włókien; zwalnianie obejmuje bitmapy, tekstury i worker. [Pomiary i weryfikacja](implementation-v0.125.md).

## Wdrożenie 0.124 — oprawa i przeloty aktu II

Spójne barwy Fobosa, szczegółowe okno grafiki anomalii wokół kamery, radar bez anomalii, ciągłe animowane przeloty śluzami, zasięg rysowania uwzględniający rozmiar asteroidy i Kepler dopiero po odblokowaniu eskorty. 77 testów przechodzi. [Szczegóły i weryfikacja](implementation-v0.124.md).

## Wdrożenie 0.123 — przebudowa Aktu II według planu v0.5

[Uzupełnienie planu v0.5](SATUK15_Akt_II_Mars_plan_v0.5.md) określa trzy oddzielne obszary orbitalne (Mars 75% anomalii, Fobos 25%, asteroida 0%) oraz powierzchnię Fobosa. Zastępuje wcześniejsze założenie o wspólnej mapie i dostępności Deimosa. Obejmuje rozgałęziony labirynt, skaner bazy, minigrę, wyłączanie patroli do holowania i usunięcie blokowania wylotu. Wdrożono trzy osobne mapy orbitalne i powierzchnię Fobosa, minigrę ze skanerem i holowaniem wyłączonych patroli, migrację zapisów i optymalizację przygotowania anomalii. 75 testów przechodzi. [Szczegóły, pomiary i pozostały balans](implementation-v0.123.md).

## Wdrożenie 0.122 — labirynt i obrażenia anomalii

Śluza Fobosa znajduje się na końcu długiego labiryntu z siedmioma odcinkami, dwunastoma zakrętami i jednym wejściem; przegrody zamykają skrót od zewnątrz. Radar pokazuje pasma, nawigacja wskazuje wejście, a skały nie zatykają korytarzy. Anomalie ograniczają prędkość do 25 m/s i od razu odbierają 15 punktów kadłuba/s, z pominięciem tarcz — 1.5× obrażenia poza sektorem. Dotyczy to również istniejącej anomalii przy Jowiszu. [Szczegóły i testy](implementation-v0.122.md).

## Wdrożenie 0.121 — lądowania na księżycach Marsa

Fobos i Deimos mają własne podejścia orbitalne i powierzchnie, osiągane jak Księżyc: E przez 2 sekundy, animowane zejście oraz powrót. Zastąpiono zwykłą trasę do gruntu Fobosa prawdziwym przejściem między obszarami. Lądowanie na Fobosie nadal wymaga zabezpieczenia orbity; jego instalacja i fizyczny moduł pamięci działają na powierzchni. Deimos jest dostępny do eksploracji bez nowych zadań — nowe polecenie autora zastępuje wcześniejsze założenie o całkowitej blokadzie tego księżyca w akcie II. Radar, zapis i sygnały ratunkowe rozróżniają oba księżyce. [Szczegóły i testy](implementation-v0.121.md).

## Wdrożenie 0.120 — ładownie i sprzątanie scen

Bazowa pojemność wszystkich statków wzrosła o 25%. Poziomy ładowni I / II / III dają odpowiednio ×1.25 / ×1.5 / ×2 nowej bazy. Ograniczono nadmierny uzysk skał z 0.119, zachowując powszechny tlen i budżet startowych receptur Marsa. Zamknięcie panelu pokładu usuwa callbacki zatrzymujące symulację; powrót do bazy zwalnia wolne bufory renderowania. Ten sam sektor nie przebudowuje niepotrzebnie tła. 63 testy, kontrola typów i build przechodzą. Zgłoszony wielogodzinny wzrost pamięci pozostaje do potwierdzenia w rzeczywistej sesji; krótsze próby nie odtworzyły kilkunastu GB. [Szczegóły i ograniczenia diagnostyki](implementation-v0.120.md).

## Wdrożenie 0.119 — obfitość surowców

Tlen i węgiel są stałym urobkiem zwykłych skał, a nie wyłącznie losową domieszką. Zwiększono uzysk żelaza, pozostałych domieszek, miedzi, krzemu, wodoru i złoża tytanowego. Mars ma dodatkowe bogate pole na dostępnej od początku spokojnej orbicie oraz częstsze złoża miedzi i krzemu. Test budżetu receptur wymaga co najmniej dwukrotności materiałów na tarcze Satuk 15 i dwa zapasowe Prospectory przed odblokowaniem Fobosa. [Szczegóły balansu](implementation-v0.119.md).

## Wdrożenie 0.118 — refaktor Aktu II: Mars

Źródło projektu autora: [SATUK 15 — Akt II, v0.4](SATUK15_Akt_II_Mars_plan_v0.4.md). Oryginał zachowuje status koncepcji i nie jest nadpisywany raportem realizacji.

Nowy przebieg obejmuje dwa równoległe cele początkowe, warunkowo odkrywany Fobos, jednorazową zasadzkę trzech jednostek, bazę z wariantem cichego włamania lub walki, fizyczny moduł pamięci, analizę SI, asymilację, zakład przy dużej asteroidzie z trzema grupami po cztery jednostki i eskortę przez trzy pomiary na orbicie Marsa. Wieloetapowe zabezpieczenie sektora pozostaje jednym zadaniem. Mars i Deimos nie otrzymują dostępu do powierzchni w akcie II. Bastion i Manta wymagają tarcz Satuk 15; koszt tarcz pozostaje istniejący, zgodnie z odpowiedzią autora.

Format kampanii 66 pozostaje, dziennik przechodzi na 30 z automatyczną migracją 29. Częściowo rozpoczęty dawny łańcuch Marsa rozpoczyna nową strukturę aktu bez odbierania zasobów i floty; ukończony dawny łańcuch zachowuje przejście do dalszych aktów. [Analiza, decyzje wdrożeniowe, testy i pozostały balans](implementation-v0.118.md).

Dalsze prace dla tego aktu: ręczne przejście ekonomii i trudności na różnych kadłubach, dopracowanie ujęć lądowania Fobosa i autorskich dialogów oraz zatwierdzenie docelowych współrzędnych i zasad opcjonalnego sabotażu zakładu. Technologia wycinania anomalii, Mars i Deimos po powrocie pozostają zakresem późniejszych aktów.

## Wdrożenie 0.117 — wygląd obszarów anomalii

Skażone pasma otrzymały rdzawopomarańczową sieć nieregularnych włókien, jasne węzły, ciemne zagłębienia i delikatne chłodne drobiny, inspirowane lewą górną częścią referencji autora. Zielone oznaczenia wskazują istniejące bezpieczne korytarze. Poprawka 0.117.1 usuwa twarde wielokątne granice i nakładanie osobnych ilustracji: cały obszar ma jedną wspólną sieć, rysowaną raz na krawędź włókna, z miękkim zanikaniem w kosmosie. [Zakres](implementation-v0.117.md).

**Docelowa mechanika, do wdrożenia:** anomalie są specyficznymi obszarami, przez które gracz będzie mógł „przekopać się” po zdobyciu odpowiedniej technologii. Do ustalenia pozostają technologia i jej odblokowanie, sposób oraz szerokość wycinania przejścia, koszt, trwałość zmian i ich zapis, a także odwzorowanie zmian w kolizjach, obrażeniach, radarze i misjach. Obecny pakiet zmienia grafikę; nie dodaje jeszcze usuwania fragmentów anomalii. Ciemne zagłębienia wewnątrz skażonego pasma są jego teksturą, nie nowymi bezpiecznymi przejściami.

## Wdrożenie 0.116 — grafika Ceres

Ceres jest przygotowana jako osobna ilustracja planety karłowatej: szara powierzchnia z większymi i drobnymi kraterami, niskokontrastowymi formacjami i charakterystycznymi jasnymi plamami w jednym z basenów. `planetView('ceres')` udostępnia ją do późniejszego użycia. Nie ustalono jeszcze pozycji, obszaru misji ani zasad obecności w pasie asteroid. [Zakres](implementation-v0.116.md).

## Wdrożenie 0.115 — Pluton

Pluton ma nową ilustrację lodowych równin i rdzawoczerwonych obszarów, asymetryczne jasne „serce” z delikatnym podziałem powierzchni, wyspy szronu, kratery i zakrzywiony cień. Osłabiona poświata odróżnia skalisty glob od gazowych planet. Grafika jest wspólna dla mapy, bazy i lotu. [Zakres](implementation-v0.115.md).

## Wdrożenie 0.114 — Neptun

Neptun ma głęboką kobaltową atmosferę, jasne pofalowane smugi chmur, mniejszy wir na północy i duży kompleks burzowy z ciemnym środkiem oraz nieregularnym śladem chmur. Zakrzywiony cień zastępuje prostą granicę półkul. Ilustracja nawiązuje do referencji autora i działa we wszystkich widokach planety. [Zakres](implementation-v0.114.md).

## Wdrożenie 0.113 — Uran

Uran ma turkusowo-cyjanową atmosferę, jasny obszar polarny, szerokie zakrzywione pasma i delikatne smugi. Dawne grube pierścienie zastąpiono trzema cienkimi ukośnymi pasmami z poprawnym zasłanianiem przez glob. Wygląd łączy obie referencje autora i jest wspólny dla mapy, bazy oraz lotu. [Zakres](implementation-v0.113.md).

## Wdrożenie 0.112 — Saturn

Saturn ma subtelne kremowo-złote pasma chmur i drobne wiry, zakrzywiony cień oraz nachylone, warstwowe pierścienie z przejrzystą przerwą i cienkimi bruzdami. Przednia i tylna połowa pierścieni korzystają z tej samej geometrii, z globem pomiędzy nimi. Nowa ilustracja działa we wszystkich widokach wspólnego renderera planet. [Zakres](implementation-v0.112.md).

## Wdrożenie 0.111 — Jowisz

Jowisz ma falujące kremowe, ochrowe i rdzawe pasy chmur, pofałdowane smugi, drobne białe owale i wiry oraz wyraźną Wielką Czerwoną Plamę z wyginającym się wokół niej strumieniem chmur. Zakrzywiony cień zastępuje prostą granicę półkul. Nowa ilustracja jest wspólna dla mapy, bazy i lotu. [Zakres](implementation-v0.111.md).

## Wdrożenie 0.110 — Merkury

Merkury ma nową ilustrację inspirowaną kolorystyką referencji autora: złotawe wyżyny, chłodne niebieskoszare równiny, duży basen uderzeniowy, zróżnicowane kratery i jasne promienie wyrzutowe wokół trzech uderzeń. Zakrzywiony cień zastępuje prosty podział półkul; osłabiono dekoracyjną poświatę. Nowy wygląd jest wspólny dla mapy, bazy i lotu. [Zakres](implementation-v0.110.md).

## Wdrożenie 0.109 — Wenus

Wenus ma nową kremowo-złotą atmosferę: szerokie zakrzywione fronty, drobne smugi chmur i trzy wiry, zakrzywiony cień oraz cienką chłodną obwódkę atmosfery. Ilustracja zastępuje proste poziome pasy we wszystkich widokach korzystających ze wspólnego renderera planet. [Zakres](implementation-v0.109.md).

## Wdrożenie 0.108 — Mars, Fobos i Deimos

Odświeżony Mars ma zaokrąglone równiny, większe ciemne obszary, rozgałęziony kanion, formacje wulkaniczne, kratery i czapy polarne. Fobos i Deimos są osobnymi ilustracjami o nieregularnych sylwetkach, różnych barwach i układach kraterów. Trzy obiekty korzystają ze wspólnego renderera paralaksy w sektorze Marsa. Pozycje i skale księżyców są tymczasowym kadrem graficznym, nie projektem sektora: dokładny układ, odległości i obszary misji określi później autor. [Zakres](implementation-v0.108.md).

## Wdrożenie 0.107 — reżyseria lotu i dalsza oprawa

Wylot ma krótką sekwencję odejścia od Satuk 15, a poprawnie zakończony powrót — animację podejścia do doku przed ekranem rozliczenia. Odkrywanie pobliskich instalacji otrzymało krótkie ujęcia kamery i niemodalne komentarze naukowca. Kontakt z przeciwnikiem, wysoka temperatura i krytyczny kadłub wywołują ostrzeżenia; manewr lub zagrożenie oddaje kamerę pilotowi. Odświeżono sześć ról przeciwników, sondę, przekaźnik, archiwum, chronioną instalację i stocznię polową, efekty osłony i wybuchu oraz kratery i podejście do placówki księżycowej. [Zakres, testy i ograniczenia](implementation-v0.107.md).

To pierwszy pakiet obu punktów: nadal pozostają reżyserowane sceny kluczowych wydarzeń, autorskie dialogi dalszych aktów oraz oprawa grywalnych powierzchni kolejnych planet, gdy powstaną ich instancje misji.

## Wdrożenie 0.106 — Hangar i Stocznia

Hangar i Stocznia są osobnymi zakładkami menu; Stocznia ma własną ikonę suwnicy z kadłubem. Wybór statku lub projektu pozostaje w bocznej liście. Parametry, budowa, ulepszenia i warianty mają oddzielne widoki. Każdy z sześciu modułów ma własną zakładkę z porównaniem efektu i kosztami właściwego tieru. Przy częściach są odnośniki „Stwórz” z powrotem do wybranego modułu lub projektu. Warianty pokazują trzy istniejące kierunki wyposażenia oraz ich rzeczywiste parametry. Podgląd statku mieści się w osobnym obszarze pod wyborem I/II/III, również dla długich kadłubów. [Szczegóły i weryfikacja](implementation-v0.106.md).

## Wdrożenie 0.105 — części tieru II i III

Sześć rodzin części oraz lekkie poszycie mają teraz poziomy I–III. Czternaście nowych receptur łączy poprzedni tier z materiałami i podzespołami, bez produkcji w tle. Zaplecze I odblokowuje tier II; zaplecze II — tier III. Każdy wyższy tier ma osobną ilustrację konstrukcji we wspólnym katalogu ikon. Warsztat ma przełączniki I/II/III, zachowuje rodzinę przy zmianie tieru i pozwala przejść do składnika oraz wrócić.

Kadłuby wymagają sześciu rodzin części na poziomie właściwym projektowi; Sokół, Widmo, Żądło i Feniks korzystają z lekkiego poszycia. Moduły statku I/II/III zużywają dokładnie odpowiedni tier. Rozbudowa zaplecza II jest składana z części II, dostępnych już na zapleczu I. Recykling zwraca te same rodziny i poziomy, które były wymagane do budowy i ulepszeń. Początkowe kadłuby oraz pierwsza rozbudowa nadal używają części I.

Format kampanii 66 odrzuca zapisy 65 i starsze; dziennik 29 bez zmian. [Receptury, zastosowania i weryfikacja](implementation-v0.105.md).

Pozostały zakres gospodarki: kolejne warianty materiałowe i ich świadomy wybór z właściwościami zapisywanymi w konstrukcji, manifesty dalszych aktów oraz balans czasu ręcznej produkcji. Same tiery części II–III są wdrożone.

## Wdrożenie 0.104 — pamięć, hipernapęd, czytelność lotu i muzyka

Geometria usuniętych asteroid jest zwalniana po zniszczeniu ostatniego korzystającego z niej widoku. Muzyka korzysta z jednego strumieniowanego elementu audio; pauza po utracie fokusu zachowuje pozycję bez zmieniania początku pętli. Hipernapęd ignoruje przeszkody i wyłącza kolizje statku oraz holu na czas ładowania i przelotu, przywracając je w zwykłym locie.

HUD pokazuje wyłącznie aktywne cele. Rozróżniono wcześniejszą ochronę budowy przed asteroidami i późniejszą obronę stacji przed wrogami; niepodjęta ochrona budowy znika po zakończeniu późniejszej obrony. Teksty HUD i oznaczenia świata mają cień. Przyciemniono Księżyc, a transfery otrzymały delikatne wygaszenie, łuk horyzontu, smugi ruchu i czytelniejsze podpisy. Format kampanii 65 i dziennika 29 bez zmian. [Szczegóły i ograniczenia diagnozy pamięci](implementation-v0.104.md).

## Wdrożenie 0.103 — Ziemia i Księżyc

Ziemia ma uproszczone obrysy kontynentów w rzucie ortograficznym od strony Atlantyku, z Grenlandią, wyspami i oddzielnymi białymi chmurami. Chmury delikatnie dryfują niezależnie od lądu, również w locie i na mapie. Ukryta półkula nie przebija przez glob. Księżyc pokazuje schemat mórz widocznej strony oraz większe kratery, w tym Tycho i Kopernik z promieniami wyrzutowymi. Zachowano płaskie kolory i lekkie cieniowanie w stylistyce ilustracji edukacyjnej. Dotychczasowa skala i paralaksa pozostają. [Szczegóły](implementation-v0.103.md).

## Wdrożenie 0.102 — nabór, rozwój i użyteczne specjalizacje pilotów

Nabór ma listę kandydatów z portretami, panel porównania specjalizacji, cztery konkretne parametry oraz koszt magazyn/wymóg. Zatrudnienie od razu otwiera nowego pilota; brak żelaza, miejsc lub trwająca wyprawa wyjaśniają blokadę. Rozwój pokazuje PD, punkty i rzeczywisty efekt każdego szkolenia teraz → po rozwinięciu, z uwzględnieniem perku, statku i limitu szansy kapsuły.

Specjalizacje: Nawigacja — obrót +20%, hamowanie +10%; Eksploatacja złóż — moc wydobycia +20%, hamowanie +20%; Zwiad — tempo skanowania +35%, premia kapsuły +20 p.p. Szkolenie manewrów daje +6%, wydobycia +10% na poziom; procedury ewakuacji nadal +6 p.p. Premie są używane w symulacji, nie tylko w opisach.

Fryzury, ich tylne warstwy i słuchawki dopasowują szerokość do obrysu głowy. Poprawiono ostry wystający fragment zaczesanej fryzury Miry. Generyczne odcienie skóry mają ważony rozkład z większym udziałem jaśniejszych odcieni i bez powtarzania tego samego tonu w jednej trójce kandydatów. Stałe postacie fabularne zachowują wizerunki. [Szczegóły](implementation-v0.102.md).

## Wdrożenie 0.101 — postacie fabularne i wspólna pula portretów

Doprecyzowanie autora z 2026-10-20 zrealizowane przed częściami II–III: portrety bez hełmów, oczu, nosa i ust, z lekkim obrotem, zgodne z referencjami. Różnicujemy obrys twarzy, fryzurę, ubiór i kolory zamiast dodawać elementy twarzy.

Wspólna biblioteka ma 15 fryzur, 8 obrysów twarzy, 6 krojów stroju, 8 odcieni skóry, 9 kolorów włosów, 8 akcentów i 5 kolorów tkanin, dwie strony lekkiego obrotu i opcjonalną słuchawkę. Wszystkie fryzury i stroje mogą występować u kobiet i mężczyzn. Wygląd pilotów w naborze, załodze, ratunku i panelu wyprawy jest wyliczany z ich stałej tożsamości; zatrudnienie i wczytanie nie losują go ponownie.

Rozmówcy mają osobne, stałe zestawy: Ada Serrin (dowodzenie, bordowy warkocz), dr Ivo Nadir (nauka, ciemne krótkie loki) i Tomas Vale (instruktor, brązowy quiff i pomarańczowy kombinezon). Jest również osobny wzorzec mechaniczki. Wspólne elementy są wektorowe i skalują się do dialogów oraz kart. Format kampanii 65 i dziennika 29 bez zmian. [Szczegóły](implementation-v0.101.md).

## Wdrożenie 0.99 — mapa Układu Słonecznego i panel wyprawy

Zakres autora z 2026-10-20 wdrożony w pierwszej kolejności:

- Pas asteroid tworzy ciągły pierścień na mapie; jeden oznaczony korytarz Przejście przez pas wybiera jego grywalny sektor.
- Mapa ma to samo tło Drogi Mlecznej co pozostałe widoki, przygaszone do 30%, oraz ciepłą poświatę Słońca. Usunięto zbędną dolną wskazówkę o pierścieniu wyboru.
- Pierwsza zakładka Układ słoneczny wybiera obszar następnej wyprawy. Umowna mapa pokazuje centralne Słońce, planety, Księżyc i pas asteroid; pierścień wyróżnia wybrany sektor. Obowiązują istniejące odblokowania kampanii.
- Wybór sektorów usunięto z Wyprawy. Filtry i karty zadań przesunięto wyżej, zwiększając miejsce na treść. Usunięto hasło i dekoracyjne paski spod nazwy stacji.
- Panel stanu sektora pokazuje model aktualnego statku i portret wybranego pilota, z podstawowymi parametrami. Usunięto promień obszaru i rozmiar S/M/L; postęp głównych celów ma własny pasek.
- Nazwa Sektor Ziemia–Księżyc zastępuje Układ Ziemia–Księżyc we wspólnym katalogu sektorów.

Wersja aplikacji 0.99.0, format kampanii 65 i dziennika 29 bez zmian. Szczegóły: [wdrożenie 0.99](implementation-v0.99.md).

## Wdrożenie 0.100 — animowane wypowiedzi i naturalniejsze raporty

Tekst odpraw i komunikatów radiowych pojawia się literka po literce z pauzami przy interpunkcji i cichym, fizycznym pulsem. Enter, Spacja i przycisk najpierw pokazują całą kwestię; kolejne naciśnięcie przechodzi dalej. Przytrzymanie klawisza nie pomija wypowiedzi. Podział wierszy jest stały przez całą animację; okno ustawień zatrzymuje pisanie i jego dźwięk.

Przeredagowano kwestie dowodzenia, naukowca i raporty w locie. Usunięto nieaktualne instrukcje o dostarczaniu surowców, Swifcie i ponownej rozbudowie ukończonego zaplecza. Stan animacji jest wyłącznie prezentacją: nie zmienia zadań, nagród ani formatu zapisu. [Szczegóły wdrożenia](implementation-v0.100.md).

Kolejny zakres po 0.105: dalsze warianty materiałowe i ich właściwości, z zachowaniem priorytetu spójnego początku gry.

## Wdrożenie 0.98 — wyposażenie Księżyca jako paczka na holu

Wyposażenie stacji ma fazę kompletowania (stan Satuk 15 / wymóg i Stwórz) oraz transportu. Zabierz ładunek pobiera pełen komplet części, tworzy jeden obiekt fabularny i od razu rozpoczyna wyprawę z paczką na holu. Nie zajmuje ona ładowni. Pozostaje w świecie po utracie statku, także na powierzchni Księżyca, bez kolejnej opłaty. Kontakt paczki z placówką automatycznie zamyka zadanie i dopiero wtedy tworzy Muła. Poszczególnych części nie można już oddawać zamiast paczki. Późniejsze dostawy minerałów pozostają bez zmian.

Format kampanii 65, dziennik 29. Starsze zapisy odrzucane bez migracji. Szczegóły: [wdrożenie 0.98](implementation-v0.98.md).

## Wdrożenie 0.97 — zapętlona muzyka

`theme_loop.mp3` jest podłączony jako jedna natywna pętla wspólna dla bazy i lotu. Panel ustawień ma osobną regulację i wyciszenie muzyki; wyłączenie pauzuje tę samą instancję, a wznowienie zachowuje pozycję. Usunięto końcowe wygaszanie dla pętli. Sprawdzono rzeczywistą granicę utworu, 100 zmian widoków i ustawienia głośności. Kampania 64 i dziennik 29 bez zmian. [Zakres i sprawdzenia](implementation-v0.97.md).

Kolejny pozostały zakres gospodarki: warianty materiałowe i części II–III oraz ich zastosowanie w konstrukcjach. Rozbudowę dalszych sektorów i oprawę realizujemy etapami według listy poniżej; dawne opisy wykonanych wersji nie są ponownym zleceniem.

## Lifting 0.96 — ukończenie pierwszej rozbudowy i czytelne ulepszenia

Laboratorium i Warsztat tworzą jedną porcję receptury; usunięto przyciski 1/5/10/MAKS. zgodnie z ostatnim ustaleniem autora.

Karty zadań mają wysokość dopasowaną do treści i stronicowanie całych kart. Romb/gwiazda przy tytule zastępują etykiety typu, wymagania otrzymały osobny panel z ikonami, a nagroda oddzieloną stopkę. Dłuższe listy części nie dochodzą do krawędzi; ukończone karty są krótsze. Sprawdzono 81 definicji oraz skróty do receptur i powrót.

Dodatkowo rozróżniono ikony układu zasilania (bateria), maszynerii (koła zębate) i zespołu napędowego (dysza silnika); podtrzymywanie życia pozostaje parą zbiorników.

Przy częściach ulepszania statku dostępne są przyciski Stwórz. Powrót z receptur zachowuje wybrany statek i moduł w Hangarze, również po przejściu przez składniki w Laboratorium.

Pierwsze zaopatrzenie obejmuje zebranie materiałów i ukończenie zaplecza I. Samo oddanie surowców nie zamyka zadania i nie daje questowego PD. Po rozbudowie pilot otrzymuje raz 40 PD. Zebranie surowców jest zachowanym wewnętrznym krokiem, więc przetworzenie ich w części nie zeruje checklisty. Dawne osobne Zaplecze stacji stało się wewnętrznym krokiem tego zadania.

Dziennik ma zakładki Aktywne i Ukończone z licznikami. Ukończone karty nie mają przycisków wykonywania zadania. Usunięto tekst pod listą zadań, wzmiankę o Swifcie w opisie odzysku wraków oraz wskazówkę K do śluzy. W Hangarze efekt ma duże porównanie przed/po i pełny opis, a koszt pokazuje ikony oraz stan/wymaganie części. HUD ma czerwone zdrowie i odsuniętą niebieską tarczę. Raport powrotu ma kafelki surowców z ikoną, przyrostem i stanem magazynu. Usunięto radio potwierdzające zwykłe przekazanie ładunku i wiadomość instruktora o szukaniu drogi.

Przewodniki przedstawia zwój miedzianego kabla, elektronika pozostaje płytką z układem, a moduł osłonowy ma sześciokątny generator zamiast bliźniaczych zbiorników. Ilustracje są wspólne dla receptur, kosztów i magazynu. Kampania 64, dziennik 29; bez migracji starszych zapisów. Weryfikacja obejmuje zmienione początkowe zadanie i podgląd poprawionych ekranów, bez pełnej regresji.

## Lifting 0.95 — zadania, ładownia i nawigacja do produkcji

Pierwsza dostawa na Księżyc to jedno zadanie „Wyposażenie stacji” z listą pięciu części i licznikami dostaw. Dotychczasowe liczniki modułów są wewnętrznymi krokami, bez osobnych kart, celów HUD i powiadomień o pięciu ukończonych zadaniach. Przy częściach znajdują się skróty „Stwórz”. Takie same skróty dodano do kosztów zaplecza, tarcz i hangaru dronów. Historia nawigacji prowadzi z powrotem przez receptury do wcześniejszej zakładki i tej samej strony zadań. Karty w bazie zajmują całą szerokość lewej kolumny, po dwie na stronę. Zadania rozbudowy i ulepszeń mają przyciski do odpowiednich paneli oraz Powrót.

HUD zachowuje podstawowe paski, w tym kolorowy udział zawartości ładowni. Usunięto opis ładunku, przełączników, instruktorów i stały komunikat hipernapędu z lewego górnego obszaru. Lista materiałów zebranych do pierwszego zaopatrzenia pokazuje stan magazynu plus ładowni oraz wymaganie. Szczegóły ładowni są w przebudowanym Tab: kafelki zasobów, liczniki i „Wyrzuć 1”. Zbieranie przełącza się w Tab; X, O i zbędny wybór ładunku B nie sterują już statkiem. Wyrzucenie wyłącza zbieranie, by statek nie podnosił od razu wyrzuconej sztuki; można je wznowić w Tab.

Początkowy obszar ma więcej złóż Cu i Si, a małe fragmenty tych złóż dostarczają po trzy porcje zamiast jednej. Instruktor czeka obok śluzy i nie jest uznawany za przeszkodę przy sprawdzaniu trasy hiperskoku. Kampania 63, dziennik 28, bez migracji wcześniejszych zapisów. Weryfikacja ograniczona do tych zmian; bez pełnej regresji.

## Poprawka 0.94 — stabilność i porządek w pierwszym układzie

Usunięto dawny ratunek promu Swift i powiązane patrole z Aktu I. Pierwszy atak pozostaje po ukończeniu budowy stacji księżycowej. Wraki satelitów mają niezależne pozycje, kąty i kierunki powolnego obrotu. Księżyc odsunięto z 4,5 do 8,5 km od środka obszaru Ziemi; śluza, sonda, złoże, granica świata i sygnały ratunkowe korzystają z nowego zasięgu.

Podejście ukrywa wyłącznie odległą ilustrację Księżyca, którą zastępuje powierzchnia; Ziemia nie jest wyłączana wraz z całą warstwą. Podczas skoku z satelitą hol i statek korzystają z zgodnej interpolacji. Ładowanie płynnie ustawia zestaw do lotu, a naprężanie liny nie konkuruje z przesuwaniem całego zestawu.

Zmniejszono nadmiarową rozdzielczość tekstur napisów na ekranach o wysokim DPR. Utrata kontekstu WebGL zatrzymuje symulację; odzyskanie odtwarza napisy, geometrię i buforowane globy. W przeglądarce wymuszono utratę i odzyskanie GPU: napisy i Ziemia wróciły, animacja ruszyła. Nie odtworzono spontanicznego zawieszenia, więc ta poprawka nie potwierdza jeszcze usunięcia każdej jego możliwej przyczyny. Weryfikacja celowana, bez pełnej regresji. Kampania 62, dziennik 27; starsze zapisy bez migracji. Szczegóły: [wdrożenie 0.94](implementation-v0.94.md).

## Poprawka 0.93 — proporcje Ziemi i Księżyca

Ziemię powiększono, a Księżyc zmniejszono: widoczna średnica Ziemi jest około 3,7 razy większa. Obie skale są zdefiniowane wspólnie dla układu; początkowy rozmiar globu w animacji lądowania korzysta z tej samej skali Księżyca. Głębokości paralaksy pozostają bez zmian. Zapis kampanii bez zmian.

## Poprawka 0.93 — głębia ciał niebieskich

Ziemia i Księżyc nie korzystają już z głębokości 1, czyli płaszczyzny statków i stacji. Ruch względem kamery wynosi odpowiednio 12% i 18% ruchu pierwszego planu. Wspólna warstwa `CelestialLayer` renderuje listę ciał przypisaną do sektora (`SECTOR_CELESTIAL_BODIES`): każde ma własny identyfikator, wygląd, kotwicę, skalę i głębokość. Obsługuje dowolną liczbę ciał i porządkuje je od najdalszego do najbliższego. Kolejne planety lub księżyce nie wymagają wyjątków w `Background`. Grafika menu pozostaje osobna, a dalekie ciała znikają podczas pobytu na powierzchni. Poprawka 0.94 pozostawia Ziemię widoczną w animacji podejścia. Zapis kampanii bez zmian. Celowane sprawdzenie: ruch obu globów przy translacji, obrocie i zoomie, trzy niezależne ciała, zmiana sektora i ukrywanie warstwy; pięć scenariuszy bez pełnej regresji.

## Wdrożenie 0.93 — kompletne dostawy i wspólny zapas napraw

Ładunek zabierany z Satuk 15 służy aktywnej budowie. Usunięto ręczny wybór 0/1/2/5 poszyć oraz osobny natychmiastowy wylot z częściową dostawą. Przycisk „Zabierz ładunek na stację księżycową” (odpowiednio bazę marsjańską lub placówkę Wenus) wybiera pełen pozostały komplet aktualnego etapu. Jest dostępny tylko przy komplecie w magazynie i pojemności wybranego statku wystarczającej na całość. Zwykły wylot nadal jest dostępny bez ładunku. Przy starcie cały manifest jest sprawdzany i pobierany atomowo. Częściowe dostawy wcześniej przekazane na budowę pozostają zapisane; miejscowe wydobycie i praca Muła nie są ograniczane.

Zadania księżycowe podają nazwę materiału/części oraz dostarczone/wymagane. Pierwsze pięć modułów można wytworzyć w Satuk 15 i przewieźć jako komplet 19 części. Późniejsza rozbudowa z żelaza i węgla nadal korzysta z miejscowego wydobycia z Mułem.

Hakowanie, przekierowanie zasilania i pozostałe interakcje nie wymagają przedmiotów w ładowni. Usunięto koszt poszycia oraz informacje o tym koszcie. Zestawy naprawcze mają jeden wspólny zapas: są dostępne w locie, bez pakowania, limitu pokładowego ani zwracania po wyprawie. Produkcja w Satuk 15 i na Księżycu zasila ten sam zapas; dopiero ukończona naprawa zużywa sztukę. Śmierć statku nie usuwa pozostałych zestawów. Muł zachowuje darmową naprawę. Kampania 61, dziennik 26; bez migracji starszych zapisów.

## Wdrożenie 0.92 — czytelne pierwsze zadania i rzeczywiste nagrody

Pierwsze zaopatrzenie sprawdza pełny komplet w magazynie: 4 Fe, 1 C, 4 Cu, 3 Si i 2 O. Składniki pozostają do wykorzystania w Laboratorium i Warsztacie; zadanie ich nie pobiera. Komplet umożliwia wykonanie dwóch poszyć stalowych I, jednej maszynerii I i jednej elektroniki I na zaplecze I. Karta pokazuje osobny stan/wymaganie dla każdego surowca. Nagroda wynosi 20 PD dla wybranego pilota. Kontakt z satelitą daje jeden system podtrzymywania życia zamiast żelaza i poszyć. Dodatkowe Ulepszenie statku daje 15 PD. Usunięto Rezerwę materiałową.

Karty pokazują cel i nagrodę, bez instrukcji obsługi oraz pustego „Premia: brak”. Większe karty, cztery na stronę, mieszczą checklistę i zostawiają odstępy między tytułem, opisem i nagrodą. Instruktor nadal pomaga w obsłudze, ale prowadzi już do całego kompletu surowców. PD są przyznawane raz; nagrody uzyskane podczas lotu są uwzględniane w raporcie powrotu bez ponownej wypłaty. Format kampanii 60, dziennik 25; stare zapisy odrzucane bez migracji. Weryfikacja obejmuje pierwsze zadania i produkcję, bez pełnej regresji.

## Wdrożenie 0.91 — przebudowany Akt I: Ziemia i Księżyc

Zatwierdzony przez autora przebieg zastępuje dawny osobny sektor księżycowy i dwie śluzy do odległego złoża. Gracz zaczyna na orbicie Ziemi: zbiera pierwsze zaopatrzenie i rozbudowuje Satuk 15. Jeden satelita rozszerza ochronę orbity oraz otwiera dwie dwukierunkowe śluzy: na orbitę Księżyca i do wraków satelit. Prospector może używać ich od razu, bez nowego kadłuba lub modułu napędu.

Odzysk trzech satelitów jest zadaniem dodatkowym. Fizyczne holowanie przez śluzę i przekazanie w Satuk 15 daje komplet części do Swifta; każdy wrak rozlicza się raz. Na orbicie Księżyca osobna sonda wymaga synchronizacji. Dopiero ona powiększa ochronę księżycową, otwiera lądowanie i jedną śluzę do dużej, bogatej asteroidy. Oba główne ciała niebieskie istnieją w tej samej przestrzeni orbitalnej. Nowe śluzy, sonda i złoże pojawiają się w trwającym locie.

Ziemia i Księżyc mają jeden dziennik i jeden wybór obszaru w bazie. Podróż odbywa się statkiem i zachowuje wyprawę, ładunek, uszkodzenia oraz wyposażenie. Na powierzchni pozostają dostawy pięciu modułów, lokalne przetwarzanie i rozbudowa z Mułem. Po odbiorze technicznym atak przeciwników rozpoczyna się automatycznie przy stacji. Nie wymaga opcjonalnej obrony przed asteroidami. Zwycięstwo otwiera Marsa, a powrót do Satuk 15 uruchamia rozmowę o pościgu. Ulepszenie dowolnego statku jest dodatkowym celem; Swift ani odzysk satelitów nie blokują głównej ścieżki.

Ochrona oddzielonych obszarów ma czerwone obrysy w świecie i na minimapie; nakładające się bezpieczne okręgi nie tworzą fałszywych granic. Usunięto dodatkowe przekaźniki południowy i zachodni oraz nakładający się dawny węzeł orbitalny. Instruktor prowadzi do śluzy księżycowej. Powracający fracht budowlany trafia do magazynu, bez zużywania go na dodatkową rezerwę żelaza i bez naliczania wydobycia.

Format kampanii 59, dziennik 24. Starsze zapisy są odrzucane, bez migracji. Szczegóły: [wdrożenie 0.91](implementation-v0.91.md). Weryfikacja jest ograniczona do przebudowanego Aktu I, lotu przez śluzy, granic ochrony oraz istniejącej mechaniki księżycowej; bez pełnej regresji. Backlog grafiki asteroid z kuleczkami surowców oraz zapętlonej muzyki `theme_loop.mp3` pozostaje aktualny.

## Wdrożenie 0.90 — hipernapęd dla każdego statku

Nowa decyzja autora zastępuje poprzedni system montażu i poziomów: każdy statek, również początkowy Prospector, korzysta z hipernapędu bez ulepszeń, odblokowań, części i paliwa. To podstawowa mechanika szybkiego przemieszczania przez dostępne śluzy. Usunięto poziomy napędu ze statków i zapisów, zakupy z Hangaru i zwroty kosztów montażu przy złomowaniu. HUD nie informuje już o brakującym module.

Pozostają sterowanie spacją, ładowanie, animacja, kolizje i warunki bezpiecznego rozpoczęcia lotu. Rozwój świata nadal określa, jakie obszary i trasy istnieją; nie kupuje się prawa do użycia napędu. Format kampanii 58, dziennik 23. Dawne zapisy z płatnym napędem są odrzucane. Weryfikacja celowana obejmuje rzeczywisty skok świeżego Prospectora bez zaliczonych zadań i bez zasobów.

## Wdrożenie 0.89 — priorytet grywalnego początku i czytelna produkcja

Po uwadze autora wstrzymano poszerzanie dalszych etapów na rzecz początku gry. Stal: 4 paczki Żelaza (Fe) i 1 dodatku Węgla (C) dają 4 paczki stali. To umowne opakowania o różnych rozmiarach, nie proporcje mas ani liczby atomów w stopie. Pierwsze zaplecze wymaga 2 poszyć stalowych I, 1 maszynerii I i 1 elektroniki I. Można wytworzyć cały komplet od zera z 4 Fe, 1 C, 4 Cu, 3 Si i 2 O, na poziomie 0. Początkowy sektor ma te zasoby oraz żelazo na zadanie 24 Fe bez regenerowania asteroid.

Laboratorium i Warsztat pokazują osobno składniki przed procesem oraz wynik po procesie. Tabela podaje nazwę, stan magazynu i zapotrzebowanie wybranej partii. Wynik podaje stan obecny, przyrost i stan po wykonaniu. Wybór 1/5/10/maks. najpierw przelicza podgląd, a jeden przycisk wykonuje transakcję. Usunięto powielone listy kosztów. Woda pokazuje atomy 2 H + O → H₂O, zgodnie z pobraniem dwóch H, jednego O i wynikiem jednej wody. Każdy materiał ma jedną wspólną grafikę produktu, składnika, magazynu i transferu. Oczyszczona miedź i krzem mają po jednej ikonie produktu. Usunięto dopiski o schemacie partii i licznik partii; opisy zawierają ciekawostki o zastosowaniach materiałów.

Szczegóły: [wdrożenie 0.89](implementation-v0.89.md). Format kampanii 57 odrzuca poprzedni balans. Dziennik pozostaje 23. Weryfikacja celowana: 30 testów obejmujących chemię, początek, pierwsze zaplecze i zakres produkcji księżycowej; bez pełnej regresji. Dalsze prace mają najpierw uwzględniać spójność początku i samouczka.

## Wdrożenie 0.88 — manifesty Marsa i Wenus

Baza marsjańska wymaga pięciu rodzin części (30 sztuk), a placówka Wenus osobnego kompletu (21 sztuk). Po montażu Wenus przyjmuje 6 poszyć lekkich I, 3 układy zasilania I i 2 elektroniki I do osłony słonecznej. Dostawy trafiają fizycznie do placówki przez C lub E. Nie są już opłacane rudą i uniwersalnymi komponentami z menu stacji.

Wspólny manifest uwzględnia dostępny zapas, pojemność statku i wcześniej dostarczone ilości. Dostawy częściowe pozostają na budowie, a nadmiar na statku. Fracht nie nalicza doświadczenia za wydobycie. Montaż i obrona zachowują dotychczasowe warunki. Format kampanii 56, dziennik 23; poprzednie zapisy są odrzucane.

Szczegóły: [wdrożenie 0.88](implementation-v0.88.md). Dalej: warianty materiałowe i części II–III, przebudowa czterech obszarów Ziemi oraz zapętlona muzyka. Lokalne magazyny i ręczna produkcja Marsa/Wenus nie należą do tej paczki.

## Weryfikacja — ustalenie autora

Sprawdzać przede wszystkim zmieniony fragment. Nie uruchamiać pełnej regresji po każdej zmianie. Pełny zestaw tylko przy istotnych zmianach przekrojowych albo konkretnym podejrzeniu regresji; nie powtarzać go bez nowej przyczyny.

## Wdrożenie 0.87 — lokalny magazyn i produkcja na Księżycu

Po uruchomieniu pięciu modułów gracz może zatrzymać się przy placówce i przytrzymać E przez 2 sekundy. Osobne zakładki Laboratorium, Warsztat i Magazyn korzystają wyłącznie z lokalnych zapasów. Menu wstrzymuje lot; powrót do statku zachowuje położenie i trwającą wyprawę. Dostawy budowy i odbiór techniczny mają pierwszeństwo przed otwarciem panelu.

Magazyn jest bez limitu. Odkładanie i zabieranie konkretnych zasobów uwzględnia rzeczywisty ładunek i pojemność statku. Wytwarzanie jest ręczne, zużywa lokalne składniki i odkłada wynik w placówce. Po końcowych dostawach lokalny poziom technologii rośnie z 0 do 1. Zestawy naprawcze mają osobny lokalny zapas; gracz zabiera je na statek do limitu 2. Muł zachowuje darmową samonaprawę.

Zakres i weryfikacja: [wdrożenie 0.87](implementation-v0.87.md). Format kampanii 55 odrzuca starsze zapisy, dziennik pozostaje 22. Manifesty i koszty budowy Marsa oraz Wenus przeniesiono na części w 0.88. Dalej warianty materiałowe, części II–III, cztery obszary Ziemi i zapętlona muzyka `theme_loop.mp3`.

## Wdrożenie 0.86 — manifest i moduły bazy księżycowej

Pierwsza faza budowy wymaga 8 poszyć stalowych I, 4 maszynerii I, 3 elektronik I, 2 układów zasilania I i 2 systemów podtrzymywania życia I. Manifest może przewozić kilka rodzajów części naraz, z zachowaniem limitu ładowni. C i E przekazują wszystkie wymagane rodzaje z aktualnego etapu. Dostawy częściowe pozostają na budowie po utracie statku lub ponownym uruchomieniu gry.

Muł czeka na zamontowanie pięciu modułów. Następnie zbiera i dostarcza Żelazo (Fe) oraz Węgiel (C) do dalszej rozbudowy. Zbiera tylko aktualnie potrzebne pierwiastki i zachowuje darmową samonaprawę. Kadłub odblokowuje odbiór techniczny ukończonych instalacji. Baza ma większą, połączoną konstrukcję z zaokrąglonymi modułami pojawiającymi się po dostawach.

Zakres i ograniczenia: [wdrożenie 0.86](implementation-v0.86.md). Osobny magazyn oraz menu ręcznej produkcji w placówce dodano w 0.87. Manifesty Marsa i Wenus również wymagają przeniesienia na części. Dalej: warianty materiałowe, części II–III, cztery obszary Ziemi i zapętlona muzyka. Format kampanii 54, dziennik 22.

## Wdrożenie 0.85 — urządzenia stacji z części

Zaplecze I–II, podstawowy generator tarczy, hangar dronów, ręczna odbudowa utraconych dronów i osłony kinetyczne I–II wymagają konkretnych części. Zakupy pobierają cały komplet atomowo. Rozbudowa nadal odblokowuje technologie; samo przetwarzanie pozostaje ręczne w Laboratorium i Warsztacie. Magazyn nie ma limitu ani opłat za pojemność.

Wspólny panel kosztów pokazuje ilustracje części, pełne nazwy i stopień skompletowania. Odbudowa dronów wycenia tylko utracone jednostki i nie leczy przy okazji uszkodzonych ocalałych. Pierwiastki do wyprodukowania pierwszego zaplecza są dostępne w początkowym rejonie Ziemi, bez hipernapędu lub wcześniejszej rozbudowy. Format zapisu 53 odrzuca poprzednie koszty.

Zakres: [wdrożenie 0.85](implementation-v0.85.md). Pakiet 0.86 wdraża manifest części i etapową bazę księżycową — najpierw dostawa wyposażenia do własnego przeróbstwa, potem Muł zbierający lokalne pierwiastki. Ten etap obejmie jednocześnie wymagania, dostawy, odblokowanie Muła i widoczne moduły budowy. Stary schemat dostaw księżycowych zastąpiono w 0.86. Warianty materiałowe, części II–III, cztery obszary Ziemi i zapętlona muzyka pozostają w planie.

## Wdrożenie 0.84 — moduły i uzbrojenie z części

Sześć zwykłych modułów statku oraz warianty uzbrojenia wymagają konkretnych części. Kolejny poziom mnoży cały komplet, bez dodatkowej opłaty surowym żelazem lub krzemem. Każdy statek zachowuje własne moduły i zakupione warianty, a zmiana posiadanego uzbrojenia w bazie pozostaje darmowa.

Hangar pokazuje pełne nazwy części przy wybranym module i uzbrojeniu. Zakup pobiera cały komplet atomowo. Złomowanie i recykling własnego wraku liczą połowę łącznej inwestycji z tych samych receptur; duplikat odzyskanego uzbrojenia daje właściwe części. Format zapisu 52 odrzuca starszą gospodarkę.

Zakres: [wdrożenie 0.84](implementation-v0.84.md). Następne kroki: koszty urządzeń stacji i manifesty kampanii, następnie warianty materiałowe oraz części II–III. Cztery obszary Ziemi, etapowa baza księżycowa i zapętlona muzyka pozostają w planie.

## Wdrożenie 0.83 — kadłuby z rodzin części

Stocznia buduje statki z indywidualnych kompletów sześciu rodzin części poziomu I. Zakładka Budowa w panelu statku pokazuje ilustracje, wymagane ilości i braki. Nie kupujemy kadłubów za surowe żelazo; usunięto ich dawne ceny z konfiguracji. Podstawowy napęd i zasilanie są dostępne w początkowym warsztacie, aby nie blokować pierwszych konstrukcji.

Zezłomowanie oraz recykling własnego wraku przy pełnym hangarze zwracają wszystkie właściwe rodziny części. Zwrot obejmuje także inwestycję w hipernapęd. Awaryjny statek zależy od posiadania części do odbudowy, a duży zapas pierwiastków nie blokuje pomocy po utracie ostatniego kadłuba. Format zapisu 51 odrzuca poprzednią gospodarkę.

Zakres i ograniczenia: [wdrożenie 0.83](implementation-v0.83.md). Moduły i uzbrojenie przeniesiono na części w 0.84. Pozostałe kroki: warianty i części II–III, urządzenia stacji oraz manifesty kampanii. Cztery obszary Ziemi i etapowa baza księżycowa nadal pozostają do wdrożenia. Zapętlona muzyka `theme_loop.mp3` pozostaje w planie poniżej.

## Wdrożone — kuleczki pierwiastków na skałach

Asteroidy i skały powierzchniowe mają okrągłe, kolorowe kuleczki zamiast nieregularnych oznaczeń zawartości. Kolory pochodzą z katalogu pierwiastków, a obecność kuleczek wynika z rzeczywistego składu skały lub odłamka. Kuleczki wskazują rodzaje pierwiastków, nie procentowy udział masowy. Usunięto barwienie całego obrazu miedzi, które zmieniało też kolory znaczników. Oznaczenia mają płaskie kolory, zaokrąglenia i brak obrysów.

## Wdrożone 0.97 — zapętlona muzyka w tle

Ustalenie autora z 2026-10-19 zrealizowane: `frontend/assets/sounds/cc0/music/theme_loop.mp3` jest wspólną pętlą bazy i lotu. Respektuje włączenie i głośność muzyki, ma własny suwak w ustawieniach i nie tworzy równoległych kopii przy zmianie widoku. Szczegóły: [wdrożenie 0.97](implementation-v0.97.md).

## Wdrożenie 0.82 — rozpoznawanie złóż i zachowanie składu

Celownik na lokalnej skale pokazuje nazwę złoża i pełny urobek w pierwiastkach, razem z zawartością przyszłych odłamków. Zasięg czujnika wynosi 950 m od statku do powierzchni skały. Odczyt znika po opuszczeniu celu, zniszczeniu skały, przejściu na inną instancję, rozpoczęciu hiperskoku lub utracie statku. Ilości są porcjami gry, nie masą ani procentowym składem chemicznym.

Każda skała otrzymuje deterministyczny, niezmienny plan zawartości przy utworzeniu. Z planu korzystają skaner, rozpad i łup; fragmenty dziedziczą własną część złoża. Zachowano dotychczasowe źródła i wielkości wydobycia, aby ta paczka nie zmieniała równocześnie całego balansu kampanii. Instruktor pobiera najwyżej dwie porcje żelaza, a pozostałe zasoby pozostają w rzeczywistym odłamku. Przy pełnej puli skał zawartość niemożliwego do utworzenia fragmentu trafia do urobku; przy licznych luźnych porcjach powstają pakiety, zamiast utraty minerałów.

Format zapisu pozostaje 50 — nie dodano nowego stanu kampanii. Dalszy zakres: koszty floty i urządzeń oparte na rodzinach części, tiery II–III, manifesty budowy i cztery trwałe obszary Ziemi oraz lokalne przetwarzanie na Księżycu. To nie jest jeszcze nowy system klas mineralogicznych ani realistyczny rozkład składu asteroid.

## Wdrożenie 0.81 — pierwsza paczka gospodarki edukacyjnej

Interfejs po doprecyzowaniu autora: trzy niezależne zakładki w bocznej nawigacji — **Rozbudowa stacji**, **Laboratorium**, **Warsztat**. Rozbudowa ma stale widoczne podzakładki Zaplecze, Tarcze stacji i Drony, które podmieniają zawartość tego samego ekranu bez przejść i strzałek powrotu. Zawierają zakup poziomów zaplecza, tarcze i drony. Hipernapęd znajduje się w Hangarze, w ulepszeniach danego statku. Laboratorium zawiera wyłącznie procesy materiałowe, Warsztat wyłącznie produkcję części; każda zakładka zachowuje własny wybrany przepis. Nie ma wspólnego ekranu „Przemysł”.

Zaimplementowano katalog dziewięciu podstawowych pierwiastków i tytanu z Merkurego, siedem procesów laboratoryjnych oraz jedenaście receptur warsztatowych. Transakcje ręczne obsługują partie 1/5/10/maks., braki składników, poziom warsztatu i badania Merkurego. Są ilustracje cząsteczek, struktur i części, osobny ekran magazynu bez limitu oraz wspólne grafiki łupu i animacji transferu. Usunięto stan zatrudnienia, kolejki pracowników i ich produkcję podczas lotu. Utracone drony odbudowuje się ręcznie w bazie.

Muł gracza i AI naprawia się bez zestawów i surowców; inne statki nadal wymagają zestawów. Usunięto zasób paliwa, zbiorniki, tankowanie i jego koszty. Hipernapęd korzysta ze śluz bez paliwa; montaż wymaga przygotowanych części. Przed wylotem można załadować poszycie do działań w terenie. Manifest ma kontrolę dostępności i pojemności, zachowuje się w zapisie i nie daje doświadczenia za ponowny przywóz własnych zapasów. Format kampanii 50 odrzuca poprzednie zapisy.

To fundament, nie koniec refaktoru. Do następnej paczki pozostają: szczegółowe składy i rozpoznawanie złóż, pełne koszty statków i konstrukcji oparte na rodzinach części, warianty i poziomy II–III, przebudowa manifestów wszystkich aktów oraz samouczek chemiczny. Stare wewnętrzne klucze `ore`, `parts`, `crystals` i `copperOre` oznaczają teraz odpowiednio żelazo, poszycie stalowe I, krzem i miedź; ich nazwy techniczne i starsze opisy fabularne wymagają dalszego porządku. Nie dodano jeszcze czterech trwałych obszarów Ziemi, lokalnej produkcji na Księżycu ani nowego modułowego modelu budowy tej placówki.

## Najnowsze ustalenia autora — 2026-10-19

Ustalenia kierunkowe; stan ich realizacji opisano powyżej. Poniższe zasady zastępują sprzeczne starsze wpisy:

- Muł gracza i AI jako jedyny ma samonaprawę bez zestawów i bez surowców.
- Hipernapęd jest podstawowym wyposażeniem każdego statku, także Prospectora. Bez montażu, poziomów, odblokowań i paliwa; decyzja 0.90 zastępuje wcześniejszy model.
- Jeden sektor ziemski ma cztery trwałe obszary: A orbita Ziemi, B orbita Księżyca z wejściem na powierzchnię, C duży klaster asteroid, D dalsza orbita z wrakami satelitów. Graf śluz: D ↔ A ↔ B ↔ C.
- Budowa bazy księżycowej: dostawy podstawowych części → lokalne przetwórstwo → aktywacja Muła i wydobycie → ukończenie modułowej placówki. Ręczna produkcja gracza jest dostępna także w uruchomionej bazie księżycowej; nie wraca produkcja pracowników w tle.
- Skały i asteroidy dają pierwiastki; wraki pojazdów dają konkretne części. Ikony części wyróżniają się od pierwiastków. Rozładunek do obu stacji pokazuje właściwe grafiki dostarczanych przedmiotów.
- Wygląd bazy księżycowej rozwija się etapami jako duży kompleks kopuł, hal, korytarzy i instalacji w zaokrąglonym stylu gry.

Szczegóły, etapy i kryteria sprawdzenia: [plan refaktoru gospodarki](chemistry-economy-refactor-plan.md).

## Nadrzędny nowy zakres: gospodarka edukacyjna

Autor zlecił na początek plan dużego refaktoru, bez wdrożenia nowej gospodarki: bezlimitowy magazyn, wydobywanie podstawowych pierwiastków, ręczne procesy chemiczne w bazie, produkcja części I–III i budowa z nich statków, osobna rozbudowa stacji oraz usunięcie zatrudnienia pracowników i produkcji podczas lotu. [Szczegółowy plan, zasady edukacyjne, kolejność i testy](chemistry-economy-refactor-plan.md). Ten kierunek zastępuje starsze plany rozbudowy pojemności magazynu i załogi produkcyjnej. Wersja 0.81 wdraża pierwszy etap; zakres pozostały do realizacji opisano powyżej.

## Polityka zapisu od 0.54

Decyzja autora: starsze zapisy są niekompatybilne i nie mogą być otwierane. Nie utrzymujemy migracji ani dziedziczenia floty. Parser przyjmuje tylko aktualny format; przy niezgodności pokazuje komunikat i tworzy nową kampanię. Historyczne opisy migracji nie są wymaganiem dla dalszych prac.

## Nowy kierunek po ukończeniu szkieletu

Autor przekazał zakres etapowej rozbudowy sektorów: dialogi i reżyseria, odblokowania floty, nowe misje i minigry, trudniejsza walka, rozbudowa stacji i gospodarki oraz nowa oprawa. [Pełny backlog, zależności, uwagi i proponowane pakiety](content-development.md). To nadrzędny kierunek dalszego rozwoju; historyczne ograniczenia poniżej nie wykluczają teraz wskazanych funkcji.

Nowy kanon: anomalie są wywołane obecnością obcej cywilizacji. Trzy strony konfliktu to wojsko Ziemi, wroga prywatna organizacja kosmiczna i obcy. Motywacje, relacje, boss i scenariusz ujawnień pozostają otwarte. Wersja 0.53 wdraża pierwszy pakiet: odprawy przy Ziemi i ujawnianie zadań. Pozostałe funkcje listy są backlogiem. Wersja 0.54 dodaje odblokowania i rozkazy zwiadu/walki z odwrotem. Wersja 0.55 wdraża pierwszy łańcuch gospodarki i segmenty magazynowe. Wersja 0.56 wdraża generator tarczy Satuk 15. Wersja 0.57 rozpoczyna pełniejsze misje aktu I minigrą łączności. Wersja 0.58 dodaje eskortę wydobywczą Muła. Wersja 0.59 dodaje misję ratunkową z zabezpieczeniem obwodów i fizycznym holowaniem. Wersja 0.60 rozbudowuje powierzchnię Księżyca o odległy grzbiet miedziowy i przytwierdzone formacje skalne. Wersja 0.61 przenosi eskortę Muła do budowy na Księżycu: wspólne dostawy 160 Fe, wielokrotne kursy, naprawy za własne zasoby i odblokowanie kadłuba po fundamentach. Wersja 0.62 dodaje animowane przejścia między orbitą a powierzchnią. Wersja 0.63 wdraża pierwszą bazę produkującą jednostki: opcjonalną stocznię polową przy Marsie. Wersja 0.64 dodaje drony strażnicze Satuk 15, 0.65 cztery role przeciwników, a 0.66 mieszane fale obrony placówek. Kolejne pakiety określa bieżący plan.

## Aktualizacja autora — 0.79

Cele podejmujemy w świecie, bez wyboru misji przed startem. Odzysk jest trwałą możliwością sektora; nieudana wyprawa nie usuwa wcześniejszego celu. Widok Ratunek pokazuje lokalizacje. Wdrożenie obejmuje także korektę instruktora, jego audio, napędu, podpisów oraz projekcji planet, Drogi Mlecznej i podejścia do Księżyca. [Zakres](implementation-v0.79.md). Ta decyzja ma pierwszeństwo przed historycznymi zasadami wyboru rozkazu i wygasania akcji ratunkowej.

## Uzgodniona kolejność dalszej rozbudowy

1. **Drony strażnicze Satuk 15**: wdrożone w 0.64, budowany hangar, trzy patrole, ograniczony zasięg, naprawa i płatna odbudowa. [Zakres](implementation-v0.64.md).
2. **Zróżnicowani przeciwnicy**: wdrożone w 0.65, przechwytujący, Pancernik, Serwisant i stawiacz min; mieszane składy stoczni marsjańskiej oraz osobny poligon. [Zakres](implementation-v0.65.md).
3. **Obrony baz**: wdrożone w 0.66 — trzy mieszane fale, 6 napastników na Księżycu i Wenus, 9 na Marsie; podejścia spoza aktualnej kamery, bez zapowiedzi kierunku. Tarcza i drony pozostają lokalną ochroną Satuk 15, nie odległych placówek. [Zakres](implementation-v0.66.md).
4. **Hakowanie i minigry**: wdrożone w 0.67 — obwody włamania, przekierowanie zasilania, ślad i alarmy oraz odmienne ułatwienia Sokoła i Feniksa. Uzupełniają istniejące strojenie łączności i naprawę obwodów promu. Kolejne warianty napraw instalacji można rozwijać przy zadaniach sektorów. [Zakres](implementation-v0.67.md).
5. **Merkury i Harpun**: wdrożone w 0.68 — osobna odnoga z odpornym złożem, wydobycie szczękami Harpuna, płyty i moduły osłonowe oraz tarcza kinetyczna I–II. Zadanie dodatkowe prowadzi przez ten łańcuch. [Zakres](implementation-v0.68.md).
6. **Większe sektory i hipernapęd**: pierwszy pakiet wdrożony w 0.69 — ziemska orbita o promieniu 5,5 km, trzy obszary, dwie dwukierunkowe trasy ze śluzami, spacja, ogniwa, produkcja i tankowanie, animacja przelotu i śmiertelne kolizje sprawdzane na całej drodze. Śluzy sprawdzają przejezdność przed startem; nie zapewniają odporności na późniejsze wtargnięcie obiektu. 0.70 dodaje nieregularne ziemskie złoża i fizyczny dryf dalekiego pola, z zapasem miejsca wokół śluz. Dalej: rozbudowa pozostałych sektorów i alternatywne trasy. [Nawigacja](implementation-v0.69.md), [skupiska i dryf](implementation-v0.70.md).
7. **Gospodarka i Satuk 15**: 0.68 wdraża spiek, płyty kinetyczne, moduły osłonowe, dwie receptury, dwa poziomy tarczy i dwa wzmocnione segmenty magazynu po +400. Dalsze rudy, konstrukcje i moduły rozwijać wraz z zadaniami sektorów; ten kierunek pozostaje otwarty.
8. **Dłuższe misje specjalistyczne**: skradanie, przechwycenia, transport i walka; kilka etapów oraz zmiany sytuacji podczas wyprawy.
9. **Powierzchnie, anomalie i unikalne zadania sektorów**: 0.68 dodaje odnogę wydobywczą Merkurego z własną osłoną skalną i zadaniem. Dalej odmienne warunki, przeszkody i cele; 0.75 dodaje pierwszą misję ze skażonym terenem, nieregularnymi pasmami i fizycznym odzyskiem sondy przy Jowiszu. Dalsze układy i sektory pozostają do rozbudowy.
10. **Reżyseria**: animacja śmierci wdrożona w 0.69 — rozpad, utrata sygnału i opóźnione rozliczenie bez dalszego zaliczania celów. 0.107 dodaje wylot, dokowanie, krótkie ujęcia odkryć i niemodalne komentarze oraz ostrzeżenia. Dalej reżyserowane sceny wydarzeń i dialogi właściwe dalszym aktom, po ustaleniu ich treści.
11. **Grafika i piloci**: na prośbę autora priorytet przesunięty przed animacje dokowania. 0.77 wdraża wspólną paletę, interfejs, planety wszystkich sektorów, stację, pastelową flotę i asteroidy. 0.78 usuwa płyty HUD i obrysy, zaokrągla obiekty, stabilizuje tło oraz poprawia wydobycie i lasery jednostek AI. [Korekta](implementation-v0.78.md). 0.101 dodaje różnorodne portrety i stałe wizerunki rozmówców. 0.107 odświeża przeciwników, pierwszą grupę instalacji misji, reakcje trafień oraz teren Księżyca. Dalej kolejne instalacje, oprawa bossów i powierzchnie dalszych planet wraz z ich instancjami. [Pierwszy pakiet](implementation-v0.77.md).
12. **Udźwiękowienie**: 0.76 przegląda sześć paczek (206 nagrań) i wdraża 22 przygotowane efekty z czterech paczek CC0. Zastępuje stare efekty, dodaje hipernapęd i alarm skażenia, wygładzone pętle, rezerwę głosów i przyciszanie maszyn. Dalszy balans odsłuchowy podczas gry pozostaje otwarty. [Zakres](implementation-v0.76.md).
13. **Pełne przejście i balans**: ciągły nowy zapis, ekonomia, odblokowania, czas wypraw, straty i trudność; przygotowane sektory tylko jako uzupełnienie.

Pakiet początku gry: 0.71 wdraża przy Ziemi automatyczne potwierdzenia odczytów przez rozmowę z bazą, animowany transfer C bez dokowania, częściowe dostawy do ziemskich zadań i poprawne otwarcie powrotu po potwierdzonym celu. 0.72 rozszerza cykl na Księżyc: raporty zwiadu, odbioru, ratunku i obrony, odblokowanie powierzchni i Muła podczas lotu oraz transfer C do budowy i Satuk 15 na orbicie. 0.73 dodaje drugiego Prospectora AI przy Ziemi: prowadzenie do bieżącego celu, omijanie skał, radio, oczekiwanie po utracie kontaktu i brak blokady po stracie. 0.74 rozszerza raportowanie na akty II–X: odczyty, patrole, obrony, przeszkody pasa, stocznie i bossów. [Ziemia](implementation-v0.71.md), [Księżyc](implementation-v0.72.md), [instruktor](implementation-v0.73.md). [Pełne uzupełnienie autora oraz zależności](content-development.md#uzupełnienie-autora--2026-10-17). Instruktor przy Ziemi jest wdrożony. Raporty w aktach II–X wdrożone w 0.74; nowe miejsca nadal powstają przy kolejnym wylocie, a fizyczne dostawy wymagają powrotu. [Raportowanie](implementation-v0.74.md). 0.75 wdraża pierwszą misję odzysku przy Jowiszu: skażone pasma, objazd 3/4/5, fizyczny hol sondy i potwierdzenie dostawy przez radio. [Anomalia](implementation-v0.75.md). 0.76 wdraża nowe efekty, pętle i miks z paczek dźwiękowych. [Dźwięki](implementation-v0.76.md). 0.77 rozpoczyna szeroki lifting wyglądu na prośbę autora. [Oprawa](implementation-v0.77.md). Dalej ujednolicenie pozostałych obiektów i pilotów, animacje dokowania i wylotu oraz kolejne warianty unikalnych zadań sektorów.

Scenariusz aktu I rozwijamy równolegle. Kluczowe zwroty, motywacje stron i finał pozostają do wspólnego ustalenia. Ta kolejność ma pierwszeństwo przed dawnymi sugestiami „następny etap” w historycznych raportach.

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

## Etap 0.56 — wdrożony

Generator tarczy odblokowywany po zapleczu ziemskim i montowany z modułów zasilania, Fe i komponentów. Ochrona na orbicie 260 → 850 m, wspólny promień fizyki, AI, pocisków, grafiki i radaru; brak osłony stacji na powierzchniach. Format kampanii 36 bez migracji. [Zakres i weryfikacja](implementation-v0.56.md).

## Etap 0.57 — wdrożony

Ziemski przekaźnik: trzy kanały strojenia fazy, ręczne zatwierdzanie i ponowienie, działająca symulacja pod panelem, przerwanie przez trafienie lub utratę zasięgu oraz rozliczenie raportu po powrocie. [Zakres i weryfikacja](implementation-v0.57.md).

## Etap 0.58 — wdrożony

Dodatkowa ziemska eskorta wydobywcza Muła po uruchomieniu zaplecza. AI wyznacza drogę, czeka na gracza, rozbija skały i zbiera rzeczywistą rudę, a po załadunku wraca do doku. Zasadzka, stan kadłuba, jasna porażka i możliwość ponowienia; rozliczenie po powrocie gracza. Format kampanii 37 i dziennika 16 bez migracji. [Zakres i weryfikacja](implementation-v0.58.md).

## Etap 0.59 — wdrożony

Dodatkowy Sygnał ratunkowy po zwiadzie Księżyca: patrol, minigra łączenia obwodów, fizyczny hol promu, dostawa do Satuk 15 i zatwierdzenie raportu. Uszkodzenia, odłączenie i ponowne podpięcie oraz powtarzalna próba po porażce. Format kampanii 38 i dziennika 17 bez migracji. [Zakres i weryfikacja](implementation-v0.59.md).

## Następne kroki kampanii

- Rozbudować powierzchnię Księżyca: przestrzeń, niszczalne formacje i działania przy placówce.

- Przeprowadzić testy graczy całego aktu I, dopracować tempo, trudność i komunikowanie wymagań.
- Uzupełnić dialogi i oprawę fabularnego zwrotu aktu I po ustaleniu jego treści przez autora.
- Uzupełnić kluczowe ujawnienie aktu VII po ustaleniu jego treści przez autora. Zabezpieczony pakiet obserwacyjny daje punkt zaczepienia do tej sceny.
- Przeprowadzić ciągłe przejście całej kampanii od nowego zapisu: ekonomia, czas wypraw, wymagania wyposażenia, poziomy pilotów i narastanie trudności. Dotychczasowe testy zwykłych wypraw sprawdzają sektory z przygotowanym wejściem, nie zastępują takiej sesji.
- Dopracować różnice sektorów i starć na podstawie testów graczy.
- Uzupełnić fabularny finał aktu X: mechanizm anomalii powodowanych obecnością obcych, motywacje stron, tożsamość bossa i scenariusz ujawnienia. Sandbox pozostaje niezależnym narzędziem regresji.

Pierwotny zarys nie wprowadzał paliwa statków. Uzupełnienie autora z 2026-10-17 dodaje do planu paliwo hipernapędu i drugi Prospector sterowany przez AI; nie oznacza to ręcznego sterowania wieloma jednostkami jednocześnie. Obecność obcych jako źródło anomalii jest już ustalona; ich mechanizm, motywacje stron, tożsamość bossa i dokładna treść kluczowych zwrotów pozostają do napisania. Wersja 0.42 domknęła ciąg mechanik aktu I, 0.44 aktu II, 0.45 przygotowania i obronę aktu III, 0.46 wyprawę aktu IV, 0.47 bazę i walki aktu V, a 0.48 przejście pasa w akcie VI. Dialogi, sceny oraz tempo aktów wymagają dalszego opracowania. Wersja 0.49 dodaje operacyjne cele Jowisza, lecz nie zamyka fabularnego ujawnienia aktu VII. Wersja 0.50 dodaje spokojniejszy operacyjny odcinek Saturna. Wersja 0.51 dodaje operacyjny ciąg Urana i Neptuna oraz pierwszą dwufazową walkę. Wersja 0.52 dodaje Plutona i trzyfazowy mechaniczny finał aktu X.

Balans pozostaje iteracyjny. Pierwsza runda pokazała różnice specjalizacji i dostępność ekonomii; kolejne testy graczy powinny szczególnie ocenić bazowe Widmo przeciw zwrotnym patrolom, wygodę broni wymagających ponawiania naciśnięć oraz tempo rozwoju. Będą też potrzebne dłuższe sesje renderowania i próby na słabszym sprzęcie. Nie są to automatyczne zgody na nowe statki, liftingi ani systemy części.

## Kierunki poza bieżącym zakresem

Wymienne modele części, nowe profesje personelu i kolejne placówki/role przeciwników pozostają propozycjami. Nie są warunkiem rozpoczęcia kampanii ani automatycznie zatwierdzonym zakresem najbliższego etapu. Ewentualny system części wymaga osobnej specyfikacji slotów, kompromisów, montażu i reguł odzysku.

## Świadomie odłożone

- Produkcja przy zamkniętej grze. Obecnie postępuje wyłącznie w czasie symulacji wyprawy.
- Wznowienie aktywnej wyprawy. Odświeżenie nadal rozlicza ją jako przegraną, zgodnie z przyjętą zasadą.

Kampania ma zarys autora, przechodnie mechanicznie akty I–VI i operacyjne zakresy aktów VII–X. Trzy strony konfliktu są ustaleniem fabularnym; osobna reputacja, dyplomacja lub symulacja relacji nie wynikają z tego automatycznie. Multiplayer pozostaje poza zakresem. Nową kolejność rozwoju zawartości opisuje dokument podlinkowany na początku planu.

## Etap 0.60 — wdrożony

Większa powierzchnia Księżyca, opcjonalny grzbiet miedziowy (5), niszczalne przytwierdzone formacje i luźne odłamki. Dotychczasowe trasy dostaw oraz obrona placówki zachowane. [Zakres i weryfikacja](implementation-v0.60.md).

## Etap 0.61 — wdrożony

Eskorta Muła jest częścią głównej budowy na Księżycu. Cel 160 Fe, powtarzane kursy z ładownią 110, naprawy za własne zasoby, wspólne dostawy gracza i transportu, odblokowanie kadłuba po fundamentach. Format kampanii 39 i dziennika 18, bez migracji. [Zakres i weryfikacja](implementation-v0.61.md).

## Etap 0.62 — wdrożony

Animowany transfer orbitalny i powierzchniowy na Księżycu. Wygaszenie podejścia, horyzont i zbliżenie kamery, neutralizacja sterowania oraz pauza świata na czas przelotu. Ładunek, hol i postęp budowy zachowane. [Zakres i weryfikacja](implementation-v0.62.md).

## Etap 0.63 — wdrożony

Stocznia polowa przy Marsie, opcjonalny rozkaz Zatrzymaj produkcję. Posiłki do czterech żywych jednostek, fizycznie niszczalny rdzeń, trwałe wyłączenie po raporcie. Format kampanii 40 i dziennika 19. [Zakres i weryfikacja](implementation-v0.63.md).

## Etap 0.64 — wdrożony

Hangar dronów strażniczych Satuk 15, trzy sojusznicze patrole na orbicie, lokalne wykrywanie i rzeczywisty ostrzał, naprawa w hangarze oraz płatna odbudowa u wolnego mechanika. Kadłub i opłacona odbudowa pozostają zapisane także po stracie statku. Format kampanii 41 i dziennika 19, bez migracji. [Zakres i weryfikacja](implementation-v0.64.md).

## Etap 0.65 — wdrożony

Przechwytujący, Pancernik, Serwisant i stawiacz min; mieszane składy stoczni, poligon Oddział mieszany, leczenie sojuszników, wachlarz salwy i miny z fizycznym rozbrajaniem. Format kampanii 41 i dziennika 19 bez zmian. [Zakres i weryfikacja](implementation-v0.65.md).

## Etap 0.66 — wdrożony

Trzy mieszane fale obrony placówek, rzeczywiste podejścia spoza bieżącej kamery i brak sztucznych wskaźników kierunku. Sprzątanie wyłącznie min danej obrony po jej rozstrzygnięciu lub przerwaniu. Większe składy: Księżyc 6, Wenus 6, Mars 9. [Zakres i weryfikacja](implementation-v0.66.md).

## Etap 0.67 — wdrożony

Dwie minigry terminali: obracane obwody włamania i zachowanie bilansu energii przy przekierowaniu zasilania skanera. Czas działa razem ze światem, błędy zostawiają ślad, alarm sprowadza rzeczywistych strażników, przerwanie pozwala ponowić próbę. Sokół: dłuższe okno i mniej śladu; Feniks: natychmiastowe, głośne przełamanie. Stare liczniki E/G usunięte; kampania 41 i dziennik 19 bez nowych pól. [Zakres i weryfikacja](implementation-v0.67.md).

## Etap 0.68 — wdrożony

Spójny pakiet Merkurego, przemysłu i Satuk 15: sześć odpornych złóż wyrywanych Harpunem, osobna osłonięta odnoga sektora, trzy nowe zasoby, dwie receptury, zadanie Osłona kinetyczna Satuk 15, tarcza I–II (1000/1150 m) i dwa wzmocnione magazyny (+400 każdy). Format kampanii 42 i dziennika 20 bez migracji. Podstawowa ścieżka aktu IV nie wymaga dodatkowej inwestycji. [Zakres i weryfikacja](implementation-v0.68.md).

## Aktualizacja 0.80 — eksploracja

Wdrożono dryf wszystkich asteroid orbitalnych, recykling poza krawędziami, nieregularne pola, nowy wrak, okrągłe zasoby i kolorowy ładunek, przełącznik zbierania/wyrzucanie, montaż hipernapędu I–III i produkcję z H, celownik oraz ograniczenie narzędzi kursorem. Pierwsza sieć magnetyczna działa przy Ziemi z dodatkowymi przekaźnikami. Następne: strefy generowane przez wrogie/obce statki i skażenia w dalszych sektorach, badania wydajności paliwa, balans tras i ekonomii wodoru. Szczegóły: implementation-v0.80.md.
